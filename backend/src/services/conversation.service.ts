import { prisma } from "../lib/prisma";

export async function createConversation(userId: number, title?: string) {
  return prisma.conversation.create({
    data: { userId, title: title || "Nova Conversa" }
  });
}

export async function getUserConversations(userId: number) {
  return prisma.conversation.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' }
  });
}

export async function getConversationMessages(conversationId: number) {
  return prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: 'asc' }
  });
}

export async function addMessage(conversationId: number, role: string, content: string) {
  await prisma.conversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() }
  });

  return prisma.message.create({
    data: { conversationId, role, content }
  });
}