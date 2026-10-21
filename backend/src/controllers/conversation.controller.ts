import { Request, Response } from "express";
import * as conversationService from "../services/conversation.service";

export async function createConversationController(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id || 1; 
    const { title } = req.body;
    const conversation = await conversationService.createConversation(userId, title);
    res.status(201).json(conversation);
  } catch (error) {
    res.status(500).json({ error: "Erro ao criar conversa" });
  }
}

export async function getConversationsController(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id || 1;
    const conversations = await conversationService.getUserConversations(userId);
    res.json(conversations);
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar conversas" });
  }
}

export async function getMessagesController(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const messages = await conversationService.getConversationMessages(Number(id));
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar mensagens" });
  }
}