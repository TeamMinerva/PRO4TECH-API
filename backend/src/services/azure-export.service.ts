import { prisma } from "../lib/prisma";
import {
  AzureDevOpsServiceError,
  createWorkItem,
  getWorkItemTypes,
  type WorkItemTypeSummary,
} from "./azure-devops.service";

export type BacklogItemType = "Epic" | "Feature" | "PBI";
export type BacklogExportItemStatus = "EXPORTED" | "FAILED" | "SKIPPED";

export interface BacklogExportItemResult {
  sourceId: number;
  name: string;
  type: BacklogItemType;
  status: BacklogExportItemStatus;
  azureId?: number;
  url?: string;
  webUrl?: string;
  parentId?: number;
  azureParentId?: number;
  error?: string;
}

export interface BacklogExportSummary {
  total: number;
  exported: number;
  failed: number;
  skipped: number;
}

export interface BacklogExportResult {
  success: boolean;
  message: string;
  projectId: number;
  projectName: string;
  summary: BacklogExportSummary;
  items: BacklogExportItemResult[];
}

export class ProjectNotFoundError extends Error {
  public readonly status = 404;

  constructor(projectId: number) {
    super(`Projeto com ID ${projectId} não foi encontrado.`);
    this.name = "ProjectNotFoundError";
  }
}

export class ExportConflictError extends Error {
  public readonly status = 409;

  constructor(projectId: number) {
    super(
      `Já existe uma exportação para o Azure Boards em andamento para o projeto ${projectId}. Aguarde a conclusão da operação.`,
    );
    this.name = "ExportConflictError";
  }
}

const activeProjectExports = new Set<number>();

const PBI_CANDIDATE_TYPES = [
  "Product Backlog Item",
  "User Story",
  "Requirement",
  "PBI",
];

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function textToHtml(text: string): string {
  return escapeHtml(text.trim()).replace(/\r?\n/g, "<br>");
}

function limitTitle(title: string): string {
  const trimmed = title.trim();
  return (trimmed.length > 0 ? trimmed : "(Sem título)").slice(0, 255);
}

function resolveTypeName(
  availableTypes: WorkItemTypeSummary[],
  candidates: string[],
): string | undefined {
  const enabled = availableTypes.filter((t) => !t.isDisabled);
  for (const candidate of candidates) {
    const match = enabled.find(
      (t) =>
        t.name.toLowerCase() === candidate.toLowerCase() ||
        t.referenceName.toLowerCase() === candidate.toLowerCase(),
    );
    if (match) {
      return match.name;
    }
  }
  return undefined;
}

function formatEpicDescription(epic: {
  description?: string | null;
  objective?: string | null;
  expectedResult?: string | null;
}): string | undefined {
  const sections: string[] = [];

  if (epic.description?.trim()) {
    sections.push(textToHtml(epic.description));
  }
  if (epic.objective?.trim()) {
    sections.push(`<b>Objetivo:</b><br>${textToHtml(epic.objective)}`);
  }
  if (epic.expectedResult?.trim()) {
    sections.push(`<b>Resultado esperado:</b><br>${textToHtml(epic.expectedResult)}`);
  }

  return sections.length > 0 ? sections.join("<br><br>") : undefined;
}

function formatFeatureDescription(feature: {
  description?: string | null;
  approvalCriteria?: string | null;
}): string | undefined {
  const sections: string[] = [];

  if (feature.description?.trim()) {
    sections.push(textToHtml(feature.description));
  }
  if (feature.approvalCriteria?.trim()) {
    sections.push(`<b>Critérios de aprovação:</b><br>${textToHtml(feature.approvalCriteria)}`);
  }

  return sections.length > 0 ? sections.join("<br><br>") : undefined;
}

function formatPbiDescription(pbi: {
  userStory?: string | null;
  developers?: Array<{ id: number; name: string }>;
}): string | undefined {
  const sections: string[] = [];

  if (pbi.userStory?.trim()) {
    sections.push(textToHtml(pbi.userStory));
  }
  if (pbi.developers && pbi.developers.length > 0) {
    const devNames = pbi.developers.map((d) => escapeHtml(d.name)).join(", ");
    sections.push(`<b>Desenvolvedores vinculados:</b> ${devNames}`);
  }

  return sections.length > 0 ? sections.join("<br><br>") : undefined;
}

