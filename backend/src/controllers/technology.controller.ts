import type { Request, Response } from "express";
import { Prisma } from "@prisma/client";

import {
  createTechnologySchema,
  listTechnologiesQuerySchema,
  technologyIdParamSchema,
  updateTechnologySchema,
} from "../schemas/technology.schema";
import * as technologyService from "../services/technology.service";

function handleError(error: unknown, res: Response, action: string) {
  if (error instanceof technologyService.TechnologyNameConflictError) {
    return res.status(409).json({ message: error.message });
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2025") {
      return res.status(404).json({ message: "Tecnologia não encontrada." });
    }

    if (error.code === "P2002") {
      return res
        .status(409)
        .json({ message: "Já existe uma tecnologia com esse nome." });
    }
  }

  console.error(`Erro inesperado ao ${action} tecnologia:`, error);

  return res.status(500).json({ message: `Erro interno ao ${action} tecnologia.` });
}

export async function listTechnologiesController(req: Request, res: Response) {
  const query = listTechnologiesQuerySchema.safeParse(req.query);

  if (!query.success) {
    return res.status(400).json({
      message: "Parâmetros de busca inválidos.",
      errors: query.error.flatten().fieldErrors,
    });
  }

  try {
    return res.json(await technologyService.listTechnologies(query.data));
  } catch (error) {
    return handleError(error, res, "listar");
  }
}

export async function getTechnologyController(req: Request, res: Response) {
  const params = technologyIdParamSchema.safeParse(req.params);

  if (!params.success) {
    return res.status(400).json({ message: "Id de tecnologia inválido." });
  }

  try {
    const technology = await technologyService.getTechnology(params.data.id);

    if (!technology) {
      return res.status(404).json({ message: "Tecnologia não encontrada." });
    }

    return res.json(technology);
  } catch (error) {
    return handleError(error, res, "buscar");
  }
}

export async function createTechnologyController(req: Request, res: Response) {
  const body = createTechnologySchema.safeParse(req.body);

  if (!body.success) {
    return res.status(400).json({
      message: "Dados inválidos para cadastro de tecnologia.",
      errors: body.error.flatten().fieldErrors,
    });
  }

  try {
    const technology = await technologyService.createTechnology(body.data);
    return res.status(201).json(technology);
  } catch (error) {
    return handleError(error, res, "cadastrar");
  }
}

export async function updateTechnologyController(req: Request, res: Response) {
  const params = technologyIdParamSchema.safeParse(req.params);
  const body = updateTechnologySchema.safeParse(req.body);

  if (!params.success || !body.success) {
    return res.status(400).json({
      message: "Dados inválidos para edição de tecnologia.",
      errors: {
        ...(params.success ? {} : params.error.flatten().fieldErrors),
        ...(body.success ? {} : body.error.flatten().fieldErrors),
      },
    });
  }

  try {
    const technology = await technologyService.updateTechnology(
      params.data.id,
      body.data
    );
    return res.json(technology);
  } catch (error) {
    return handleError(error, res, "editar");
  }
}

export async function deleteTechnologyController(req: Request, res: Response) {
  const params = technologyIdParamSchema.safeParse(req.params);

  if (!params.success) {
    return res.status(400).json({ message: "Id de tecnologia inválido." });
  }

  try {
    await technologyService.deleteTechnology(params.data.id);
    return res.status(204).send();
  } catch (error) {
    return handleError(error, res, "remover");
  }
}
