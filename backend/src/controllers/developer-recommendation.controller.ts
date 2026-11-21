import { Request, Response } from "express";
import { recommendDevelopersBodySchema } from "../schemas/developer-recommendation.schema";
import { criarControladorRequisicao, isAbortError } from "../services/ai-http.service";
import { AIServiceError } from "../services/chat-project.service";
import { recommendDevelopersForPbi } from "../services/developer-recommendation.service";

export async function recommendDevelopersController(req: Request, res: Response) {
  const body = recommendDevelopersBodySchema.safeParse(req.body);
  if (!body.success) {
    return res.status(400).json({
      message: body.error.issues[0]?.message || "Dados do PBI inválidos.",
      errors: body.error.flatten().fieldErrors,
    });
  }

  const ctrl = criarControladorRequisicao(req, res);

  try {
    const result = await recommendDevelopersForPbi(body.data, ctrl.signal);
    if (ctrl.signal.aborted) return;
    return res.status(200).json(result);
  } catch (error) {
    if (isAbortError(error) || ctrl.signal.aborted) {
      return;
    }
    if (error instanceof AIServiceError) {
      return res.status(error.status).json({ message: error.message });
    }
    console.error("Erro inesperado ao recomendar desenvolvedores:", error);
    return res.status(500).json({ message: "Erro interno ao recomendar desenvolvedores." });
  }
}
