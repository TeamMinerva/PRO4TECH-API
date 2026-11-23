import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import type { GeneralChatMessage } from "../schemas/general-chat.schema";
import type { ChatSource } from "./general-chat.service";

const TITULO_PADRAO = "Nova Conversa";
const LIMITE_HISTORICO_IA = 20;

export function gerarTituloConversa(texto: string): string {
  const limpo = texto.trim().replace(/\s+/g, " ");
  if (!limpo) return TITULO_PADRAO;
  return limpo.length > 40 ? `${limpo.slice(0, 40)}...` : limpo;
}

async function resolverUserIdValido(userId?: number): Promise<number | null> {
  if (!userId) return null;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });
  return user ? user.id : null;
}

export async function createConversation(userId: number, title?: string) {
  const validUserId = await resolverUserIdValido(userId);
  if (!validUserId) {
    return null;
  }

  return prisma.conversation.create({
    data: {
      userId: validUserId,
      title: title?.trim() || TITULO_PADRAO,
    },
  });
}

export async function getUserConversations(userId: number) {
  return prisma.conversation.findMany({
    where: { userId },
    orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
  });
}

export async function getConversationById(conversationId: number) {
  return prisma.conversation.findUnique({
    where: { id: conversationId },
  });
}

export async function updateConversationTitle(conversationId: number, title: string) {
  return prisma.conversation.update({
    where: { id: conversationId },
    data: {
      title: title.trim(),
    },
  });
}

export async function deleteConversation(conversationId: number) {
  return prisma.conversation.delete({
    where: { id: conversationId },
  });
}

export async function getConversationMessages(conversationId: number) {
  return prisma.message.findMany({
    where: { conversationId },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    select: {
      id: true,
      content: true,
      role: true,
      sources: true,
      conversationId: true,
      createdAt: true,
    },
  });
}

export async function getRecentConversationHistory(
  conversationId: number,
  limit = LIMITE_HISTORICO_IA,
): Promise<GeneralChatMessage[]> {
  const ultimas = await prisma.message.findMany({
    where: { conversationId },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit,
    select: {
      role: true,
      content: true,
    },
  });

  return ultimas
    .reverse()
    .map((m: { role: string; content: string }): GeneralChatMessage => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: m.content,
    }));
}

export async function addMessage(
  conversationId: number,
  role: string,
  content: string,
  sources?: ChatSource[],
) {
  await prisma.conversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() },
  });

  return prisma.message.create({
    data: {
      conversationId,
      role,
      content,
      ...(sources ? { sources: sources as unknown as Prisma.InputJsonValue } : {}),
    },
  });
}

export async function saveConversationTurn(
  conversationId: number,
  question: string,
  answer: string,
  sources: ChatSource[],
) {
  const conversaAtual = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: { id: true, title: true },
  });

  const novoTitulo =
    conversaAtual && conversaAtual.title === TITULO_PADRAO
      ? gerarTituloConversa(question)
      : conversaAtual?.title;

  const [mensagemUsuario, mensagemAssistente, conversaAtualizada] =
    await prisma.$transaction([
      prisma.message.create({
        data: {
          conversationId,
          role: "user",
          content: question,
        },
      }),
      prisma.message.create({
        data: {
          conversationId,
          role: "assistant",
          content: answer,
          sources: sources as unknown as Prisma.InputJsonValue,
        },
      }),
      prisma.conversation.update({
        where: { id: conversationId },
        data: {
          updatedAt: new Date(),
          ...(novoTitulo ? { title: novoTitulo } : {}),
        },
      }),
    ]);

  return {
    ...conversaAtualizada,
    userCreatedAt: mensagemUsuario.createdAt,
    createdAt: mensagemAssistente.createdAt,
  };
}
