import http from "node:http";
import https from "node:https";
import {
  AZURE_DEVOPS_API_VERSION,
  AzureDevOpsConfigError,
  getAzureDevOpsConfig,
  type AzureDevOpsConfig,
} from "../config/azure-devops.config";
import type {
  CreatedWorkItemResponse,
  CreateWorkItemInput,
  CreateWorkItemOptions,
  JsonPatchOperation,
  WorkItemTypeSummary,
} from "../schemas/azure-devops.schema";

export type {
  CreateWorkItemInput,
  CreateWorkItemOptions,
  CreatedWorkItemResponse,
  JsonPatchOperation,
  WorkItemTypeSummary,
};

export class AzureDevOpsServiceError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "AzureDevOpsServiceError";
  }
}

interface AzureHttpResponse {
  status: number;
  headers: http.IncomingHttpHeaders;
  data: unknown;
  rawText: string;
}

interface AzureWorkItemTypeFieldInstanceRaw {
  referenceName?: string;
  name?: string;
}

interface AzureWorkItemTypeRaw {
  name?: string;
  referenceName?: string;
  description?: string;
  color?: string;
  icon?: {
    id?: string;
    url?: string;
  };
  isDisabled?: boolean;
  fields?: AzureWorkItemTypeFieldInstanceRaw[];
  fieldInstances?: AzureWorkItemTypeFieldInstanceRaw[];
}

interface AzureWorkItemTypesListRaw {
  count?: number;
  value?: AzureWorkItemTypeRaw[];
}

interface AzureWorkItemRaw {
  id?: number;
  rev?: number;
  url?: string;
  fields?: Record<string, unknown>;
  relations?: Array<{
    rel?: string;
    url?: string;
    attributes?: Record<string, unknown>;
  }>;
  _links?: {
    html?: {
      href?: string;
    };
  };
}

interface AzureErrorBodyRaw {
  message?: string;
  typeKey?: string;
  errorCode?: number;
  $id?: string;
}

interface WorkItemTypesCacheEntry {
  expiresAt: number;
  types: WorkItemTypeSummary[];
}

const DEFAULT_WORK_ITEM_TYPES_CACHE_TTL_MS = 60_000;
const workItemTypesCache = new Map<string, WorkItemTypesCacheEntry>();

const TYPES_SUPPORTING_ACCEPTANCE_CRITERIA = new Set([
  "user story",
  "product backlog item",
  "pbi",
  "requirement",
  "bug",
  "microsoft.vsts.workitemtypes.userstory",
  "microsoft.vsts.workitemtypes.productbacklogitem",
  "microsoft.vsts.workitemtypes.requirement",
  "microsoft.vsts.workitemtypes.bug",
]);

export function clearWorkItemTypesCache(): void {
  workItemTypesCache.clear();
}

export function supportsAcceptanceCriteria(
  typeNameOrRef: string,
  rawFields?: AzureWorkItemTypeFieldInstanceRaw[],
): boolean {
  if (Array.isArray(rawFields) && rawFields.length > 0) {
    return rawFields.some(
      (f) =>
        typeof f.referenceName === "string" &&
        f.referenceName.toLowerCase() === "microsoft.vsts.common.acceptancecriteria",
    );
  }

  return TYPES_SUPPORTING_ACCEPTANCE_CRITERIA.has(typeNameOrRef.trim().toLowerCase());
}

function requestAzureDevOps(
  url: string,
  options: {
    method: "GET" | "POST" | "PATCH";
    headers: Record<string, string>;
    body?: string;
    timeoutMs: number;
  },
): Promise<AzureHttpResponse> {
  return new Promise((resolve, reject) => {
    const target = new URL(url);
    const client = target.protocol === "https:" ? https : http;

    const requestHeaders: Record<string, string | number> = {
      Accept: "application/json",
      ...options.headers,
    };

    if (options.body !== undefined) {
      requestHeaders["Content-Length"] = Buffer.byteLength(options.body, "utf8");
    }

    const req = client.request(
      target,
      {
        method: options.method,
        headers: requestHeaders,
        timeout: options.timeoutMs,
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (chunk: Buffer) => chunks.push(chunk));
        res.on("error", reject);
        res.on("end", () => {
          const rawText = Buffer.concat(chunks).toString("utf8");
          let data: unknown = null;
          if (rawText.trim().length > 0) {
            try {
              data = JSON.parse(rawText);
            } catch {
              data = null;
            }
          }
          resolve({
            status: res.statusCode ?? 0,
            headers: res.headers,
            data,
            rawText,
          });
        });
      },
    );

    req.on("timeout", () => {
      req.destroy(Object.assign(new Error("timeout"), { name: "TimeoutError" }));
    });
    req.on("error", reject);

    if (options.body !== undefined) {
      req.write(options.body);
    }
    req.end();
  });
}

