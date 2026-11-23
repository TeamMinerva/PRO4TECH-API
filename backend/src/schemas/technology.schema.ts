import { z } from "zod";

const technologyName = z
  .string('O campo "name" é obrigatório.')
  .trim()
  .min(1, "O nome da tecnologia não pode estar vazio.")
  .max(100, "O nome da tecnologia deve ter no máximo 100 caracteres.");

export const createTechnologySchema = z.object({
  name: technologyName,
});

export const updateTechnologySchema = z.object({
  name: technologyName,
});

export const technologyIdParamSchema = z.object({
  id: z.coerce.number().int().positive("Id de tecnologia inválido."),
});

export const listTechnologiesQuerySchema = z.object({
  search: z.string().trim().min(1).optional(),
});

export type ListTechnologiesQuery = z.infer<typeof listTechnologiesQuerySchema>;
