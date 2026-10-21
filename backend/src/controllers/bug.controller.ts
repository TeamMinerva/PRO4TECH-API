import { Request, Response } from "express";
import { createBugSchema } from "../schemas/bug.schema";
import { createBug } from "../services/bug.service";

export async function createBugController(
  req: Request,
  res: Response
) {
  try {
    const result = createBugSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        message: "Dados inválidos",
        errors: result.error.issues,
      });
    }

    const bug = await createBug(result.data);

    return res.status(201).json({
      message: "Bug cadastrado com sucesso",
      bug,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Projeto não encontrado") {
        return res.status(404).json({
          message: error.message,
        });
      }

      if (error.message === "Desenvolvedor não encontrado") {
        return res.status(404).json({
          message: error.message,
        });
      }
    }

    return res.status(500).json({
      message: "Erro ao cadastrar bug",
    });
  }
}