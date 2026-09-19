import { Request, Response } from "express";
import { createProject } from "../services/project.service";
import { createProjectSchema } from "../schemas/project.schema";

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