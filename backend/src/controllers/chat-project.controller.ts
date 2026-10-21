import { Request, Response } from "express";
import { chatBodySchema } from "../schemas/chat-project.schema";
import { getProjectParamsSchema } from "../schemas/project.schema";
import { ChatServiceError, perguntarSobreProjeto } from "../services/chat-project.service";

export async function chatProjetoController(req: Request, res: Response) {
  const params = getProjectParamsSchema.safeParse(req.params);
  if (!params.success) {
    return res.status(400).json({
      message: params.error.issues[0]?.message || "Identificador do projeto inválido.",
    });
  }

  const body = chatBodySchema.safeParse(req.body);
  if (!body.success) {
    return res.status(400).json({
      message: body.error.issues[0]?.message || "Mensagem inválida.",
      errors: body.error.flatten().fieldErrors,
    });
  }

  try {
    const answer = await perguntarSobreProjeto(params.data.id, body.data.question, body.data.history);
    return res.status(200).json({ answer });
  } catch (error) {
    if (error instanceof ChatServiceError) {
      return res.status(error.status).json({ message: error.message });
    }
    console.error("Erro inesperado no chat do projeto:", error);
    return res.status(500).json({ message: "Erro interno ao processar o chat." });
  }
}
