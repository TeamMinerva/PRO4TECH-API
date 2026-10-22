import { z } from "zod";

export const similarProjectsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(20).default(5),
});

export const similarProjectsAiResponseSchema = z.object({
  project_id: z.number().int().positive(),
  similar_projects: z.array(
    z.object({
      project_id: z.number().int().positive(),
      similarity: z.number().finite().min(0).max(1),
      justification: z.string().min(1),
      evidence: z.array(
        z.object({
          text: z.string().min(1),
          source_text: z.string().min(1),
        }),
      ),
    }),
  ),
  unavailable_project_ids: z.array(z.number().int().positive()),
});

export type SimilarProjectsQuery = z.infer<typeof similarProjectsQuerySchema>;
