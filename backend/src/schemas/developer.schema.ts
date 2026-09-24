import { z } from "zod";

export const createDeveloperSchema = z.object({
  name: z
    .string('O campo "name" é obrigatório.')
    .trim()
    .min(2, "O nome deve ter no mínimo 2 caracteres.")
    .max(120, "O nome deve ter no máximo 120 caracteres."),

  skills: z
    .array(
      z
        .string()
        .trim()
        .min(1, "A competência não pode estar vazia.")
        .max(100, "Cada competência deve ter no máximo 100 caracteres.")
    )
    .min(1, "Informe ao menos uma competência técnica."),

  active: z.boolean().optional(),
});