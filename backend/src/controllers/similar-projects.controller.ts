import type { Request, Response } from "express";
import { getProjectParamsSchema } from "../schemas/project.schema";
import { similarProjectsQuerySchema } from "../schemas/similar-projects.schema";
import { criarControladorRequisicao, isAbortError } from "../services/ai-http.service";
import { AIServiceError } from "../services/chat-project.service";
import { findSimilarProjects } from "../services/similar-projects.service";

export async function similarProjectsController(req: Request, res: Response) {
  const params = getProjectParamsSchema.safeParse(req.params);
  if (!params.success) {
    return res.status(400).json({
      message: params.error.issues[0]?.message || "Identificador do projeto inválido.",
    });
  }

  const query = similarProjectsQuerySchema.safeParse(req.query);
  if (!query.success) {
    return res.status(400).json({
      message: query.error.issues[0]?.message || "Limite de resultados inválido.",
      errors: query.error.flatten().fieldErrors,
    });
  }

  const ctrl = criarControladorRequisicao(req, res);

  try {
    const response = await findSimilarProjects(params.data.id, query.data, ctrl.signal);
    if (ctrl.signal.aborted) return;
    return res.status(200).json(response);
  } catch (error) {
    if (isAbortError(error) || ctrl.signal.aborted) {
      return;
    }
    if (error instanceof AIServiceError) {
      return res.status(error.status).json({ message: error.message });
    }
    console.error("Erro ao buscar projetos semelhantes:", error);
    return res.status(500).json({ message: "Erro interno ao buscar projetos semelhantes." });
  }
}
