import assert from "node:assert/strict";
import { createServer } from "node:http";
import { test } from "node:test";
import { prisma } from "../src/lib/prisma";

test("recommendDevelopersForPbi sends inactive IDs, calls AI, and maps response", async (t) => {
  let aiStatus = 200;
  let aiRequest: Record<string, unknown> | undefined;
  let aiPayload: unknown = {
    pbi_id: 7,
    developers: [
      {
        developer_id: 1,
        name: "Ana",
        score: 0.92,
        justification: "Experiência prévia com autenticação JWT.",
        evidence: ["Trecho 1"],
      },
    ],
    message:
      "Sugestões baseadas na base de conhecimento. Não representam uma atribuição automática: a decisão final é da equipe.",
    automatic_assignment: false,
  };

  const server = createServer((request, response) => {
    const chunks: Buffer[] = [];
    request.on("data", (chunk: Buffer) => chunks.push(chunk));
    request.on("end", () => {
      aiRequest = JSON.parse(Buffer.concat(chunks).toString("utf8"));
      response.writeHead(aiStatus, { "Content-Type": "application/json" });
      response.end(
        JSON.stringify(aiStatus === 200 ? aiPayload : { detail: "Serviço indisponível." }),
      );
    });
  });

  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  process.env.AI_URL = `http://127.0.0.1:${address.port}`;

  const originalFindMany = prisma.developer.findMany;
  (prisma.developer as unknown as { findMany: unknown }).findMany = async () => [{ id: 2 }, { id: 5 }];

  t.after(async () => {
    (prisma.developer as unknown as { findMany: unknown }).findMany = originalFindMany;
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  const { recommendDevelopersForPbi } = await import(
    "../src/services/developer-recommendation.service"
  );

  await t.test("returns mapped recommendations and passes inactive_developer_ids", async () => {
    aiStatus = 200;
    const result = await recommendDevelopersForPbi({
      pbiId: 7,
      title: "Login com JWT",
      userStory: "Como usuário quero autenticar",
      acceptanceCriteria: "Token válido por 1h",
      limit: 3,
    });

    assert.deepEqual(aiRequest, {
      pbi_id: 7,
      title: "Login com JWT",
      user_story: "Como usuário quero autenticar",
      acceptance_criteria: "Token válido por 1h",
      limit: 3,
      inactive_developer_ids: [2, 5],
    });
    assert.equal(result.pbiId, 7);
    assert.equal(result.automaticAssignment, false);
    assert.equal(result.developers.length, 1);
    assert.equal(result.developers[0].developerId, 1);
    assert.equal(result.developers[0].name, "Ana");
    assert.equal(result.developers[0].score, 0.92);
  });

  await t.test("filters out inactive developer if AI unexpectedly returns one", async () => {
    aiStatus = 200;
    aiPayload = {
      pbi_id: null,
      developers: [
        {
          developer_id: 2,
          name: "Beto",
          score: 0.95,
          justification: "Inativo.",
          evidence: [],
        },
        {
          developer_id: 1,
          name: "Ana",
          score: 0.85,
          justification: "Ativa.",
          evidence: [],
        },
      ],
      message: "Sugestões.",
      automatic_assignment: false,
    };

    const result = await recommendDevelopersForPbi({
      title: "Login com JWT",
      userStory: "",
      acceptanceCriteria: "",
      limit: 3,
    });

    assert.deepEqual(
      result.developers.map((d) => d.developerId),
      [1],
    );
  });

  await t.test("throws 502 when AI returns invalid payload", async () => {
    aiStatus = 200;
    aiPayload = { unexpected: true };

    await assert.rejects(
      () =>
        recommendDevelopersForPbi({
          title: "Login com JWT",
          userStory: "",
          acceptanceCriteria: "",
          limit: 3,
        }),
      (error: unknown) =>
        error instanceof Error &&
        "status" in error &&
        (error as { status: number }).status === 502,
    );
  });

  await t.test("translates an unavailable AI response to 503", async () => {
    aiStatus = 503;

    await assert.rejects(
      () =>
        recommendDevelopersForPbi({
          title: "Login com JWT",
          userStory: "",
          acceptanceCriteria: "",
          limit: 3,
        }),
      (error: unknown) =>
        error instanceof Error &&
        "status" in error &&
        (error as { status: number }).status === 503,
    );
  });
});
