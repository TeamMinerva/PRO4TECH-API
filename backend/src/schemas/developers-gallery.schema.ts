import { z } from "zod";

export const listDevelopersQuerySchema = z.object({
  search: z.string().trim().min(1).optional(),
  active: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .optional(),
});

export type ListDevelopersQuery = z.infer<typeof listDevelopersQuerySchema>;