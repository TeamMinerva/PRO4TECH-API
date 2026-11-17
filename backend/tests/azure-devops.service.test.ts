import assert from "node:assert/strict";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { test } from "node:test";
import jwt from "jsonwebtoken";
import app from "../src/app";
import {
  AzureDevOpsServiceError,
  clearWorkItemTypesCache,
  createWorkItem,
  getWorkItemTypes,
  type JsonPatchOperation,
  type WorkItemTypeSummary,
} from "../src/services/azure-devops.service";

test("Azure DevOps integration service and Express endpoints", async (t) => {
  let getTypesCount = 0;
  let mockStatus = 200;
  let mockContentType = "application/json";
  let lastRequestUrl = "";
  let lastRequestMethod = "";
  let lastAuthHeader = "";
  let lastContentTypeHeader = "";
  let lastPatchBody: JsonPatchOperation[] = [];
  let customErrorResponse: Record<string, unknown> | null = null;

  const mockTypesPayload = {
    count: 5,
    value: [
      {
        name: "Epic",
        referenceName: "Microsoft.VSTS.WorkItemTypes.Epic",
        description: "Epics help teams manage large initiatives.",
        color: "FF7B00",
        isDisabled: false,
      },
      {
        name: "Feature",
        referenceName: "Microsoft.VSTS.WorkItemTypes.Feature",
        description: "Features track functionality.",
        color: "773B93",
        isDisabled: false,
      },
      {
        name: "User Story",
        referenceName: "Microsoft.VSTS.WorkItemTypes.UserStory",
        description: "User Stories track user value.",
        color: "009CCC",
        isDisabled: false,
      },
      {
        name: "Task",
        referenceName: "Microsoft.VSTS.WorkItemTypes.Task",
        description: "Tasks track work.",
        color: "F2CB1D",
        isDisabled: false,
      },
      {
        name: "LegacyType",
        referenceName: "Custom.LegacyType",
        description: "Disabled type",
        isDisabled: true,
      },
    ],
  };

  const mockAzureServer = createServer((req: IncomingMessage, res: ServerResponse) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => {
      lastRequestUrl = req.url ?? "";
      lastRequestMethod = req.method ?? "";
      lastAuthHeader = String(req.headers.authorization ?? "");
      lastContentTypeHeader = String(req.headers["content-type"] ?? "");

      const rawBody = Buffer.concat(chunks).toString("utf8");
      if (rawBody) {
        try {
          lastPatchBody = JSON.parse(rawBody) as JsonPatchOperation[];
        } catch {
          lastPatchBody = [];
        }
      }

      if (mockStatus !== 200 && mockStatus !== 201) {
        res.writeHead(mockStatus, { "Content-Type": mockContentType });
        res.end(
          mockContentType.includes("text/html")
            ? "<html><body>Sign In</body></html>"
            : JSON.stringify(
                customErrorResponse ?? {
                  message: `Simulated error (${mockStatus})`,
                },
              ),
        );
        return;
      }

      if (req.method === "GET" && lastRequestUrl.includes("/_apis/wit/workitemtypes")) {
        getTypesCount += 1;
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(mockTypesPayload));
        return;
      }

      if (req.method === "POST" && lastRequestUrl.includes("/_apis/wit/workitems/")) {
        const titleOp = lastPatchBody.find((op) => op.path === "/fields/System.Title");
        const descOp = lastPatchBody.find((op) => op.path === "/fields/System.Description");
        const acOp = lastPatchBody.find(
          (op) => op.path === "/fields/Microsoft.VSTS.Common.AcceptanceCriteria",
        );

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            id: 101,
            rev: 1,
            url: `http://127.0.0.1/pro4tech-org/pro4tech-proj/_apis/wit/workItems/101`,
            fields: {
              "System.Title": titleOp?.value ?? "Sem título",
              "System.Description": descOp?.value,
              "Microsoft.VSTS.Common.AcceptanceCriteria": acOp?.value,
              "System.State": "New",
            },
            _links: {
              html: {
                href: "https://dev.azure.com/pro4tech-org/pro4tech-proj/_workitems/edit/101",
              },
            },
          }),
        );
        return;
      }

      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ message: "Route not found" }));
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

  const resetEnv = () => {
    process.env.AZURE_DEVOPS_ORG = "pro4tech-org";
    process.env.AZURE_DEVOPS_PROJECT = "pro4tech-proj";
    process.env.AZURE_DEVOPS_PAT = "my-secret-pat-123";
    process.env.AZURE_DEVOPS_BASE_URL = `http://127.0.0.1:${azureAddress.port}`;
    process.env.JWT_SECRET = "test-jwt-secret";
    delete process.env.AZURE_DEVOPS_REQUIRE_AUTH;
    mockStatus = 200;
    mockContentType = "application/json";
    customErrorResponse = null;
    clearWorkItemTypesCache();
  };

  try {
    await t.test("validates missing environment credentials", async () => {
      resetEnv();
      delete process.env.AZURE_DEVOPS_PAT;

      await assert.rejects(
        () => getWorkItemTypes(),
        (err: unknown) =>
          err instanceof AzureDevOpsServiceError &&
          err.status === 500 &&
          err.message.includes("AZURE_DEVOPS_PAT"),
      );
    });

    await t.test("fetches work item types with Basic Auth Base64 and caches results", async () => {
      resetEnv();
      getTypesCount = 0;

      const types = await getWorkItemTypes();
      assert.equal(types.length, 5);
      assert.equal(getTypesCount, 1);

      const expectedBasic = `Basic ${Buffer.from(":my-secret-pat-123", "utf8").toString("base64")}`;
      assert.equal(lastAuthHeader, expectedBasic);
      assert.equal(
        lastRequestUrl,
        "/pro4tech-org/pro4tech-proj/_apis/wit/workitemtypes?api-version=7.1",
      );

      // Second call uses in-memory cache without hitting HTTP server
      const cachedTypes = await getWorkItemTypes();
      assert.equal(cachedTypes.length, 5);
      assert.equal(getTypesCount, 1);
    });

    await t.test(
      "creates a User Story with AcceptanceCriteria and Hierarchy-Reverse parent link",
      async () => {
        resetEnv();

        const created = await createWorkItem({
          type: "User Story",
          title: "Como usuário, quero exportar o backlog",
          description: "Descrição da história",
          acceptanceCriteria: "Critério 1; Critério 2",
          parentId: 50,
          tags: ["export", "azure"],
        });

        assert.equal(lastRequestMethod, "POST");
        assert.equal(
          lastRequestUrl,
          "/pro4tech-org/pro4tech-proj/_apis/wit/workitems/$User%20Story?api-version=7.1",
        );
        assert.equal(lastContentTypeHeader, "application/json-patch+json");

        const acOp = lastPatchBody.find(
          (op) => op.path === "/fields/Microsoft.VSTS.Common.AcceptanceCriteria",
        );
        assert.deepEqual(acOp, {
          op: "add",
          path: "/fields/Microsoft.VSTS.Common.AcceptanceCriteria",
          value: "Critério 1; Critério 2",
        });

        const relationOp = lastPatchBody.find((op) => op.path === "/relations/-");
        assert.ok(relationOp);
        assert.deepEqual(relationOp.value, {
          rel: "System.LinkTypes.Hierarchy-Reverse",
          url: `http://127.0.0.1:${azureAddress.port}/pro4tech-org/pro4tech-proj/_apis/wit/workItems/50`,
          attributes: {
            comment: "Vínculo hierárquico criado via API Pro4Tech",
          },
        });

        assert.equal(created.id, 101);
        assert.equal(created.parentId, 50);
      },
    );

    await t.test(
      "omits AcceptanceCriteria when creating Epic or Task and uses preloaded availableTypes",
      async () => {
        resetEnv();
        const availableTypes: WorkItemTypeSummary[] = await getWorkItemTypes();
        const countAfterPreload = getTypesCount;

        await createWorkItem(
          {
            type: "Epic",
            title: "Épico de Integração",
            description: "Descrição do épico",
            acceptanceCriteria: "Não deve ir no JSON Patch de Epic",
          },
          { availableTypes },
        );

        // Did not call GET /_apis/wit/workitemtypes again
        assert.equal(getTypesCount, countAfterPreload);
        assert.equal(
          lastRequestUrl,
          "/pro4tech-org/pro4tech-proj/_apis/wit/workitems/$Epic?api-version=7.1",
        );

        const acOp = lastPatchBody.find(
          (op) => op.path === "/fields/Microsoft.VSTS.Common.AcceptanceCriteria",
        );
        assert.equal(acOp, undefined);
      },
    );

    await t.test("rejects unsupported or disabled Work Item types with 400", async () => {
      resetEnv();

      await assert.rejects(
        () =>
          createWorkItem({
            type: "TipoInexistente",
            title: "Teste",
          }),
        (err: unknown) =>
          err instanceof AzureDevOpsServiceError &&
          err.status === 400 &&
          err.message.includes("não existe no processo configurado"),
      );

      await assert.rejects(
        () =>
          createWorkItem({
            type: "LegacyType",
            title: "Teste desabilitado",
          }),
        (err: unknown) =>
          err instanceof AzureDevOpsServiceError &&
          err.status === 400 &&
          err.message.includes("desabilitado"),
      );
    });

    await t.test("maps Azure DevOps HTTP errors (401, 403, 404, 400, 503) via Express endpoints", async () => {
      resetEnv();

      // 401 Unauthorized
      mockStatus = 401;
      let res = await fetch(`${apiBaseUrl}/api/azure-devops/work-item-types`);
      assert.equal(res.status, 401);

      // 203 Non-Authoritative Information / HTML sign-in page (invalid PAT behavior in Azure DevOps)
      resetEnv();
      mockStatus = 203;
      mockContentType = "text/html; charset=utf-8";
      res = await fetch(`${apiBaseUrl}/api/azure-devops/work-item-types`);
      assert.equal(res.status, 401);

      // 403 Forbidden
      resetEnv();
      mockStatus = 403;
      res = await fetch(`${apiBaseUrl}/api/azure-devops/work-item-types`);
      assert.equal(res.status, 403);

      // 404 Not Found
      resetEnv();
      mockStatus = 404;
      res = await fetch(`${apiBaseUrl}/api/azure-devops/work-item-types`);
      assert.equal(res.status, 404);

      // 400 Bad Request from upstream Azure DevOps API
      resetEnv();
      await getWorkItemTypes(); // populate cache so POST reaches Azure DevOps create endpoint
      mockStatus = 400;
      customErrorResponse = {
        message: "TF401320: Rule Error for field System.State.",
      };
      res = await fetch(`${apiBaseUrl}/api/azure-devops/work-items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "Task",
          title: "Task com estado inválido",
          state: "InvalidState",
        }),
      });
      assert.equal(res.status, 400);
      const upstreamErrBody = (await res.json()) as { message: string };
      assert.ok(upstreamErrBody.message.includes("TF401320"));

      // 503 Service Unavailable on 500 upstream
      resetEnv();
      mockStatus = 500;
      res = await fetch(`${apiBaseUrl}/api/azure-devops/work-item-types`);
      assert.equal(res.status, 503);

      // 400 Bad Request on invalid request payload
      resetEnv();
      res = await fetch(`${apiBaseUrl}/api/azure-devops/work-items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "", title: "" }),
      });
      assert.equal(res.status, 400);

      // 201 Created via POST /api/azure-devops/work-items
      resetEnv();
      res = await fetch(`${apiBaseUrl}/api/azure-devops/work-items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "Feature",
          title: "Feature via Express",
          description: "Criada via endpoint REST",
          parentId: 10,
        }),
      });
      assert.equal(res.status, 201);
      const body = (await res.json()) as { workItem: { id: number; parentId: number } };
      assert.equal(body.workItem.id, 101);
      assert.equal(body.workItem.parentId, 10);
    });

    await t.test("validates JWT token when Authorization header is sent or AZURE_DEVOPS_REQUIRE_AUTH=true", async () => {
      resetEnv();
      process.env.AZURE_DEVOPS_REQUIRE_AUTH = "true";

      const unauthRes = await fetch(`${apiBaseUrl}/api/azure-devops/work-item-types`);
      assert.equal(unauthRes.status, 401);

      const validToken = jwt.sign(
        { id: 1, email: "dev@pro4tech.com" },
        process.env.JWT_SECRET!,
      );
      const authRes = await fetch(`${apiBaseUrl}/api/azure-devops/work-item-types`, {
        headers: { Authorization: `Bearer ${validToken}` },
      });
      assert.equal(authRes.status, 200);
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
