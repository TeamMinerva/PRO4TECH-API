import assert from "node:assert/strict";
import { createServer } from "node:http";
import { test } from "node:test";

test("perguntarSobreRascunho e analisarRascunhoProjeto encaminham o rascunho para o serviço de IA", async (t) => {
  let aiStatus = 200;
  let lastPath = "";
  let aiRequest: Record<string, unknown> | undefined;

  const server = createServer((request, response) => {
    lastPath = request.url ?? "";
    const chunks: Buffer[] = [];
    request.on("data", (chunk: Buffer) => chunks.push(chunk));
    request.on("end", () => {
      aiRequest = JSON.parse(Buffer.concat(chunks).toString("utf8"));
      response.writeHead(aiStatus, { "Content-Type": "application/json" });
      response.end(
        JSON.stringify(
          aiStatus === 200
            ? { answer: "Análise concluída com sucesso." }
            : { detail: "Serviço indisponível." },
        ),
      );
    });
  });

  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  process.env.AI_URL = `http://127.0.0.1:${address.port}`;

  const {
    AIServiceError,
    analisarRascunhoProjeto,
    perguntarSobreRascunho,
  } = await import("../src/services/chat-project.service");

  const rascunho = {
    name: "Alfa",
    status: "Planejado",
    technologies: ["React"],
    epics: [{ name: "Autenticação", objective: "Login seguro" }],
  };

  try {
    await t.test("analisarRascunhoProjeto chama /chat/project-draft/analyze", async () => {
      const answer = await analisarRascunhoProjeto(rascunho, [
        { role: "user", content: "oi" },
      ]);
      assert.equal(lastPath, "/chat/project-draft/analyze");
      assert.deepEqual(aiRequest, {
        draft: rascunho,
        history: [{ role: "user", content: "oi" }],
      });
      assert.equal(answer, "Análise concluída com sucesso.");
    });

    await t.test("perguntarSobreRascunho chama /chat/project-draft", async () => {
      const answer = await perguntarSobreRascunho(rascunho, "Falta algo?", []);
      assert.equal(lastPath, "/chat/project-draft");
      assert.deepEqual(aiRequest, {
        draft: rascunho,
        question: "Falta algo?",
        history: [],
      });
      assert.equal(answer, "Análise concluída com sucesso.");
    });

    await t.test("traduz falha 503 do serviço de IA", async () => {
      aiStatus = 503;
      await assert.rejects(
        analisarRascunhoProjeto({}, []),
        (error: unknown) => error instanceof AIServiceError && error.status === 503,
      );
      aiStatus = 200;
    });
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});
