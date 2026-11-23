import { z } from "zod";

export const recommendDevelopersBodySchema = z.object({
  pbiId: z.number().int().positive().nullable().optional(),
  title: z
    .string({ message: "O título do PBI deve ser um texto." })
    .trim()
    .min(1, "O título do PBI é obrigatório.")
    .max(500, "O título do PBI deve ter no máximo 500 caracteres."),
  userStory: z
    .string()
    .trim()
    .max(8000, "A user story deve ter no máximo 8000 caracteres.")
    .optional()
    .default(""),
  acceptanceCriteria: z
    .string()
    .trim()
    .max(8000, "Os critérios de aprovação devem ter no máximo 8000 caracteres.")
    .optional()
    .default(""),
  limit: z.coerce.number().int().min(1).max(10).optional().default(3),
});

export const developerRecommendationAiResponseSchema = z.object({
  pbi_id: z.number().int().positive().nullable(),
  developers: z.array(
    z.object({
      developer_id: z.number().int().positive(),
      name: z.string().min(1),
      score: z.number().finite().min(0).max(1),
      justification: z.string().min(1),
      evidence: z.array(z.string()),
    }),
  ),
  message: z.string(),
  automatic_assignment: z.boolean(),
});

export type RecommendDevelopersInput = z.infer<typeof recommendDevelopersBodySchema>;
