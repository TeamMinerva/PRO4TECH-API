import { z } from "zod";

const TEXTO_MAX = 8000;

export const generalChatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().trim().min(1, "A mensagem não pode ser vazia.").max(TEXTO_MAX),
});

export const generalChatBodySchema = z.object({
  question: z
    .string()
    .trim()
    .min(1, "Digite uma pergunta.")
    .max(TEXTO_MAX, `A pergunta deve ter no máximo ${TEXTO_MAX} caracteres.`),
  history: z.array(generalChatMessageSchema).max(20, "Histórico longo demais.").default([]),
});

export type GeneralChatMessage = z.infer<typeof generalChatMessageSchema>;
export type GeneralChatBody = z.infer<typeof generalChatBodySchema>;
