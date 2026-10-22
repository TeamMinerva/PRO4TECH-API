import { z } from "zod";

export const createConversationSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "O título da conversa não pode ser vazio.")
    .max(120, "O título deve ter no máximo 120 caracteres.")
    .optional(),
});

export const conversationParamsSchema = z.object({
  id: z.coerce
    .number({ message: "O identificador da conversa deve ser um número inteiro positivo." })
    .int("O identificador da conversa deve ser um número inteiro positivo.")
    .positive("O identificador da conversa deve ser um número inteiro positivo.")
    .max(2147483647, "O identificador informado excede o limite máximo permitido."),
});

export type CreateConversationInput = z.infer<typeof createConversationSchema>;
export type ConversationParams = z.infer<typeof conversationParamsSchema>;
