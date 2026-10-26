import assert from "node:assert/strict";
import { createServer } from "node:http";
import { test } from "node:test";
import { prisma } from "../src/lib/prisma";

test("total indexing only succeeds after LightRAG confirms each HTTP request", async (t) => {
  let aiStatus = 204;
  let received: Record<string, unknown> | undefined;
  const server = createServer((request, response) => {
    const chunks: Buffer[] = [];
    request.on("data", (chunk: Buffer) => chunks.push(chunk));
    request.on("end", () => {
      received = JSON.parse(Buffer.concat(chunks).toString("utf8"));
      response.writeHead(aiStatus);
      response.end();
    });
  });

  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  process.env.LIGHTRAG_URL = `http://127.0.0.1:${address.port}/knowledge`;

  const projectDelegate = prisma.project;
  const developerDelegate = prisma.developer;
  const originalProjectFindMany = projectDelegate.findMany;
  const originalDeveloperFindMany = developerDelegate.findMany;
  Object.defineProperty(projectDelegate, "findMany", {
    configurable: true,
    value: async () => [{
      id: 7,
      name: "Teste",
      status: "PLANNED",
      technologies: [],
      bugs: [],
      epics: [],
    }],
  });
  Object.defineProperty(developerDelegate, "findMany", {
    configurable: true,
    value: async () => [],
  });

  try {
    const { IndexacaoService } = await import("../src/services/indexacao.service");
    const indexer = new IndexacaoService();

    await t.test("reports success after a 204 and sends the document ID", async () => {
      aiStatus = 204;
      const result = await indexer.gerarEIndexarConhecimentoTotal();
      assert.equal(result.success, true);
      assert.equal(received?.doc_id, "projeto_7");
    });

    await t.test("reports failure when LightRAG rejects indexing", async () => {
      aiStatus = 503;
      const result = await indexer.gerarEIndexarConhecimentoTotal();
      assert.equal(result.success, false);
    });
  } finally {
    Object.defineProperty(projectDelegate, "findMany", {
      configurable: true,
      value: originalProjectFindMany,
    });
    Object.defineProperty(developerDelegate, "findMany", {
      configurable: true,
      value: originalDeveloperFindMany,
    });
    delete process.env.LIGHTRAG_URL;
    await new Promise<void>((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
    await prisma.$disconnect();
  }
});
