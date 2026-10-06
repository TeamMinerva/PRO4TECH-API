import { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { createProject, getProjectById } from "../services/project.service";
import {
  createProjectSchema,
  getProjectParamsSchema,
} from "../schemas/project.schema";

export async function createProjectController(
  req: Request,
  res: Response
) {
  try {
    const data = createProjectSchema.parse(req.body);

    const project = await createProject(data);

    return res.status(201).json(project);

  } catch (error) {
    console.error(error);

    return res.status(400).json({
      message: "Dados inválidos para criação do projeto"
    });
  }
}

export async function getProjectByIdController(
  req: Request,
  res: Response
) {
  const parseResult = getProjectParamsSchema.safeParse(req.params);

  if (!parseResult.success) {
    return res.status(400).json({
      message: parseResult.error.issues[0]?.message || "Identificador do projeto inválido.",
      errors: parseResult.error.flatten().fieldErrors,
    });
  }

  try {
    const project = await getProjectById(parseResult.data.id);

    if (!project) {
      return res.status(404).json({
        message: "Projeto não encontrado.",
      });
    }

    return res.status(200).json(project);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      console.error(
        "Erro do Prisma ao buscar detalhes do projeto:",
        error.code,
        error.message
      );

      if (error.code === "P2020") {
        return res.status(400).json({
          message: "Identificador de projeto fora do intervalo suportado.",
        });
      }

      return res.status(500).json({
        message: "Erro no banco de dados ao buscar projeto.",
      });
    }

    console.error("Erro inesperado ao buscar detalhes do projeto:", error);

    return res.status(500).json({
      message: "Erro interno ao buscar projeto.",
    });
  }
}