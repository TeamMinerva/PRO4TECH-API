import { prisma } from "../lib/prisma";
import {
  developerRecommendationAiResponseSchema,
  type RecommendDevelopersInput,
} from "../schemas/developer-recommendation.schema";
import { AIServiceError, postarParaIA } from "./chat-project.service";

export interface RecommendedDeveloperResult {
  developerId: number;
  name: string;
  score: number;
  justification: string;
  evidence: string[];
}

export interface DeveloperRecommendationResult {
  pbiId: number | null;
  developers: RecommendedDeveloperResult[];
  message: string;
  automaticAssignment: boolean;
}

export async function recommendDevelopersForPbi(
  input: RecommendDevelopersInput,
): Promise<DeveloperRecommendationResult> {
  const inactiveDevelopers = await prisma.developer.findMany({
    where: { active: false },
    select: { id: true },
  });
  const inactiveDeveloperIds = inactiveDevelopers.map(({ id }: { id: number }) => id);
  const inactiveSet = new Set(inactiveDeveloperIds);

  const response = await postarParaIA<unknown>("/developers/recommend", {
    pbi_id: input.pbiId ?? null,
    title: input.title,
    user_story: input.userStory,
    acceptance_criteria: input.acceptanceCriteria,
    limit: input.limit,
    inactive_developer_ids: inactiveDeveloperIds,
  });

  const parsedResponse = developerRecommendationAiResponseSchema.safeParse(response);
  if (!parsedResponse.success) {
    console.error(
      "Resposta inválida do serviço de recomendação de desenvolvedores:",
      parsedResponse.error.issues,
    );
    throw new AIServiceError("O serviço de IA retornou uma resposta inválida.", 502);
  }

  const aiResult = parsedResponse.data;
  const developers = aiResult.developers
    .filter((developer) => !inactiveSet.has(developer.developer_id))
    .map((developer) => ({
      developerId: developer.developer_id,
      name: developer.name,
      score: developer.score,
      justification: developer.justification,
      evidence: developer.evidence,
    }));

  return {
    pbiId: aiResult.pbi_id,
    developers,
    message: aiResult.message,
    automaticAssignment: aiResult.automatic_assignment,
  };
}
