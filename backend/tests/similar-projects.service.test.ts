import assert from "node:assert/strict";
import { createServer } from "node:http";
import { test } from "node:test";
import { prisma } from "../src/lib/prisma";

test("findSimilarProjects validates, calls AI, and enriches ordered results", async (t) => {
  let aiStatus = 200;
  let aiRequest: Record<string, unknown> | undefined;
  let findUniqueResult: unknown = { id: 1 };
  let findManyCalls = 0;
  const server = createServer((request, response) => {
    const chunks: Buffer[] = [];
    request.on("data", (chunk: Buffer) => chunks.push(chunk));
    request.on("end", () => {
      aiRequest = JSON.parse(Buffer.concat(chunks).toString("utf8"));
      response.writeHead(aiStatus, { "Content-Type": "application/json" });
      response.end(JSON.stringify(
        aiStatus === 200
          ? {
              project_id: 1,
              unavailable_project_ids: [],
              similar_projects: [
                {
                  project_id: 3,
                  similarity: 0.91,
                  justification: "Os projetos compartilham as mesmas funcionalidades.",
                  evidence: [{ text: "Trecho candidato", source_text: "Trecho de origem" }],
                },
                {
                  project_id: 2,
                  similarity: 0.72,
                  justification: "Os projetos usam tecnologias semelhantes.",
                  evidence: [{ text: "Trecho candidato 2", source_text: "Trecho de origem 2" }],
                },
              ],
            }
          : { detail: "Serviço indisponível." },
      ));
    });
  });

  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  process.env.AI_URL = `http://127.0.0.1:${address.port}`;
  const [{ AIServiceError }, { findSimilarProjects }] = await Promise.all([
    import("../src/services/chat-project.service"),
    import("../src/services/similar-projects.service"),
  ]);

  const projectDelegate = prisma.project;
  const originalFindUnique = projectDelegate.findUnique;
  const originalFindMany = projectDelegate.findMany;
  Object.defineProperty(projectDelegate, "findUnique", {
    configurable: true,
    value: async () => findUniqueResult,
  });
  Object.defineProperty(projectDelegate, "findMany", {
    configurable: true,
    value: async (args: { where?: { id?: { in?: number[]; not?: number } } }) => {
      findManyCalls += 1;
      if (args.where?.id?.in) {
        return [
          {
            id: 2,
            name: "Projeto Dois",
            status: "PLANNED",
            technologies: [{ name: "Python" }],
          },
          {
            id: 3,
            name: "Projeto Três",
            status: "DONE",
            technologies: [{ name: "TypeScript" }, { name: "React" }],
          },
        ];
      }
      return [{ id: 2 }, { id: 3 }, { id: 2 }];
    },
  });

  try {
    await t.test("returns Prisma details in AI similarity order", async () => {
      const response = await findSimilarProjects(1, { limit: 2 });
      assert.deepEqual(aiRequest, {
        project_id: 1,
        candidate_project_ids: [2, 3],
        limit: 2,
      });
      assert.deepEqual(response, {
        projectId: 1,
        similarProjects: [
          {
            projectId: 3,
            name: "Projeto Três",
            status: "DONE",
            technologies: ["TypeScript", "React"],
            similarity: 0.91,
            justification: "Os projetos compartilham as mesmas funcionalidades.",
            evidence: [{ text: "Trecho candidato", sourceText: "Trecho de origem" }],
          },
          {
            projectId: 2,
            name: "Projeto Dois",
            status: "PLANNED",
            technologies: ["Python"],
            similarity: 0.72,
            justification: "Os projetos usam tecnologias semelhantes.",
            evidence: [{ text: "Trecho candidato 2", sourceText: "Trecho de origem 2" }],
          },
        ],
      });
      assert.equal(findManyCalls, 2);
    });

    await t.test("returns 404 when the source project does not exist", async () => {
      findUniqueResult = null;
      await assert.rejects(
        findSimilarProjects(1, { limit: 5 }),
        (error: unknown) => error instanceof AIServiceError && error.status === 404,
      );
      findUniqueResult = { id: 1 };
    });

    await t.test("translates an unavailable AI response", async () => {
      aiStatus = 503;
      await assert.rejects(
        findSimilarProjects(1, { limit: 5 }),
        (error: unknown) => error instanceof AIServiceError && error.status === 503,
      );
      aiStatus = 200;
    });
  } finally {
    Object.defineProperty(projectDelegate, "findUnique", {
      configurable: true,
      value: originalFindUnique,
    });
    Object.defineProperty(projectDelegate, "findMany", {
      configurable: true,
      value: originalFindMany,
    });
    await new Promise<void>((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
    await prisma.$disconnect();
  }
});
