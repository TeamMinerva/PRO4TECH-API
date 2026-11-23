import { z } from "zod";

export const createBugSchema = z.object({
  title: z.string().min(1, "O título é obrigatório"),
  description: z.string().min(1, "A descrição é obrigatória"),
  solution: z.string().min(1, "A solução é obrigatória"),
  projectId: z.number().int().positive("O projeto é inválido"),
  developerId: z.number().int().positive("O desenvolvedor é inválido"),
});

export type CreateBugInput = z.infer<typeof createBugSchema>;