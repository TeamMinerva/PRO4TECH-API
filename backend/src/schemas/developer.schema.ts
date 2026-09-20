import { z } from "zod";

export const createDeveloperSchema = z.object({
  name: z
    .string('O campo "name" é obrigatório.')
    .trim()
    .min(2, "O nome deve ter no mínimo 2 caracteres.")
    .max(120, "O nome deve ter no máximo 120 caracteres."),

  skills: z
    .string('O campo "skills" é obrigatório.')
    .trim()
    .min(1, "Informe ao menos uma competência técnica.")
    .max(500, 'O campo "skills" deve ter no máximo 500 caracteres.'),

  active: z.boolean().optional(),
});