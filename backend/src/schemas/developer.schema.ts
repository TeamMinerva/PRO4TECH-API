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

export type CreateDeveloperInput = z.infer<typeof createDeveloperSchema>;
export type DeveloperIdParam = z.infer<typeof developerIdParamSchema>;

export interface DeveloperTechnologyDTO {
  id: number;
  name: string;
}

export interface DeveloperProjectDTO {
  id: number;
  name: string;
  status: string;
}

export interface DeveloperBugDTO {
  id: number;
  title: string;
  description: string;
  solution: string;
  projectId: number;
  projectName: string;
  createdAt: Date;
}

export interface DeveloperPBIDTO {
  id: number;
  title: string;
  projectName: string;
  featureName: string;
  epicName: string;
}

export interface DeveloperDetailsResponse {
  id: number;
  name: string;
  active: boolean;
  createdAt: Date;
  technologies: DeveloperTechnologyDTO[];
  projects: DeveloperProjectDTO[];
  bugs: DeveloperBugDTO[];
  pbis: DeveloperPBIDTO[];
}
