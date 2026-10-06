import { Request, Response } from "express";
import { Prisma } from "@prisma/client";

import { createDeveloperSchema, developerIdParamSchema } from "../schemas/developer.schema";
import { createDeveloper, getDeveloper } from "../services/developer.service";

export async function createDeveloperController(
  req: Request,
  res: Response
) {
  const parseResult = createDeveloperSchema.safeParse(req.body);

  if (!parseResult.success) {
    return res.status(400).json({
      message: "Dados inválidos para cadastro de desenvolvedor.",
      errors: parseResult.error.flatten().fieldErrors,
    });
  }

  try {
    const developer = await createDeveloper(parseResult.data);

    return res.status(201).json(developer);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return res.status(400).json({
          message: "Uma ou mais tecnologias informadas não existem.",
        });
      }

      console.error(
        "Erro do Prisma ao criar desenvolvedor:",
        error.code,
        error.message
      );

      return res.status(500).json({
        message: "Erro ao persistir desenvolvedor no banco de dados.",
      });
    }

    console.error("Erro inesperado ao criar desenvolvedor:", error);

    return res.status(500).json({
      message: "Erro interno ao cadastrar desenvolvedor.",
    });
  }
}

export async function getDeveloperController(req: Request, res: Response) {
  const params = developerIdParamSchema.safeParse(req.params);

  if (!params.success) {
    return res.status(400).json({ message: "Id de desenvolvedor inválido." });
  }

  try {
    const developer = await getDeveloper(params.data.id);

    if (!developer) {
      return res.status(404).json({ message: "Desenvolvedor não encontrado." });
    }

    return res.json(developer);
  } catch (error) {
    console.error("Erro inesperado ao buscar desenvolvedor:", error);

    return res.status(500).json({
      message: "Erro interno ao buscar desenvolvedor.",
    });
  }
}
