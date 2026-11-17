import assert from "node:assert/strict";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { test } from "node:test";
import app from "../src/app";
import {
  clearWorkItemTypesCache,
  type JsonPatchOperation,
} from "../src/services/azure-devops.service";
import {
  exportProjectBacklogToAzure,
  ExportConflictError,
  ProjectNotFoundError,
} from "../src/services/azure-export.service";

test("Azure Boards Backlog Export Flow (12 Scenarios & Express Endpoints)", async (t) => {
  let mockStatus = 200;
  let mockContentType = "application/json";
  let receivedRequests: Array<{
    url: string;
    method: string;
    body: JsonPatchOperation[];
  }> = [];
  let shouldFailItemNames = new Set<string>();
  let failParentLink = false;
  let nextWorkItemId = 1000;

  const mockTypesPayload = {
    count: 3,
    value: [
      {
        name: "Epic",
        referenceName: "Microsoft.VSTS.WorkItemTypes.Epic",
        description: "Epics",
        isDisabled: false,
      },
      {
        name: "Feature",
        referenceName: "Microsoft.VSTS.WorkItemTypes.Feature",
        description: "Features",
        isDisabled: false,
      },
      {
        name: "User Story",
        referenceName: "Microsoft.VSTS.WorkItemTypes.UserStory",
        description: "User Stories",
        isDisabled: false,
        fields: [
          { referenceName: "Microsoft.VSTS.Common.AcceptanceCriteria" },
        ],
      },
    ],
  };

  const mockAzureServer = createServer((req: IncomingMessage, res: ServerResponse) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => {
      const url = req.url ?? "";
      const method = req.method ?? "";
      let body: JsonPatchOperation[] = [];

      const rawBody = Buffer.concat(chunks).toString("utf8");
      if (rawBody) {
        try {
          body = JSON.parse(rawBody) as JsonPatchOperation[];
        } catch {
          body = [];
        }
      }

      receivedRequests.push({ url, method, body });

      if (mockStatus !== 200 && mockStatus !== 201) {
        res.writeHead(mockStatus, { "Content-Type": mockContentType });
        res.end(
          mockContentType.includes("text/html")
            ? "<html><body>Sign in</body></html>"
            : JSON.stringify({ message: `Simulated Azure error ${mockStatus}` }),
        );
        return;
      }

      if (method === "GET" && url.includes("/_apis/wit/workitemtypes")) {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(mockTypesPayload));
        return;
      }

      if (method === "POST" && url.includes("/_apis/wit/workitems/")) {
        const titleOp = body.find((op) => op.path === "/fields/System.Title");
        const title = String(titleOp?.value ?? "");
        const parentOp = body.find((op) => op.path === "/relations/-");

        if (failParentLink && parentOp) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              message: "TF400898: An Internal Error Occurred. Invalid parent link relation.",
            }),
          );
          return;
        }

        if (shouldFailItemNames.has(title)) {
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              message: `Simulated Azure failure for item "${title}".`,
            }),
          );
          return;
        }

        nextWorkItemId += 1;
        const assignedId = nextWorkItemId;
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            id: assignedId,
            rev: 1,
            url: `http://127.0.0.1/mock-org/mock-proj/_apis/wit/workItems/${assignedId}`,
            fields: {
              "System.Title": title,
            },
            _links: {
              html: {
                href: `https://dev.azure.com/mock-org/mock-proj/_workitems/edit/${assignedId}`,
              },
            },
          }),
        );
        return;
      }

      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ message: "Not found" }));
    });
  });

  await new Promise<void>((resolve) => mockAzureServer.listen(0, "127.0.0.1", resolve));
  const azureAddress = mockAzureServer.address();
  assert.ok(azureAddress && typeof azureAddress !== "string");

  const apiServer = createServer(app);
  await new Promise<void>((resolve) => apiServer.listen(0, "127.0.0.1", resolve));
  const apiAddress = apiServer.address();
  assert.ok(apiAddress && typeof apiAddress !== "string");
  const apiBaseUrl = `http://127.0.0.1:${apiAddress.port}`;

  const resetEnvAndState = () => {
    process.env.AZURE_DEVOPS_ORG = "mock-org";
    process.env.AZURE_DEVOPS_PROJECT = "mock-proj";
    process.env.AZURE_DEVOPS_PAT = "mock-pat-secret";
    process.env.AZURE_DEVOPS_BASE_URL = `http://127.0.0.1:${azureAddress.port}`;
    process.env.AZURE_DEVOPS_REQUIRE_AUTH = "false";
    mockStatus = 200;
    mockContentType = "application/json";
    receivedRequests = [];
    shouldFailItemNames.clear();
    failParentLink = false;
    clearWorkItemTypesCache();
  };

  try {
    // -----------------------------------------------------------------------------------
    // CENÁRIO 1: Projeto com um Epic, uma Feature e um PBI
    // -----------------------------------------------------------------------------------
    await t.test("Cenário 1: Projeto com 1 Epic, 1 Feature e 1 PBI exportados com hierarquia", async () => {
      resetEnvAndState();

      const mockDb = {
        project: {
          findUnique: async () => ({
            id: 1,
            name: "Projeto Simples",
            status: "PLANNED",
            epics: [
              {
                id: 10,
                name: "Épico Autenticação",
                description: "Módulo de autenticação",
                objective: "Permitir login seguro",
                expectedResult: "Usuário autenticado",
                projectId: 1,
                features: [
                  {
                    id: 20,
                    name: "Feature Login",
                    description: "Tela de login",
                    approvalCriteria: "Validar credenciais",
                    epicId: 10,
                    pbis: [
                      {
                        id: 30,
                        title: "PBI Form de Login",
                        userStory: "Como usuário quero logar",
                        acceptanceCriteria: "Campos obrigatórios validados",
                        featureId: 20,
                        developers: [{ id: 1, name: "Maria Silva", active: true }],
                      },
                    ],
                  },
                ],
              },
            ],
          }),
        },
      } as any;

      const result = await exportProjectBacklogToAzure(1, {
        prismaClient: mockDb,
        skipConcurrencyCheck: true,
      });

      assert.equal(result.success, true);
      assert.equal(result.summary.total, 3);
      assert.equal(result.summary.exported, 3);
      assert.equal(result.summary.failed, 0);
      assert.equal(result.summary.skipped, 0);
      assert.equal(result.items.length, 3);

      const [epicResult, featureResult, pbiResult] = result.items;
      assert.equal(epicResult.status, "EXPORTED");
      assert.equal(epicResult.type, "Epic");
      assert.ok(epicResult.azureId);

      assert.equal(featureResult.status, "EXPORTED");
      assert.equal(featureResult.type, "Feature");
      assert.equal(featureResult.azureParentId, epicResult.azureId);

      assert.equal(pbiResult.status, "EXPORTED");
      assert.equal(pbiResult.type, "PBI");
      assert.equal(pbiResult.azureParentId, featureResult.azureId);

      // Valida ordem das chamadas à API: Epic antes de Feature, Feature antes de PBI
      const postRequests = receivedRequests.filter((r) => r.method === "POST");
      assert.equal(postRequests.length, 3);
      assert.ok(postRequests[0].url.includes("$Epic"));
      assert.ok(postRequests[1].url.includes("$Feature"));
      assert.ok(postRequests[2].url.includes("$User%20Story"));
    });

    // -----------------------------------------------------------------------------------
    // CENÁRIO 2: Projeto com múltiplos Epics, Features e PBIs
    // -----------------------------------------------------------------------------------
    await t.test("Cenário 2: Projeto com múltiplos Epics, Features e PBIs", async () => {
      resetEnvAndState();

      const mockDb = {
        project: {
          findUnique: async () => ({
            id: 2,
            name: "Projeto Grande",
            status: "IN_PROGRESS",
            epics: [
              {
                id: 11,
                name: "Épico 1",
                description: "Desc 1",
                objective: "Obj 1",
                expectedResult: "Res 1",
                projectId: 2,
                features: [
                  {
                    id: 21,
                    name: "Feature 1.1",
                    description: "FDesc 1.1",
                    approvalCriteria: "Crit 1.1",
                    epicId: 11,
                    pbis: [
                      {
                        id: 31,
                        title: "PBI 1.1.1",
                        userStory: "US 1.1.1",
                        acceptanceCriteria: "AC 1.1.1",
                        featureId: 21,
                        developers: [],
                      },
                      {
                        id: 32,
                        title: "PBI 1.1.2",
                        userStory: "US 1.1.2",
                        acceptanceCriteria: "AC 1.1.2",
                        featureId: 21,
                        developers: [],
                      },
                    ],
                  },
                ],
              },
              {
                id: 12,
                name: "Épico 2",
                description: "Desc 2",
                objective: "Obj 2",
                expectedResult: "Res 2",
                projectId: 2,
                features: [
                  {
                    id: 22,
                    name: "Feature 2.1",
                    description: "FDesc 2.1",
                    approvalCriteria: "Crit 2.1",
                    epicId: 12,
                    pbis: [
                      {
                        id: 33,
                        title: "PBI 2.1.1",
                        userStory: "US 2.1.1",
                        acceptanceCriteria: "AC 2.1.1",
                        featureId: 22,
                        developers: [],
                      },
                    ],
                  },
                ],
              },
            ],
          }),
        },
      } as any;

      const result = await exportProjectBacklogToAzure(2, {
        prismaClient: mockDb,
        skipConcurrencyCheck: true,
      });

      assert.equal(result.success, true);
      assert.equal(result.summary.total, 7);
      assert.equal(result.summary.exported, 7);
      assert.equal(result.summary.failed, 0);
      assert.equal(result.summary.skipped, 0);
    });

    // -----------------------------------------------------------------------------------
    // CENÁRIO 3: Projeto sem itens no backlog
    // -----------------------------------------------------------------------------------
    await t.test("Cenário 3: Projeto sem itens no backlog", async () => {
      resetEnvAndState();

      const mockDb = {
        project: {
          findUnique: async () => ({
            id: 3,
            name: "Projeto Vazio",
            status: "PLANNED",
            epics: [],
          }),
        },
      } as any;

      const result = await exportProjectBacklogToAzure(3, {
        prismaClient: mockDb,
        skipConcurrencyCheck: true,
      });

      assert.equal(result.success, true);
      assert.equal(result.summary.total, 0);
      assert.equal(result.summary.exported, 0);
      assert.equal(result.items.length, 0);
      assert.ok(result.message.includes("não possui itens de backlog"));
    });

    // -----------------------------------------------------------------------------------
    // CENÁRIO 4: Projeto inexistente
    // -----------------------------------------------------------------------------------
    await t.test("Cenário 4: Projeto inexistente lança ProjectNotFoundError", async () => {
      resetEnvAndState();

      const mockDb = {
        project: {
          findUnique: async () => null,
        },
      } as any;

      await assert.rejects(
        () =>
          exportProjectBacklogToAzure(999, {
            prismaClient: mockDb,
            skipConcurrencyCheck: true,
          }),
        (err) => err instanceof ProjectNotFoundError && err.status === 404,
      );
    });

    // -----------------------------------------------------------------------------------
    // CENÁRIO 5: Falha na criação de um Epic (descendentes marcados como SKIPPED)
    // -----------------------------------------------------------------------------------
    await t.test("Cenário 5: Falha na criação de um Epic ignora Features/PBIs dependentes", async () => {
      resetEnvAndState();
      shouldFailItemNames.add("Épico Que Falha");

      const mockDb = {
        project: {
          findUnique: async () => ({
            id: 5,
            name: "Projeto com Falha de Épico",
            status: "PLANNED",
            epics: [
              {
                id: 50,
                name: "Épico Que Falha",
                description: "",
                objective: "",
                expectedResult: "",
                projectId: 5,
                features: [
                  {
                    id: 51,
                    name: "Feature Dependente",
                    description: "",
                    approvalCriteria: "",
                    epicId: 50,
                    pbis: [
                      {
                        id: 52,
                        title: "PBI Dependente",
                        userStory: "",
                        acceptanceCriteria: "",
                        featureId: 51,
                        developers: [],
                      },
                    ],
                  },
                ],
              },
              {
                id: 60,
                name: "Épico Independente",
                description: "",
                objective: "",
                expectedResult: "",
                projectId: 5,
                features: [
                  {
                    id: 61,
                    name: "Feature Independente",
                    description: "",
                    approvalCriteria: "",
                    epicId: 60,
                    pbis: [],
                  },
                ],
              },
            ],
          }),
        },
      } as any;

      const result = await exportProjectBacklogToAzure(5, {
        prismaClient: mockDb,
        skipConcurrencyCheck: true,
      });

      assert.equal(result.success, false);
      assert.equal(result.summary.total, 5);
      assert.equal(result.summary.exported, 2); // Epic 60 e Feature 61
      assert.equal(result.summary.failed, 1); // Epic 50
      assert.equal(result.summary.skipped, 2); // Feature 51 e PBI 52

      const failedEpic = result.items.find((i) => i.sourceId === 50);
      assert.equal(failedEpic?.status, "FAILED");

      const skippedFeature = result.items.find((i) => i.sourceId === 51);
      assert.equal(skippedFeature?.status, "SKIPPED");
      assert.ok(skippedFeature?.error?.includes("Épico pai"));

      const skippedPbi = result.items.find((i) => i.sourceId === 52);
      assert.equal(skippedPbi?.status, "SKIPPED");
    });

    // -----------------------------------------------------------------------------------
    // CENÁRIO 6: Falha na criação de uma Feature (PBIs dependentes SKIPPED)
    // -----------------------------------------------------------------------------------
    await t.test("Cenário 6: Falha na criação de uma Feature pula seus PBIs", async () => {
      resetEnvAndState();
      shouldFailItemNames.add("Feature Com Falha");

      const mockDb = {
        project: {
          findUnique: async () => ({
            id: 6,
            name: "Projeto Falha Feature",
            status: "PLANNED",
            epics: [
              {
                id: 10,
                name: "Épico Bom",
                description: "",
                objective: "",
                expectedResult: "",
                projectId: 6,
                features: [
                  {
                    id: 20,
                    name: "Feature Com Falha",
                    description: "",
                    approvalCriteria: "",
                    epicId: 10,
                    pbis: [
                      {
                        id: 30,
                        title: "PBI Filho da Falha",
                        userStory: "",
                        acceptanceCriteria: "",
                        featureId: 20,
                        developers: [],
                      },
                    ],
                  },
                  {
                    id: 21,
                    name: "Feature Boa",
                    description: "",
                    approvalCriteria: "",
                    epicId: 10,
                    pbis: [
                      {
                        id: 31,
                        title: "PBI Filho da Boa",
                        userStory: "",
                        acceptanceCriteria: "",
                        featureId: 21,
                        developers: [],
                      },
                    ],
                  },
                ],
              },
            ],
          }),
        },
      } as any;

      const result = await exportProjectBacklogToAzure(6, {
        prismaClient: mockDb,
        skipConcurrencyCheck: true,
      });

      assert.equal(result.success, false);
      assert.equal(result.summary.total, 5);
      assert.equal(result.summary.exported, 3); // Epic 10, Feature 21, PBI 31
      assert.equal(result.summary.failed, 1); // Feature 20
      assert.equal(result.summary.skipped, 1); // PBI 30

      const featureFail = result.items.find((i) => i.sourceId === 20);
      assert.equal(featureFail?.status, "FAILED");

      const pbiSkip = result.items.find((i) => i.sourceId === 30);
      assert.equal(pbiSkip?.status, "SKIPPED");
      assert.ok(pbiSkip?.error?.includes("Feature pai"));
    });

    // -----------------------------------------------------------------------------------
    // CENÁRIO 7: Falha na criação de um PBI
    // -----------------------------------------------------------------------------------
    await t.test("Cenário 7: Falha na criação de um PBI não interrompe outros PBIs", async () => {
      resetEnvAndState();
      shouldFailItemNames.add("PBI Que Falha");

      const mockDb = {
        project: {
          findUnique: async () => ({
            id: 7,
            name: "Projeto Falha PBI",
            status: "PLANNED",
            epics: [
              {
                id: 10,
                name: "Épico",
                description: "",
                objective: "",
                expectedResult: "",
                projectId: 7,
                features: [
                  {
                    id: 20,
                    name: "Feature",
                    description: "",
                    approvalCriteria: "",
                    epicId: 10,
                    pbis: [
                      {
                        id: 31,
                        title: "PBI Que Falha",
                        userStory: "",
                        acceptanceCriteria: "",
                        featureId: 20,
                        developers: [],
                      },
                      {
                        id: 32,
                        title: "PBI Que Funciona",
                        userStory: "",
                        acceptanceCriteria: "",
                        featureId: 20,
                        developers: [],
                      },
                    ],
                  },
                ],
              },
            ],
          }),
        },
      } as any;

      const result = await exportProjectBacklogToAzure(7, {
        prismaClient: mockDb,
        skipConcurrencyCheck: true,
      });

      assert.equal(result.summary.total, 4);
      assert.equal(result.summary.exported, 3);
      assert.equal(result.summary.failed, 1);
      assert.equal(result.summary.skipped, 0);

      const pbiFail = result.items.find((i) => i.sourceId === 31);
      assert.equal(pbiFail?.status, "FAILED");

      const pbiOk = result.items.find((i) => i.sourceId === 32);
      assert.equal(pbiOk?.status, "EXPORTED");
    });

    // -----------------------------------------------------------------------------------
    // CENÁRIO 8: Falha ao criar relacionamento hierárquico
    // -----------------------------------------------------------------------------------
    await t.test("Cenário 8: Falha no relacionamento hierárquico registra FAILED", async () => {
      resetEnvAndState();
      failParentLink = true; // Simula Azure rejeitando relação pai-filho

      const mockDb = {
        project: {
          findUnique: async () => ({
            id: 8,
            name: "Projeto Falha Link",
            status: "PLANNED",
            epics: [
              {
                id: 10,
                name: "Épico Pai",
                description: "",
                objective: "",
                expectedResult: "",
                projectId: 8,
                features: [
                  {
                    id: 20,
                    name: "Feature Com Link Quebrado",
                    description: "",
                    approvalCriteria: "",
                    epicId: 10,
                    pbis: [],
                  },
                ],
              },
            ],
          }),
        },
      } as any;

      const result = await exportProjectBacklogToAzure(8, {
        prismaClient: mockDb,
        skipConcurrencyCheck: true,
      });

      const featureItem = result.items.find((i) => i.sourceId === 20);
      assert.equal(featureItem?.status, "FAILED");
      assert.ok(featureItem?.error?.includes("Invalid parent link relation"));
    });

    // -----------------------------------------------------------------------------------
    // CENÁRIO 9: Falha de autenticação no Azure DevOps
    // -----------------------------------------------------------------------------------
    await t.test("Cenário 9: Falha de autenticação no Azure DevOps interrompe com erro claro", async () => {
      resetEnvAndState();
      mockStatus = 401; // Simula 401 Unauthorized do Azure

      const mockDb = {
        project: {
          findUnique: async () => ({
            id: 9,
            name: "Projeto Auth Fail",
            status: "PLANNED",
            epics: [
              {
                id: 10,
                name: "Épico",
                description: "",
                objective: "",
                expectedResult: "",
                projectId: 9,
                features: [],
              },
            ],
          }),
        },
      } as any;

      await assert.rejects(
        () =>
          exportProjectBacklogToAzure(9, {
            prismaClient: mockDb,
            skipConcurrencyCheck: true,
          }),
        (err: any) =>
          err.status === 401 && err.message.includes("Falha de autenticação"),
      );
    });

    // -----------------------------------------------------------------------------------
    // CENÁRIO 10: Falha de comunicação com a API (503)
    // -----------------------------------------------------------------------------------
    await t.test("Cenário 10: Falha de comunicação com a API do Azure DevOps", async () => {
      resetEnvAndState();
      mockStatus = 503;

      const mockDb = {
        project: {
          findUnique: async () => ({
            id: 10,
            name: "Projeto 503",
            status: "PLANNED",
            epics: [
              {
                id: 10,
                name: "Épico",
                description: "",
                objective: "",
                expectedResult: "",
                projectId: 10,
                features: [],
              },
            ],
          }),
        },
      } as any;

      await assert.rejects(
        () =>
          exportProjectBacklogToAzure(10, {
            prismaClient: mockDb,
            skipConcurrencyCheck: true,
          }),
        (err: any) =>
          err.status === 503 && err.message.includes("Serviço do Azure DevOps indisponível"),
      );
    });

    // -----------------------------------------------------------------------------------
    // CENÁRIO 11: Prevenção de concorrência e exportações sucessivas
    // -----------------------------------------------------------------------------------
    await t.test("Cenário 11: Previne exportações simultâneas no mesmo projeto com 409", async () => {
      resetEnvAndState();

      let resolveSlowQuery: (() => void) | null = null;
      const slowPromise = new Promise<void>((res) => {
        resolveSlowQuery = res;
      });

      const mockDb = {
        project: {
          findUnique: async () => {
            await slowPromise;
            return {
              id: 11,
              name: "Projeto Concorrente",
              status: "PLANNED",
              epics: [],
            };
          },
        },
      } as any;

      // Inicia a primeira exportação sem pular a checagem
      const export1Promise = exportProjectBacklogToAzure(11, {
        prismaClient: mockDb,
        skipConcurrencyCheck: false,
      });

      // Tenta a segunda exportação simultânea
      await assert.rejects(
        () =>
          exportProjectBacklogToAzure(11, {
            prismaClient: mockDb,
            skipConcurrencyCheck: false,
          }),
        (err) => err instanceof ExportConflictError && err.status === 409,
      );

      // Libera a primeira
      resolveSlowQuery!();
      await export1Promise;

      // Após terminar, nova exportação pode iniciar sem conflito
      const export3 = await exportProjectBacklogToAzure(11, {
        prismaClient: {
          project: {
            findUnique: async () => ({
              id: 11,
              name: "Projeto Concorrente",
              status: "PLANNED",
              epics: [],
            }),
          },
        } as any,
        skipConcurrencyCheck: false,
      });
      assert.equal(export3.success, true);
    });

    // -----------------------------------------------------------------------------------
    // CENÁRIO 12: Exportação parcialmente bem-sucedida
    // -----------------------------------------------------------------------------------
    await t.test("Cenário 12: Exportação parcialmente bem-sucedida diferencia de sucesso total", async () => {
      resetEnvAndState();
      shouldFailItemNames.add("Feature B");

      const mockDb = {
        project: {
          findUnique: async () => ({
            id: 12,
            name: "Projeto Parcial",
            status: "PLANNED",
            epics: [
              {
                id: 1,
                name: "Épico 1",
                description: "",
                objective: "",
                expectedResult: "",
                projectId: 12,
                features: [
                  {
                    id: 10,
                    name: "Feature A",
                    description: "",
                    approvalCriteria: "",
                    epicId: 1,
                    pbis: [
                      {
                        id: 100,
                        title: "PBI A1",
                        userStory: "",
                        acceptanceCriteria: "",
                        featureId: 10,
                        developers: [],
                      },
                    ],
                  },
                  {
                    id: 20,
                    name: "Feature B",
                    description: "",
                    approvalCriteria: "",
                    epicId: 1,
                    pbis: [
                      {
                        id: 200,
                        title: "PBI B1",
                        userStory: "",
                        acceptanceCriteria: "",
                        featureId: 20,
                        developers: [],
                      },
                    ],
                  },
                ],
              },
            ],
          }),
        },
      } as any;

      const result = await exportProjectBacklogToAzure(12, {
        prismaClient: mockDb,
        skipConcurrencyCheck: true,
      });

      assert.equal(result.success, false);
      assert.equal(result.summary.exported, 3); // Epic 1, Feature A, PBI A1
      assert.equal(result.summary.failed, 1); // Feature B
      assert.equal(result.summary.skipped, 1); // PBI B1
      assert.ok(result.message.includes("Backlog exportado parcialmente"));
    });

    // -----------------------------------------------------------------------------------
    // TESTE DAS ROTAS EXPRESS
    // -----------------------------------------------------------------------------------
    await t.test("Express Endpoints: POST /api/projects/:id/export/azure-devops e validações", async () => {
      resetEnvAndState();

      // Teste com id inválido (não inteiro positivo)
      const resInvalid = await fetch(`${apiBaseUrl}/api/projects/abc/export/azure-devops`, {
        method: "POST",
      });
      assert.equal(resInvalid.status, 400);

      // Teste rota alternativa em /api/azure-devops/projects/:projectId/export
      const resAltInvalid = await fetch(
        `${apiBaseUrl}/api/azure-devops/projects/abc/export`,
        { method: "POST" },
      );
      assert.equal(resAltInvalid.status, 400);
    });
  } finally {
    await new Promise<void>((resolve, reject) =>
      apiServer.close((err) => (err ? reject(err) : resolve())),
    );
    await new Promise<void>((resolve, reject) =>
      mockAzureServer.close((err) => (err ? reject(err) : resolve())),
    );
  }
});
