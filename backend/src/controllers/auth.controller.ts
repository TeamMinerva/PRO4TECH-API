import { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { registerSchema, loginSchema } from "../schemas/auth.schema";
import { registerUser, loginUser } from "../services/auth.service";

export async function registerController(req: Request, res: Response) {
  const parseResult = registerSchema.safeParse(req.body);

  if (!parseResult.success) {
    return res.status(400).json({
      message: "Dados inválidos para cadastro de usuário.",
      errors: parseResult.error.flatten().fieldErrors,
    });
  }

  try {
    const user = await registerUser(parseResult.data);

    if (!user) {
      return res.status(409).json({
        message: "E-mail já cadastrado.",
      });
    }

    return res.status(201).json(user);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return res.status(409).json({
          message: "E-mail já cadastrado.",
        });
      }

      console.error(
        "Erro do Prisma ao registrar usuário:",
        error.code,
        error.message
      );

      return res.status(500).json({
        message: "Erro ao persistir usuário no banco de dados.",
      });
    }

    console.error("Erro inesperado ao registrar usuário:", error);

    return res.status(500).json({
      message: "Erro interno ao cadastrar usuário.",
    });
  }
}

export async function loginController(req: Request, res: Response) {
  const parseResult = loginSchema.safeParse(req.body);

  if (!parseResult.success) {
    return res.status(400).json({
      message: "Dados inválidos para autenticação.",
      errors: parseResult.error.flatten().fieldErrors,
    });
  }

  try {
    const result = await loginUser(parseResult.data);

    if (!result) {
      return res.status(401).json({
        message: "Credenciais inválidas.",
      });
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error("Erro inesperado no login:", error);

    return res.status(500).json({
      message: "Erro interno ao autenticar usuário.",
    });
  }
}
