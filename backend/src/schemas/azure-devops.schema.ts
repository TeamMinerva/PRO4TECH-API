import { z } from "zod";

export const createWorkItemSchema = z.object({
  type: z
    .string({ message: "O tipo do Work Item é obrigatório." })
    .trim()
    .min(1, "O tipo do Work Item é obrigatório."),
  title: z
    .string({ message: "O título do Work Item é obrigatório." })
    .trim()
    .min(1, "O título do Work Item é obrigatório.")
    .max(255, "O título do Work Item deve ter no máximo 255 caracteres."),
  description: z.string().trim().optional(),
  acceptanceCriteria: z.string().trim().optional(),
  parentId: z
    .number({ message: "O ID do item pai deve ser um número inteiro positivo." })
    .int("O ID do item pai deve ser um número inteiro positivo.")
    .positive("O ID do item pai deve ser um número inteiro positivo.")
    .optional(),
  assignedTo: z.string().trim().min(1, "O responsável informado é inválido.").optional(),
  state: z.string().trim().min(1, "O estado informado é inválido.").optional(),
  priority: z
    .number()
    .int("A prioridade deve ser um número inteiro entre 1 e 4.")
    .min(1, "A prioridade mínima é 1.")
    .max(4, "A prioridade máxima é 4.")
    .optional(),
  tags: z.array(z.string().trim().min(1)).optional(),
  additionalFields: z.record(z.string(), z.unknown()).optional(),
});

export type CreateWorkItemInput = z.infer<typeof createWorkItemSchema>;

export interface JsonPatchOperation {
  op: "add" | "replace" | "remove" | "test";
  path: string;
  value?: unknown;
  from?: string;
}

export interface WorkItemTypeSummary {
  name: string;
  referenceName: string;
  description: string;
  color?: string;
  iconUrl?: string;
  isDisabled: boolean;
  supportsAcceptanceCriteria: boolean;
}

export interface CreatedWorkItemResponse {
  id: number;
  rev: number;
  type: string;
  title: string;
  state?: string;
  description?: string;
  acceptanceCriteria?: string;
  parentId?: number;
  url: string;
  webUrl?: string;
  fields: Record<string, unknown>;
}

export interface CreateWorkItemOptions {
  availableTypes?: WorkItemTypeSummary[];
  skipTypeValidation?: boolean;
}
