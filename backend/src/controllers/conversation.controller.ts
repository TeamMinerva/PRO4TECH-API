import { Request, Response } from "express";
import {
  conversationParamsSchema,
  createConversationSchema,
  updateConversationSchema,
} from "../schemas/conversation.schema";
import * as conversationService from "../services/conversation.service";

async function buscarConversaDoUsuario(
  conversationId: number,
  userId: number,
  res: Response,
) {
  const conversa = await conversationService.getConversationById(conversationId);
  if (!conversa) {
    res.status(404).json({ message: "Conversa não encontrada." });
    return null;
  }

  if (conversa.userId !== userId) {
    res.status(403).json({ message: "Acesso negado a esta conversa." });
    return null;
  }

  return conversa;
}

export async function createConversationController(req: Request, res: Response) {
  if (!req.user?.id) {
    return res.status(401).json({ message: "Usuário não autenticado." });
  }

  const body = createConversationSchema.safeParse(req.body ?? {});
  if (!body.success) {
    return res.status(400).json({
      message: body.error.issues[0]?.message || "Dados inválidos para criar conversa.",
      errors: body.error.flatten().fieldErrors,
    });
  }

  try {
    const conversation = await conversationService.createConversation(
      req.user.id,
      body.data.title,
    );
    if (!conversation) {
      return res.status(401).json({ message: "Usuário não encontrado." });
    }
    return res.status(201).json(conversation);
  } catch (error) {
    console.error("Erro ao criar conversa:", error);
    return res.status(500).json({ message: "Erro ao criar conversa." });
  }
}

export async function getConversationsController(req: Request, res: Response) {
  if (!req.user?.id) {
    return res.status(401).json({ message: "Usuário não autenticado." });
  }

  try {
    const conversations = await conversationService.getUserConversations(req.user.id);
    return res.status(200).json(conversations);
  } catch (error) {
    console.error("Erro ao buscar conversas:", error);
    return res.status(500).json({ message: "Erro ao buscar conversas." });
  }
}

export async function getMessagesController(req: Request, res: Response) {
  if (!req.user?.id) {
    return res.status(401).json({ message: "Usuário não autenticado." });
  }

  const params = conversationParamsSchema.safeParse(req.params);
  if (!params.success) {
    return res.status(400).json({
      message: params.error.issues[0]?.message || "Identificador da conversa inválido.",
    });
  }

  try {
    const conversa = await buscarConversaDoUsuario(
      params.data.id,
      req.user.id,
      res,
    );
    if (!conversa) return;

    const messages = await conversationService.getConversationMessages(params.data.id);
    return res.status(200).json(messages);
  } catch (error) {
    console.error("Erro ao buscar mensagens da conversa:", error);
    return res.status(500).json({ message: "Erro ao buscar mensagens." });
  }
}

export async function updateConversationController(req: Request, res: Response) {
  if (!req.user?.id) {
    return res.status(401).json({ message: "Usuário não autenticado." });
  }

  const params = conversationParamsSchema.safeParse(req.params);
  if (!params.success) {
    return res.status(400).json({
      message: params.error.issues[0]?.message || "Identificador da conversa inválido.",
    });
  }

  const body = updateConversationSchema.safeParse(req.body ?? {});
  if (!body.success) {
    return res.status(400).json({
      message: body.error.issues[0]?.message || "Título inválido.",
      errors: body.error.flatten().fieldErrors,
    });
  }

  try {
    const conversa = await buscarConversaDoUsuario(
      params.data.id,
      req.user.id,
      res,
    );
    if (!conversa) return;

    const atualizada = await conversationService.updateConversationTitle(
      params.data.id,
      body.data.title,
    );
    return res.status(200).json(atualizada);
  } catch (error) {
    console.error("Erro ao renomear conversa:", error);
    return res.status(500).json({ message: "Erro ao renomear conversa." });
  }
}

export async function deleteConversationController(req: Request, res: Response) {
  if (!req.user?.id) {
    return res.status(401).json({ message: "Usuário não autenticado." });
  }

  const params = conversationParamsSchema.safeParse(req.params);
  if (!params.success) {
    return res.status(400).json({
      message: params.error.issues[0]?.message || "Identificador da conversa inválido.",
    });
  }

  try {
    const conversa = await buscarConversaDoUsuario(
      params.data.id,
      req.user.id,
      res,
    );
    if (!conversa) return;

    await conversationService.deleteConversation(params.data.id);
    return res.status(204).send();
  } catch (error) {
    console.error("Erro ao excluir conversa:", error);
    return res.status(500).json({ message: "Erro ao excluir conversa." });
  }
}
