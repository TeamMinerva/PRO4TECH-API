import type { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { createBugSchema } from "../schemas/bug.schema";
import { createBug, updateBug } from "../services/bug.service";

const bugParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

function respondError(error: unknown, res: Response) {
  if (
    error instanceof Error
    && [
      "Projeto não encontrado",
      "Desenvolvedor não encontrado",
      "Bug não encontrado",
    ].includes(error.message)
  ) {
    return res.status(404).json({ message: error.message });
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2025") {
      return res.status(404).json({ message: "Bug não encontrado." });
    }

    if (error.code === "P2003") {
      return res.status(400).json({
        message: "O projeto ou o desenvolvedor informado não está disponível.",
      });
    }
  }

  console.error("Erro ao salvar bug:", error);

  return res.status(500).json({
    message: "Não foi possível salvar o bug.",
  });
}

export async function createBugController(req: Request, res: Response) {
  const result = createBugSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      message: "Dados inválidos.",
      errors: result.error.issues,
    });
  }

  try {
    const bug = await createBug(result.data);

    return res.status(201).json({
      message: "Bug cadastrado com sucesso.",
      bug,
    });
  } catch (error) {
    return respondError(error, res);
  }
}

export async function updateBugController(req: Request, res: Response) {
  const params = bugParamsSchema.safeParse(req.params);
  const body = createBugSchema.safeParse(req.body);

  if (!params.success) {
    return res.status(400).json({
      message: "Identificador de bug inválido.",
    });
  }

  if (!body.success) {
    return res.status(400).json({
      message: "Dados inválidos.",
      errors: body.error.issues,
    });
  }

  try {
    const bug = await updateBug(params.data.id, body.data);

    return res.json({
      message: "Bug atualizado com sucesso.",
      bug,
    });
  } catch (error) {
    return respondError(error, res);
  }
}