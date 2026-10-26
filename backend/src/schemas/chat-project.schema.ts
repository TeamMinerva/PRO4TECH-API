import { z } from "zod";

const TEXTO_MAX = 8000;

export const chatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().trim().min(1, "A mensagem não pode ser vazia.").max(TEXTO_MAX),
});

// Corpo comum a qualquer chat contextualizado (projeto, desenvolvedor, ...).
// O contexto em si (qual projeto, etc.) vem da rota, nunca do corpo.
export const chatBodySchema = z.object({
  question: z
    .string()
    .trim()
    .min(1, "Digite uma pergunta.")
    .max(TEXTO_MAX, `A pergunta deve ter no máximo ${TEXTO_MAX} caracteres.`),
  history: z.array(chatMessageSchema).max(20, "Histórico longo demais.").default([]),
});

export type ChatMessage = z.infer<typeof chatMessageSchema>;
export type ChatBody = z.infer<typeof chatBodySchema>;
