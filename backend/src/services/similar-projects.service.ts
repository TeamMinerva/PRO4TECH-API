import { prisma } from "../lib/prisma";
import { similarProjectsAiResponseSchema, type SimilarProjectsQuery } from "../schemas/similar-projects.schema";
import { AIServiceError, postarParaIA } from "./chat-project.service";

export async function findSimilarProjects(projectId: number, { limit }: SimilarProjectsQuery) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true },
  });
  if (!project) {
    throw new AIServiceError("Projeto não encontrado.", 404);
  }

  const candidates = await prisma.project.findMany({
    where: { id: { not: projectId } },
    select: { id: true },
  });
  const candidateIds = [...new Set(candidates.map(({ id }) => id))];

  const response = await postarParaIA<unknown>("/projects/similar", {
    project_id: projectId,
    candidate_project_ids: candidateIds,
    limit,
  });
  const parsedResponse = similarProjectsAiResponseSchema.safeParse(response);
  if (!parsedResponse.success) {
    console.error("Resposta inválida do serviço de projetos semelhantes:", parsedResponse.error.issues);
    throw new AIServiceError("O serviço de IA retornou uma resposta inválida.", 502);
  }

  const aiResult = parsedResponse.data;
  const allowedIds = new Set(candidateIds);
  if (
    aiResult.project_id !== projectId
    || aiResult.similar_projects.length > limit
    || aiResult.unavailable_project_ids.some((id) => id === projectId || !allowedIds.has(id))
  ) {
    throw new AIServiceError("O serviço de IA retornou uma resposta inválida.", 502);
  }
  const returnedIds = new Set<number>();
  for (const [index, result] of aiResult.similar_projects.entries()) {
    if (
      result.project_id === projectId
      || !allowedIds.has(result.project_id)
      || returnedIds.has(result.project_id)
      || (index > 0 && result.similarity > aiResult.similar_projects[index - 1].similarity)
    ) {
      throw new AIServiceError("O serviço de IA retornou projetos inválidos.", 502);
    }
    returnedIds.add(result.project_id);
  }

  const projects = await prisma.project.findMany({
    where: { id: { in: [...returnedIds] } },
    select: {
      id: true,
      name: true,
      status: true,
      technologies: {
        select: { name: true },
        orderBy: { name: "asc" },
      },
    },
  });
  const projectsById = new Map(projects.map((result) => [result.id, result]));

  return {
    projectId,
    similarProjects: aiResult.similar_projects.flatMap((result) => {
      const details = projectsById.get(result.project_id);
      if (!details) {
        return [];
      }
      return [{
        projectId: details.id,
        name: details.name,
        status: details.status,
        technologies: details.technologies.map(({ name }) => name),
        similarity: result.similarity,
        justification: result.justification,
        evidence: result.evidence.map(({ text, source_text }) => ({
          text,
          sourceText: source_text,
        })),
      }];
    }),
  };
}
