import { z } from "zod";

export const registerSchema = z.object({
  email: z
    .string('O campo "email" é obrigatório.')
    .trim()
    .email("Formato de e-mail inválido."),
  password: z
    .string('O campo "password" é obrigatório.')
    .min(6, "A senha deve ter no mínimo 6 caracteres."),
});

export const loginSchema = z.object({
  email: z
    .string('O campo "email" é obrigatório.')
    .trim()
    .email("Formato de e-mail inválido."),
  password: z
    .string('O campo "password" é obrigatório.')
    .min(1, 'O campo "password" é obrigatório.'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