function resolveConfig(): AzureDevOpsConfig {
  try {
    return getAzureDevOpsConfig();
  } catch (error) {
    if (error instanceof AzureDevOpsConfigError) {
      throw new AzureDevOpsServiceError(error.message, error.status, {
        missingVariables: error.missingVariables,
      });
    }
    throw error;
  }
}

function extractAzureErrorMessage(data: unknown): string | undefined {
  if (typeof data === "object" && data !== null && "message" in data) {
    const msg = (data as AzureErrorBodyRaw).message;
    if (typeof msg === "string" && msg.trim().length > 0) {
      return msg.trim();
    }
  }
  return undefined;
}

function handleAzureErrorResponse(response: AzureHttpResponse): never {
  const azureMessage = extractAzureErrorMessage(response.data);
  const contentType = String(response.headers["content-type"] ?? "").toLowerCase();

  // Azure DevOps retorna 203 Non-Authoritative Information (HTML de login) ou 302 quando o PAT é inválido
  if (
    response.status === 401 ||
    response.status === 203 ||
    response.status === 302 ||
    (response.status >= 200 &&
      response.status < 300 &&
      contentType.includes("text/html"))
  ) {
    throw new AzureDevOpsServiceError(
      "Falha de autenticação no Azure DevOps. Verifique se o Personal Access Token (AZURE_DEVOPS_PAT) é válido e não expirou.",
      401,
      azureMessage ? { azureMessage } : undefined,
    );
  }

  if (response.status === 403) {
    throw new AzureDevOpsServiceError(
      "Permissão negada no Azure DevOps. Verifique se o PAT possui escopo de leitura e escrita em Work Items (vso.work_write).",
      403,
      azureMessage ? { azureMessage } : undefined,
    );
  }

  if (response.status === 404) {
    throw new AzureDevOpsServiceError(
      azureMessage ||
        "Recurso não encontrado no Azure DevOps. Verifique a organização, o projeto, o tipo de Work Item ou o item pai informado.",
      404,
      azureMessage ? { azureMessage } : undefined,
    );
  }

  if (response.status === 400) {
    throw new AzureDevOpsServiceError(
      azureMessage
        ? `Payload inválido rejeitado pelo Azure DevOps: ${azureMessage}`
        : "Payload inválido rejeitado pelo Azure DevOps.",
      400,
      azureMessage ? { azureMessage } : undefined,
    );
  }

  if (response.status === 504) {
    throw new AzureDevOpsServiceError(
      "O Azure DevOps demorou demais para responder. Tente novamente.",
      504,
    );
  }

  if (response.status >= 500) {
    throw new AzureDevOpsServiceError(
      "Serviço do Azure DevOps indisponível no momento.",
      503,
      azureMessage ? { azureMessage } : undefined,
    );
  }

  throw new AzureDevOpsServiceError(
    azureMessage || "Erro inesperado na comunicação com o Azure DevOps.",
    502,
    { upstreamStatus: response.status },
  );
}

async function executeAzureRequest(
  url: string,
  options: {
    method: "GET" | "POST" | "PATCH";
    headers: Record<string, string>;
    body?: string;
    timeoutMs: number;
  },
): Promise<AzureHttpResponse> {
  let response: AzureHttpResponse;
  try {
    response = await requestAzureDevOps(url, options);
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") {
      throw new AzureDevOpsServiceError(
        "O Azure DevOps demorou demais para responder. Tente novamente.",
        504,
      );
    }
    throw new AzureDevOpsServiceError(
      "Serviço do Azure DevOps indisponível no momento (falha de conexão).",
      503,
    );
  }

  const contentType = String(response.headers["content-type"] ?? "").toLowerCase();
  if (
    response.status < 200 ||
    response.status >= 300 ||
    response.status === 203 ||
    contentType.includes("text/html")
  ) {
    handleAzureErrorResponse(response);
  }

  return response;
}

