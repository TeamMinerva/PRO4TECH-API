import { Request, Response } from "express";
import { createProject, getProject } from "../services/project.service";
import { createProjectSchema, projectIdParamSchema } from "../schemas/project.schema";

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

export async function getProjectController(
  req: Request,
  res: Response
) {
  const params = projectIdParamSchema.safeParse(req.params);

  if (!params.success) {
    return res.status(400).json({
      message: "Id de projeto inválido"
    });
  }

  try {
    const project = await getProject(params.data.id);

    if (!project) {
      return res.status(404).json({
        message: "Projeto não encontrado"
      });
    }

    return res.json(project);

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Erro interno ao buscar projeto"
    });
  }
}