export async function fetchProjectBacklog(
  projectId: number,
  prismaClient = prisma,
) {
  const project = await prismaClient.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      name: true,
      status: true,
      epics: {
        orderBy: { id: "asc" },
        select: {
          id: true,
          name: true,
          description: true,
          objective: true,
          expectedResult: true,
          projectId: true,
          features: {
            orderBy: { id: "asc" },
            select: {
              id: true,
              name: true,
              description: true,
              approvalCriteria: true,
              epicId: true,
              pbis: {
                orderBy: { id: "asc" },
                select: {
                  id: true,
                  title: true,
                  userStory: true,
                  acceptanceCriteria: true,
                  featureId: true,
                  developers: {
                    select: {
                      id: true,
                      name: true,
                      active: true,
                    },
                    orderBy: { name: "asc" },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!project) {
    throw new ProjectNotFoundError(projectId);
  }

  return project;
}

export interface ExportProjectBacklogOptions {
  prismaClient?: typeof prisma;
  skipConcurrencyCheck?: boolean;
}

export async function exportProjectBacklogToAzure(
  projectId: number,
  options?: ExportProjectBacklogOptions,
): Promise<BacklogExportResult> {
  const db = options?.prismaClient ?? prisma;

  if (!options?.skipConcurrencyCheck) {
    if (activeProjectExports.has(projectId)) {
      throw new ExportConflictError(projectId);
    }
    activeProjectExports.add(projectId);
  }

  try {
    const project = await fetchProjectBacklog(projectId, db);

    const totalEpics = project.epics.length;
    const totalFeatures = project.epics.reduce(
      (sum, e) => sum + e.features.length,
      0,
    );
    const totalPbis = project.epics.reduce(
      (sum, e) =>
        sum + e.features.reduce((fSum, f) => fSum + f.pbis.length, 0),
      0,
    );
    const totalItems = totalEpics + totalFeatures + totalPbis;

    if (totalItems === 0) {
      return {
        success: true,
        message: "O projeto não possui itens de backlog para exportação.",
        projectId: project.id,
        projectName: project.name,
        summary: {
          total: 0,
          exported: 0,
          failed: 0,
          skipped: 0,
        },
        items: [],
      };
    }

    const availableTypes = await getWorkItemTypes();
    const epicTypeName = resolveTypeName(availableTypes, ["Epic"]);
    const featureTypeName = resolveTypeName(availableTypes, ["Feature"]);
    const pbiTypeName = resolveTypeName(availableTypes, PBI_CANDIDATE_TYPES);

    const missingTypes: string[] = [];
    if (!epicTypeName) missingTypes.push("Epic");
    if (!featureTypeName) missingTypes.push("Feature");
    if (!pbiTypeName) missingTypes.push("Product Backlog Item / User Story");

    if (missingTypes.length > 0) {
      throw new AzureDevOpsServiceError(
        `O processo configurado no projeto do Azure DevOps não possui os tipos necessários para exportação: ${missingTypes.join(", ")}.`,
        400,
        { missingTypes, availableTypes: availableTypes.map((t) => t.name) },
      );
    }

    const items: BacklogExportItemResult[] = [];
    const epicAzureMap = new Map<number, number>();
    const featureAzureMap = new Map<number, number>();

    let fatalAuthError: string | null = null;

    const isFatalAuthError = (error: unknown): boolean => {
      if (error instanceof AzureDevOpsServiceError) {
        return error.status === 401 || error.status === 403;
      }
      return false;
    };

    // ETAPA 1 — Exportação dos Epics
    for (const epic of project.epics) {
      const epicTitle = limitTitle(epic.name);

      if (fatalAuthError) {
        items.push({
          sourceId: epic.id,
          name: epicTitle,
          type: "Epic",
          status: "SKIPPED",
          error: `Exportação cancelada devido a falha de autenticação/permissão no Azure DevOps: ${fatalAuthError}`,
        });
        continue;
      }

      try {
        const createdEpic = await createWorkItem(
          {
            type: epicTypeName!,
            title: epicTitle,
            description: formatEpicDescription(epic),
          },
          { availableTypes },
        );

        epicAzureMap.set(epic.id, createdEpic.id);

        items.push({
          sourceId: epic.id,
          name: epicTitle,
          type: "Epic",
          status: "EXPORTED",
          azureId: createdEpic.id,
          url: createdEpic.url,
          webUrl: createdEpic.webUrl,
        });
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Erro desconhecido ao exportar Epic.";

        items.push({
          sourceId: epic.id,
          name: epicTitle,
          type: "Epic",
          status: "FAILED",
          error: errorMessage,
        });

        if (isFatalAuthError(err)) {
          fatalAuthError = errorMessage;
        }
      }
    }

    // ETAPA 2 — Exportação das Features (com vínculo hierárquico ao Epic)
    for (const epic of project.epics) {
      const azureEpicId = epicAzureMap.get(epic.id);

      for (const feature of epic.features) {
        const featureTitle = limitTitle(feature.name);

        if (fatalAuthError) {
          items.push({
            sourceId: feature.id,
            name: featureTitle,
            type: "Feature",
            status: "SKIPPED",
            parentId: epic.id,
            error: `Exportação cancelada devido a falha de autenticação/permissão no Azure DevOps: ${fatalAuthError}`,
          });
          continue;
        }

        if (azureEpicId === undefined) {
          items.push({
            sourceId: feature.id,
            name: featureTitle,
            type: "Feature",
            status: "SKIPPED",
            parentId: epic.id,
            error: `Não exportado porque o Épico pai (ID ${epic.id}) não foi exportado com sucesso.`,
          });
          continue;
        }

        try {
          const createdFeature = await createWorkItem(
            {
              type: featureTypeName!,
              title: featureTitle,
              description: formatFeatureDescription(feature),
              parentId: azureEpicId,
            },
            { availableTypes },
          );

          featureAzureMap.set(feature.id, createdFeature.id);

          items.push({
            sourceId: feature.id,
            name: featureTitle,
            type: "Feature",
            status: "EXPORTED",
            azureId: createdFeature.id,
            parentId: epic.id,
            azureParentId: azureEpicId,
            url: createdFeature.url,
            webUrl: createdFeature.webUrl,
          });
        } catch (err) {
          const errorMessage =
            err instanceof Error ? err.message : "Erro desconhecido ao exportar Feature.";

          items.push({
            sourceId: feature.id,
            name: featureTitle,
            type: "Feature",
            status: "FAILED",
            parentId: epic.id,
            azureParentId: azureEpicId,
            error: errorMessage,
          });

          if (isFatalAuthError(err)) {
            fatalAuthError = errorMessage;
          }
        }
      }
    }

    // ETAPA 3 — Exportação dos PBIs (com vínculo hierárquico à Feature)
    for (const epic of project.epics) {
      for (const feature of epic.features) {
        const azureFeatureId = featureAzureMap.get(feature.id);

        for (const pbi of feature.pbis) {
          const pbiTitle = limitTitle(pbi.title);

          if (fatalAuthError) {
            items.push({
              sourceId: pbi.id,
              name: pbiTitle,
              type: "PBI",
              status: "SKIPPED",
              parentId: feature.id,
              error: `Exportação cancelada devido a falha de autenticação/permissão no Azure DevOps: ${fatalAuthError}`,
            });
            continue;
          }

          if (azureFeatureId === undefined) {
            items.push({
              sourceId: pbi.id,
              name: pbiTitle,
              type: "PBI",
              status: "SKIPPED",
              parentId: feature.id,
              error: `Não exportado porque a Feature pai (ID ${feature.id}) não foi exportada com sucesso.`,
            });
            continue;
          }

          try {
            const rawCriteria = pbi.acceptanceCriteria?.trim();
            const acceptanceCriteria = rawCriteria
              ? textToHtml(rawCriteria)
              : undefined;

            const createdPbi = await createWorkItem(
              {
                type: pbiTypeName!,
                title: pbiTitle,
                description: formatPbiDescription(pbi),
                acceptanceCriteria,
                parentId: azureFeatureId,
              },
              { availableTypes },
            );

            items.push({
              sourceId: pbi.id,
              name: pbiTitle,
              type: "PBI",
              status: "EXPORTED",
              azureId: createdPbi.id,
              parentId: feature.id,
              azureParentId: azureFeatureId,
              url: createdPbi.url,
              webUrl: createdPbi.webUrl,
            });
          } catch (err) {
            const errorMessage =
              err instanceof Error ? err.message : "Erro desconhecido ao exportar PBI.";

            items.push({
              sourceId: pbi.id,
              name: pbiTitle,
              type: "PBI",
              status: "FAILED",
              parentId: feature.id,
              azureParentId: azureFeatureId,
              error: errorMessage,
            });

            if (isFatalAuthError(err)) {
              fatalAuthError = errorMessage;
            }
          }
        }
      }
    }

    const exportedCount = items.filter((i) => i.status === "EXPORTED").length;
    const failedCount = items.filter((i) => i.status === "FAILED").length;
    const skippedCount = items.filter((i) => i.status === "SKIPPED").length;

    const allSuccessful =
      failedCount === 0 && skippedCount === 0 && exportedCount === totalItems;
    const partiallySuccessful = exportedCount > 0 && (failedCount > 0 || skippedCount > 0);

    let message: string;
    if (allSuccessful) {
      message = "Backlog exportado com sucesso para o Azure Boards.";
    } else if (partiallySuccessful) {
      message = "Backlog exportado parcialmente. Alguns itens falharam ou foram ignorados.";
    } else {
      message = "Falha ao exportar o backlog para o Azure Boards.";
    }

    return {
      success: allSuccessful,
      message,
      projectId: project.id,
      projectName: project.name,
      summary: {
        total: totalItems,
        exported: exportedCount,
        failed: failedCount,
        skipped: skippedCount,
      },
      items,
    };
  } finally {
    if (!options?.skipConcurrencyCheck) {
      activeProjectExports.delete(projectId);
    }
  }
}
