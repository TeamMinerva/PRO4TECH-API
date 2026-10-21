import { z } from "zod";

export const createDeveloperSchema = z.object({
  name: z
    .string('O campo "name" é obrigatório.')
    .trim()
    .min(2, "O nome deve ter no mínimo 2 caracteres.")
    .max(120, "O nome deve ter no máximo 120 caracteres."),

  technologyIds: z
    .array(z.number().int().positive("Id de tecnologia inválido."))
    .min(1, "Informe ao menos uma tecnologia."),

  active: z.boolean().optional(),
});

export const developerIdParamSchema = z.object({
  id: z.coerce.number().int().positive("Id inválido."),
});