export async function getWorkItemTypes(options?: {
  forceRefresh?: boolean;
  cacheTtlMs?: number;
}): Promise<WorkItemTypeSummary[]> {
  const config = resolveConfig();
  const cacheKey = config.projectApiBaseUrl;
  const now = Date.now();

  if (!options?.forceRefresh) {
    const cached = workItemTypesCache.get(cacheKey);
    if (cached && cached.expiresAt > now) {
      return cached.types;
    }
  }

  const url = `${config.projectApiBaseUrl}/_apis/wit/workitemtypes?api-version=${AZURE_DEVOPS_API_VERSION}`;
  const response = await executeAzureRequest(url, {
    method: "GET",
    headers: {
      Authorization: config.basicAuthHeader,
    },
    timeoutMs: config.timeoutMs,
  });

  const payload = response.data as AzureWorkItemTypesListRaw | null;
  if (!payload || !Array.isArray(payload.value)) {
    throw new AzureDevOpsServiceError(
      "O Azure DevOps retornou um formato inválido ao listar os tipos de Work Items.",
      502,
    );
  }

  const types: WorkItemTypeSummary[] = payload.value
    .filter(
      (item): item is AzureWorkItemTypeRaw & { name: string } =>
        typeof item?.name === "string" && item.name.trim().length > 0,
    )
    .map((item) => {
      const name = item.name.trim();
      const referenceName =
        typeof item.referenceName === "string" && item.referenceName.trim().length > 0
          ? item.referenceName.trim()
          : name;
      const rawFields = item.fields ?? item.fieldInstances;

      return {
        name,
        referenceName,
        description: typeof item.description === "string" ? item.description : "",
        color: typeof item.color === "string" ? item.color : undefined,
        iconUrl: typeof item.icon?.url === "string" ? item.icon.url : undefined,
        isDisabled: Boolean(item.isDisabled),
        supportsAcceptanceCriteria:
          supportsAcceptanceCriteria(name, rawFields) ||
          supportsAcceptanceCriteria(referenceName, rawFields),
      };
    });

  const ttlMs = options?.cacheTtlMs ?? DEFAULT_WORK_ITEM_TYPES_CACHE_TTL_MS;
  workItemTypesCache.set(cacheKey, {
    expiresAt: now + ttlMs,
    types,
  });

  return types;
}

function resolveWorkItemType(
  requestedType: string,
  availableTypes: WorkItemTypeSummary[],
): WorkItemTypeSummary {
  const normalizedRequested = requestedType.trim().replace(/^\$/, "").toLowerCase();

  const matched = availableTypes.find(
    (t) =>
      t.name.toLowerCase() === normalizedRequested ||
      t.referenceName.toLowerCase() === normalizedRequested,
  );

  const enabledTypes = availableTypes.filter((t) => !t.isDisabled).map((t) => t.name);

  if (!matched) {
    throw new AzureDevOpsServiceError(
      `O tipo de Work Item "${requestedType}" não existe no processo configurado para este projeto no Azure DevOps. Tipos disponíveis: ${enabledTypes.join(", ") || "nenhum"}.`,
      400,
      { requestedType, availableTypes: enabledTypes },
    );
  }

  if (matched.isDisabled) {
    throw new AzureDevOpsServiceError(
      `O tipo de Work Item "${matched.name}" está desabilitado no processo deste projeto no Azure DevOps.`,
      400,
      { requestedType: matched.name, availableTypes: enabledTypes },
    );
  }

  return matched;
}

export function buildWorkItemPatchDocument(
  input: CreateWorkItemInput,
  config: Pick<AzureDevOpsConfig, "projectApiBaseUrl">,
  typeSummary?: Pick<WorkItemTypeSummary, "name" | "supportsAcceptanceCriteria">,
): JsonPatchOperation[] {
  const patchDocument: JsonPatchOperation[] = [
    {
      op: "add",
      path: "/fields/System.Title",
      value: input.title.trim(),
    },
  ];

  if (input.description && input.description.trim().length > 0) {
    patchDocument.push({
      op: "add",
      path: "/fields/System.Description",
      value: input.description.trim(),
    });
  }

  const canIncludeAcceptanceCriteria =
    typeSummary !== undefined
      ? typeSummary.supportsAcceptanceCriteria
      : supportsAcceptanceCriteria(input.type);

  if (
    canIncludeAcceptanceCriteria &&
    input.acceptanceCriteria &&
    input.acceptanceCriteria.trim().length > 0
  ) {
    patchDocument.push({
      op: "add",
      path: "/fields/Microsoft.VSTS.Common.AcceptanceCriteria",
      value: input.acceptanceCriteria.trim(),
    });
  }

  if (input.assignedTo && input.assignedTo.trim().length > 0) {
    patchDocument.push({
      op: "add",
      path: "/fields/System.AssignedTo",
      value: input.assignedTo.trim(),
    });
  }

  if (input.state && input.state.trim().length > 0) {
    patchDocument.push({
      op: "add",
      path: "/fields/System.State",
      value: input.state.trim(),
    });
  }

  if (input.priority !== undefined) {
    patchDocument.push({
      op: "add",
      path: "/fields/Microsoft.VSTS.Common.Priority",
      value: input.priority,
    });
  }

  if (input.tags && input.tags.length > 0) {
    const formattedTags = input.tags
      .map((tag) => tag.trim())
      .filter(Boolean)
      .join("; ");
    if (formattedTags.length > 0) {
      patchDocument.push({
        op: "add",
        path: "/fields/System.Tags",
        value: formattedTags,
      });
    }
  }

  if (input.additionalFields) {
    for (const [rawFieldPath, value] of Object.entries(input.additionalFields)) {
      if (value === undefined) continue;
      const trimmedField = rawFieldPath.trim();
      if (!trimmedField) continue;
      const normalizedPath = trimmedField.startsWith("/fields/")
        ? trimmedField
        : `/fields/${trimmedField.replace(/^\/+/, "")}`;
      patchDocument.push({
        op: "add",
        path: normalizedPath,
        value,
      });
    }
  }

  if (input.parentId !== undefined) {
    patchDocument.push({
      op: "add",
      path: "/relations/-",
      value: {
        rel: "System.LinkTypes.Hierarchy-Reverse",
        url: `${config.projectApiBaseUrl}/_apis/wit/workItems/${input.parentId}`,
        attributes: {
          comment: "Vínculo hierárquico criado via API Pro4Tech",
        },
      },
    });
  }

  return patchDocument;
}

