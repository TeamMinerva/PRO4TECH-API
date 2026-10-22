import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { UserPayload } from "../@types/express";
import {
  conversationParamsSchema,
  createConversationSchema,
} from "../schemas/conversation.schema";
import * as conversationService from "../services/conversation.service";

function extrairUserIdOpcional(req: Request): number | undefined {
  if (req.user?.id) return req.user.id;

  const authHeader = req.headers.authorization;
  if (!authHeader) return undefined;

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") return undefined;

  const secret = process.env.JWT_SECRET;
  if (!secret) return undefined;

  try {
    const decoded = jwt.verify(parts[1], secret) as UserPayload;
    if (decoded && typeof decoded === "object" && typeof decoded.id === "number") {
      return decoded.id;
    }
  } catch {
    // Segue sem bloquear enquanto a autenticação na página não é obrigatória
  }

  return undefined;
}

export async function createConversationController(req: Request, res: Response) {
  const body = createConversationSchema.safeParse(req.body ?? {});
  if (!body.success) {
    return res.status(400).json({
      message: body.error.issues[0]?.message || "Dados inválidos para criar conversa.",
      errors: body.error.flatten().fieldErrors,
    });
  }

  try {
    const userId = extrairUserIdOpcional(req);
    const conversation = await conversationService.createConversation(userId, body.data.title);
    return res.status(201).json(conversation);
  } catch (error) {
    console.error("Erro ao criar conversa:", error);
    return res.status(500).json({ message: "Erro ao criar conversa." });
  }
}

export async function getConversationsController(req: Request, res: Response) {
  try {
    const userId = extrairUserIdOpcional(req);
    const conversations = await conversationService.getUserConversations(userId);
    return res.status(200).json(conversations);
  } catch (error) {
    console.error("Erro ao buscar conversas:", error);
    return res.status(500).json({ message: "Erro ao buscar conversas." });
  }
}

export async function getMessagesController(req: Request, res: Response) {
  const params = conversationParamsSchema.safeParse(req.params);
  if (!params.success) {
    return res.status(400).json({
      message: params.error.issues[0]?.message || "Identificador da conversa inválido.",
    });
  }

  try {
    const conversa = await conversationService.getConversationById(params.data.id);
    if (!conversa) {
      return res.status(404).json({ message: "Conversa não encontrada." });
    }

    const messages = await conversationService.getConversationMessages(params.data.id);
    return res.status(200).json(messages);
  } catch (error) {
    console.error("Erro ao buscar mensagens da conversa:", error);
    return res.status(500).json({ message: "Erro ao buscar mensagens." });
  }
}
