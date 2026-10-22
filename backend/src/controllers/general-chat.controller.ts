import { Request, Response } from "express";
import { generalChatBodySchema } from "../schemas/general-chat.schema";
import {
  getConversationById,
  getRecentConversationHistory,
  saveConversationTurn,
} from "../services/conversation.service";
import {
  GeneralChatServiceError,
  perguntarChatGeral,
} from "../services/general-chat.service";

export async function chatGeralController(req: Request, res: Response) {
  const body = generalChatBodySchema.safeParse(req.body);
  if (!body.success) {
    return res.status(400).json({
      message: body.error.issues[0]?.message || "Mensagem inválida.",
      errors: body.error.flatten().fieldErrors,
    });
  }

  const { question, history, conversationId } = body.data;
  const ctrl = new AbortController();
  res.on("close", () => {
    if (!res.writableEnded) {
      ctrl.abort();
    }
  });

  try {
    if (conversationId) {
      const conversa = await getConversationById(conversationId);
      if (!conversa) {
        return res.status(404).json({ message: "Conversa não encontrada." });
      }

      const historicoDaConversa = await getRecentConversationHistory(conversationId);
      const resultado = await perguntarChatGeral(
        question,
        historicoDaConversa,
        ctrl.signal,
      );
      const conversaAtualizada = await saveConversationTurn(
        conversationId,
        question,
        resultado.answer,
        resultado.sources,
      );

      return res.status(200).json({
        ...resultado,
        conversationId: conversaAtualizada.id,
        conversationTitle: conversaAtualizada.title,
      });
    }

    const resultado = await perguntarChatGeral(question, history, ctrl.signal);
    return res.status(200).json(resultado);
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return;
    }
    if (error instanceof GeneralChatServiceError) {
      return res.status(error.status).json({ message: error.message });
    }
    console.error("Erro inesperado no chat geral:", error);
    return res.status(500).json({ message: "Erro interno ao processar o chat." });
  }
}