export async function createWorkItem(
  input: CreateWorkItemInput,
  options?: CreateWorkItemOptions,
): Promise<CreatedWorkItemResponse> {
  const config = resolveConfig();

  let matchedType: WorkItemTypeSummary | undefined;
  if (!options?.skipTypeValidation) {
    const availableTypes = options?.availableTypes ?? (await getWorkItemTypes());
    matchedType = resolveWorkItemType(input.type, availableTypes);
  }

  const canonicalTypeName = matchedType
    ? matchedType.name
    : input.type.trim().replace(/^\$/, "");

  const patchDocument = buildWorkItemPatchDocument(input, config, matchedType);
  const url = `${config.projectApiBaseUrl}/_apis/wit/workitems/$${encodeURIComponent(canonicalTypeName)}?api-version=${AZURE_DEVOPS_API_VERSION}`;

  const response = await executeAzureRequest(url, {
    method: "POST",
    headers: {
      Authorization: config.basicAuthHeader,
      "Content-Type": "application/json-patch+json",
    },
    body: JSON.stringify(patchDocument),
    timeoutMs: config.timeoutMs,
  });

  const created = response.data as AzureWorkItemRaw | null;
  if (!created || typeof created.id !== "number") {
    throw new AzureDevOpsServiceError(
      "O Azure DevOps retornou uma resposta inválida ao criar o Work Item.",
      502,
    );
  }

  const fields = created.fields ?? {};
  const title =
    typeof fields["System.Title"] === "string"
      ? fields["System.Title"]
      : input.title.trim();
  const type =
    typeof fields["System.WorkItemType"] === "string"
      ? fields["System.WorkItemType"]
      : canonicalTypeName;
  const state =
    typeof fields["System.State"] === "string" ? fields["System.State"] : undefined;
  const description =
    typeof fields["System.Description"] === "string"
      ? fields["System.Description"]
      : undefined;
  const acceptanceCriteria =
    typeof fields["Microsoft.VSTS.Common.AcceptanceCriteria"] === "string"
      ? fields["Microsoft.VSTS.Common.AcceptanceCriteria"]
      : undefined;

  return {
    id: created.id,
    rev: typeof created.rev === "number" ? created.rev : 1,
    type,
    title,
    state,
    description,
    acceptanceCriteria,
    parentId: input.parentId,
    url: typeof created.url === "string" ? created.url : url,
    webUrl:
      typeof created._links?.html?.href === "string"
        ? created._links.html.href
        : undefined,
    fields,
  };
}

export async function linkWorkItemHierarchy(
  childId: number,
  parentId: number,
  comment = "Vínculo hierárquico criado via API Pro4Tech",
): Promise<void> {
  const config = resolveConfig();
  const patchDocument: JsonPatchOperation[] = [
    {
      op: "add",
      path: "/relations/-",
      value: {
        rel: "System.LinkTypes.Hierarchy-Reverse",
        url: `${config.projectApiBaseUrl}/_apis/wit/workItems/${parentId}`,
        attributes: {
          comment,
        },
      },
    },
  ];

  const url = `${config.projectApiBaseUrl}/_apis/wit/workitems/${childId}?api-version=${AZURE_DEVOPS_API_VERSION}`;

  await executeAzureRequest(url, {
    method: "PATCH",
    headers: {
      Authorization: config.basicAuthHeader,
      "Content-Type": "application/json-patch+json",
    },
    body: JSON.stringify(patchDocument),
    timeoutMs: config.timeoutMs,
  });
}

