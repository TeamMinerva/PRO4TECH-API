import type { Request, Response } from "express";
import { z } from "zod";
import { developerIdParamSchema } from "../schemas/developer.schema";
import {
  DeveloperChatError,
  askAboutDeveloper,
} from "../services/developer-chat.service";

const chatBodySchema = z.object({
  question: z
    .string()
    .trim()
    .min(1, "Digite uma pergunta.")
    .max(1500, "A pergunta deve ter no máximo 1500 caracteres."),

  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().trim().min(1).max(6000),
      }),
    )
    .max(10, "O histórico deve conter no máximo 10 mensagens.")
    .default([]),
});

export async function developerChatController(
  req: Request,
  res: Response,
) {
  const params = developerIdParamSchema.safeParse(req.params);

  if (!params.success) {
    return res.status(400).json({
      message: "Identificador de desenvolvedor inválido.",
    });
  }

  const body = chatBodySchema.safeParse(req.body);

  if (!body.success) {
    return res.status(400).json({
      message: body.error.issues[0]?.message || "Mensagem inválida.",
    });
  }

  try {
    const answer = await askAboutDeveloper(
      params.data.id,
      body.data.question,
      body.data.history,
    );

    return res.json({ answer });
  } catch (error) {
    if (error instanceof DeveloperChatError) {
      return res.status(error.status).json({ message: error.message });
    }

    console.error("Erro no chat do desenvolvedor:", error);

    return res.status(500).json({
      message: "Erro interno ao processar a pergunta.",
    });
  }
}