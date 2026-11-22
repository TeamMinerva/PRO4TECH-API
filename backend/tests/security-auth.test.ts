import assert from "node:assert/strict";
import { createServer } from "node:http";
import { test } from "node:test";
import jwt from "jsonwebtoken";
import app from "../src/app";
import { prisma } from "../src/lib/prisma";

test("API authentication, authorization and IDOR protection", async (t) => {
  process.env.JWT_SECRET = "test-security-jwt-secret";

  const server = createServer(app);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const baseUrl = `http://127.0.0.1:${address.port}`;

  const tokenUser1 = jwt.sign(
    { id: 1, email: "user1@pro4tech.com" },
    process.env.JWT_SECRET,
    { expiresIn: "1h" },
  );
  const tokenUser2 = jwt.sign(
    { id: 2, email: "user2@pro4tech.com" },
    process.env.JWT_SECRET,
    { expiresIn: "1h" },
  );

  const originalUserFindUnique = prisma.user.findUnique;
  const originalTechFindMany = prisma.technology.findMany;
  const originalProjectFindMany = prisma.project.findMany;
  const originalDeveloperFindMany = prisma.developer.findMany;
  const originalConversationFindMany = prisma.conversation.findMany;
  const originalConversationFindUnique = prisma.conversation.findUnique;
  const originalConversationUpdate = prisma.conversation.update;
  const originalConversationDelete = prisma.conversation.delete;
  const originalMessageFindMany = prisma.message.findMany;

  t.after(async () => {
    Object.defineProperty(prisma.user, "findUnique", {
      configurable: true,
      value: originalUserFindUnique,
    });
    Object.defineProperty(prisma.technology, "findMany", {
      configurable: true,
      value: originalTechFindMany,
    });
    Object.defineProperty(prisma.project, "findMany", {
      configurable: true,
      value: originalProjectFindMany,
    });
    Object.defineProperty(prisma.developer, "findMany", {
      configurable: true,
      value: originalDeveloperFindMany,
    });
    Object.defineProperty(prisma.conversation, "findMany", {
      configurable: true,
      value: originalConversationFindMany,
    });
    Object.defineProperty(prisma.conversation, "findUnique", {
      configurable: true,
      value: originalConversationFindUnique,
    });
    Object.defineProperty(prisma.conversation, "update", {
      configurable: true,
      value: originalConversationUpdate,
    });
    Object.defineProperty(prisma.conversation, "delete", {
      configurable: true,
      value: originalConversationDelete,
    });
    Object.defineProperty(prisma.message, "findMany", {
      configurable: true,
      value: originalMessageFindMany,
    });

    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
    await prisma.$disconnect();
  });

  await t.test("keeps healthcheck public and disables x-powered-by header", async () => {
    const res = await fetch(`${baseUrl}/`);
    assert.equal(res.status, 200);
    assert.equal(res.headers.get("x-powered-by"), null);
  });

  await t.test("rejects unauthenticated access (401) across all protected routes", async () => {
    const protectedEndpoints: Array<{ method: string; path: string; body?: unknown }> = [
      { method: "GET", path: "/auth/me" },
      { method: "GET", path: "/api/auth/me" },
      { method: "GET", path: "/api/test" },
      { method: "GET", path: "/api/projects" },
      { method: "GET", path: "/api/projects/1" },
      { method: "GET", path: "/api/projects/1/similar" },
      { method: "POST", path: "/api/projects", body: {} },
      { method: "PUT", path: "/api/projects/1", body: {} },
      { method: "POST", path: "/api/projects/1/export/azure-devops" },
      { method: "POST", path: "/api/projects/1/export/azure-boards" },
      { method: "GET", path: "/api/projects-gallery" },
      { method: "GET", path: "/api/developers/1" },
      { method: "POST", path: "/api/developers", body: {} },
      { method: "POST", path: "/api/developers/recommend", body: {} },
      { method: "POST", path: "/api/developers/1/chat", body: {} },
      { method: "GET", path: "/api/developers-gallery" },
      { method: "POST", path: "/api/developers-gallery", body: {} },
      { method: "GET", path: "/api/technologies" },
      { method: "GET", path: "/api/technologies/1" },
      { method: "POST", path: "/api/technologies", body: {} },
      { method: "PUT", path: "/api/technologies/1", body: {} },
      { method: "DELETE", path: "/api/technologies/1" },
      { method: "POST", path: "/api/bugs", body: {} },
      { method: "PUT", path: "/api/bugs/1", body: {} },
      { method: "POST", path: "/api/chat/projects/draft/analyze", body: {} },
      { method: "POST", path: "/api/chat/projects/draft", body: {} },
      { method: "POST", path: "/api/chat/projects/1", body: {} },
      { method: "POST", path: "/api/chat/developers/1", body: {} },
      { method: "POST", path: "/api/chat", body: {} },
      { method: "POST", path: "/api/chat/general", body: {} },
      { method: "GET", path: "/api/conversations" },
      { method: "POST", path: "/api/conversations", body: {} },
      { method: "GET", path: "/api/conversations/1/messages" },
      { method: "PATCH", path: "/api/conversations/1", body: {} },
      { method: "PUT", path: "/api/conversations/1", body: {} },
      { method: "DELETE", path: "/api/conversations/1" },
      { method: "GET", path: "/api/azure-devops/work-item-types" },
      { method: "POST", path: "/api/azure-devops/work-items", body: {} },
      { method: "POST", path: "/api/azure-devops/projects/1/export" },
      { method: "GET", path: "/api/azure-boards/work-item-types" },
    ];

    for (const endpoint of protectedEndpoints) {
      const res = await fetch(`${baseUrl}${endpoint.path}`, {
        method: endpoint.method,
        headers: endpoint.body ? { "Content-Type": "application/json" } : undefined,
        body: endpoint.body ? JSON.stringify(endpoint.body) : undefined,
      });
      assert.equal(
        res.status,
        401,
        `Expected 401 for ${endpoint.method} ${endpoint.path}, got ${res.status}`,
      );
    }
  });

  await t.test("rejects malformed, wrong-secret and expired JWT tokens with 401", async () => {
    const expiredToken = jwt.sign(
      { id: 1, email: "user1@pro4tech.com" },
      process.env.JWT_SECRET!,
      { expiresIn: -10 },
    );
    const wrongSecretToken = jwt.sign(
      { id: 1, email: "user1@pro4tech.com" },
      "another-secret",
      { expiresIn: "1h" },
    );
    const missingClaimsToken = jwt.sign(
      { id: "not-a-number" },
      process.env.JWT_SECRET!,
      { expiresIn: "1h" },
    );

    const invalidHeaders = [
      "Token abc",
      "Bearer",
      "Bearer not-a-jwt",
      `Bearer ${expiredToken}`,
      `Bearer ${wrongSecretToken}`,
      `Bearer ${missingClaimsToken}`,
    ];

    for (const authorization of invalidHeaders) {
      const res = await fetch(`${baseUrl}/api/projects`, {
        headers: { Authorization: authorization },
      });
      assert.equal(res.status, 401, `Expected 401 for Authorization "${authorization}"`);
    }
  });

  await t.test("validates session with GET /auth/me", async () => {
    Object.defineProperty(prisma.user, "findUnique", {
      configurable: true,
      value: async ({ where }: { where: { id: number } }) =>
        where.id === 1
          ? { id: 1, email: "user1@pro4tech.com", createdAt: new Date("2026-01-01T00:00:00Z") }
          : null,
    });

    const validRes = await fetch(`${baseUrl}/auth/me`, {
      headers: { Authorization: `Bearer ${tokenUser1}` },
    });
    assert.equal(validRes.status, 200);
    const body = (await validRes.json()) as { id: number; email: string; password?: string };
    assert.equal(body.id, 1);
    assert.equal(body.email, "user1@pro4tech.com");
    assert.equal(body.password, undefined);

    const deletedUserToken = jwt.sign(
      { id: 999, email: "ghost@pro4tech.com" },
      process.env.JWT_SECRET!,
      { expiresIn: "1h" },
    );
    const missingUserRes = await fetch(`${baseUrl}/auth/me`, {
      headers: { Authorization: `Bearer ${deletedUserToken}` },
    });
    assert.equal(missingUserRes.status, 401);
  });

  await t.test("prevents IDOR across user conversations and general chat", async () => {
    let lastFindManyWhere: unknown;
    const conversations = new Map<number, { id: number; title: string; userId: number | null }>([
      [10, { id: 10, title: "Conversa Secreta do Usuário 2", userId: 2 }],
      [20, { id: 20, title: "Conversa Órfã", userId: null }],
    ]);

    Object.defineProperty(prisma.conversation, "findMany", {
      configurable: true,
      value: async (args: { where?: unknown }) => {
        lastFindManyWhere = args.where;
        return [{ id: 1, title: "Minha Conversa", userId: 1 }];
      },
    });
    Object.defineProperty(prisma.conversation, "findUnique", {
      configurable: true,
      value: async ({ where }: { where: { id: number } }) =>
        conversations.get(where.id) ?? null,
    });
    Object.defineProperty(prisma.conversation, "update", {
      configurable: true,
      value: async ({ where, data }: { where: { id: number }; data: { title: string } }) => ({
        id: where.id,
        title: data.title,
        userId: 2,
      }),
    });
    Object.defineProperty(prisma.conversation, "delete", {
      configurable: true,
      value: async ({ where }: { where: { id: number } }) => ({ id: where.id }),
    });
    Object.defineProperty(prisma.message, "findMany", {
      configurable: true,
      value: async () => [],
    });

    // Listing conversations always scopes by authenticated userId
    const listRes = await fetch(`${baseUrl}/api/conversations`, {
      headers: { Authorization: `Bearer ${tokenUser1}` },
    });
    assert.equal(listRes.status, 200);
    assert.deepEqual(lastFindManyWhere, { userId: 1 });

    // User 1 cannot access, rename, delete or send chat messages to User 2's conversation
    const forbiddenChecks: Array<{ method: string; path: string; body?: unknown }> = [
      { method: "GET", path: "/api/conversations/10/messages" },
      { method: "PATCH", path: "/api/conversations/10", body: { title: "Hack" } },
      { method: "PUT", path: "/api/conversations/10", body: { title: "Hack" } },
      { method: "DELETE", path: "/api/conversations/10" },
      {
        method: "POST",
        path: "/api/chat/general",
        body: { question: "Mostrar histórico", history: [], conversationId: 10 },
      },
      { method: "GET", path: "/api/conversations/20/messages" },
    ];

    for (const check of forbiddenChecks) {
      const res = await fetch(`${baseUrl}${check.path}`, {
        method: check.method,
        headers: {
          Authorization: `Bearer ${tokenUser1}`,
          ...(check.body ? { "Content-Type": "application/json" } : {}),
        },
        body: check.body ? JSON.stringify(check.body) : undefined,
      });
      assert.equal(
        res.status,
        403,
        `Expected 403 for ${check.method} ${check.path}, got ${res.status}`,
      );
    }

    // Owner (User 2) can read, rename and delete their own conversation
    const ownerMessagesRes = await fetch(`${baseUrl}/api/conversations/10/messages`, {
      headers: { Authorization: `Bearer ${tokenUser2}` },
    });
    assert.equal(ownerMessagesRes.status, 200);

    const ownerRenameRes = await fetch(`${baseUrl}/api/conversations/10`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${tokenUser2}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title: "Novo Título" }),
    });
    assert.equal(ownerRenameRes.status, 200);

    const ownerDeleteRes = await fetch(`${baseUrl}/api/conversations/10`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${tokenUser2}` },
    });
    assert.equal(ownerDeleteRes.status, 204);
  });

  await t.test("allows authenticated access to protected business endpoints", async () => {
    Object.defineProperty(prisma.technology, "findMany", {
      configurable: true,
      value: async () => [{ id: 1, name: "TypeScript" }],
    });
    Object.defineProperty(prisma.project, "findMany", {
      configurable: true,
      value: async () => [{ id: 1, name: "Projeto Seguro", status: "PLANNED" }],
    });
    Object.defineProperty(prisma.developer, "findMany", {
      configurable: true,
      value: async () => [{ id: 1, name: "Dev Seguro", active: true }],
    });

    const authHeaders = { Authorization: `Bearer ${tokenUser1}` };

    const routes = [
      "/api/test",
      "/api/projects",
      "/api/projects-gallery",
      "/api/developers-gallery",
      "/api/technologies",
    ];

    for (const path of routes) {
      const res = await fetch(`${baseUrl}${path}`, { headers: authHeaders });
      assert.equal(res.status, 200, `Expected 200 for ${path} with valid token`);
    }
  });
});
