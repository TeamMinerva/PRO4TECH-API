import type { Request, Response } from "express";
import { createWorkItemSchema } from "../schemas/azure-devops.schema";
import {
  AzureDevOpsServiceError,
  createWorkItem,
  getWorkItemTypes,
} from "../services/azure-devops.service";
import {
  exportProjectBacklogToAzure,
  ExportConflictError,
  ProjectNotFoundError,
} from "../services/azure-export.service";

function handleAzureControllerError(error: unknown, res: Response, fallbackMessage: string) {
  if (error instanceof ProjectNotFoundError) {
    return res.status(404).json({
      message: error.message,
    });
  }

  if (error instanceof ExportConflictError) {
    return res.status(409).json({
      message: error.message,
    });
  }

  if (error instanceof AzureDevOpsServiceError) {
    return res.status(error.status).json({
      message: error.message,
      ...(error.details !== undefined ? { details: error.details } : {}),
    });
  }

  console.error("[AzureDevOpsController]", fallbackMessage, error);
  return res.status(500).json({
    message: fallbackMessage,
  });
}


export async function listWorkItemTypesController(req: Request, res: Response) {
  const forceRefresh = req.query.refresh === "true";

  try {
    const workItemTypes = await getWorkItemTypes({ forceRefresh });
    return res.status(200).json({
      count: workItemTypes.length,
      workItemTypes,
    });
  } catch (error) {
    return handleAzureControllerError(
      error,
      res,
      "Erro interno ao consultar os tipos de Work Items no Azure DevOps.",
    );
  }
}

export async function createWorkItemController(req: Request, res: Response) {
  const parsed = createWorkItemSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      message:
        parsed.error.issues[0]?.message ||
        "Dados inválidos para criação do Work Item.",
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  try {
    const workItem = await createWorkItem(parsed.data);
    return res.status(201).json({
      message: "Work Item criado com sucesso no Azure DevOps.",
      workItem,
    });
  } catch (error) {
    return handleAzureControllerError(
      error,
      res,
      "Erro interno ao criar Work Item no Azure DevOps.",
    );
  }
}

export async function exportProjectBacklogController(req: Request, res: Response) {
  const paramValue = req.params.id ?? req.params.projectId;
  const projectId = Number(paramValue);

  if (!Number.isInteger(projectId) || projectId <= 0) {
    return res.status(400).json({
      message: "O identificador do projeto informado deve ser um número inteiro positivo.",
    });
  }

  try {
    const result = await exportProjectBacklogToAzure(projectId);
    return res.status(200).json(result);
  } catch (error) {
    return handleAzureControllerError(
      error,
      res,
      `Erro interno ao exportar o backlog do projeto ${projectId} para o Azure Boards.`,
    );
  }
}

