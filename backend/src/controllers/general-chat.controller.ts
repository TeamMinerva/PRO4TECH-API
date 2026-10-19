import { Request, Response } from "express";
import { generalChatBodySchema } from "../schemas/general-chat.schema";
import { GeneralChatServiceError, perguntarChatGeral } from "../services/general-chat.service";

export async function chatGeralController(req: Request, res: Response) {
  const body = generalChatBodySchema.safeParse(req.body);
  if (!body.success) {
    return res.status(400).json({
      message: body.error.issues[0]?.message || "Mensagem inválida.",
      errors: body.error.flatten().fieldErrors,
    });
  }

  try {
    const resultado = await perguntarChatGeral(body.data.question, body.data.history);
    return res.status(200).json(resultado);
  } catch (error) {
    if (error instanceof GeneralChatServiceError) {
      return res.status(error.status).json({ message: error.message });
    }
    console.error("Erro inesperado no chat geral:", error);
    return res.status(500).json({ message: "Erro interno ao processar o chat." });
  }
}
