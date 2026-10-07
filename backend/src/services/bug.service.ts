import { PrismaClient } from "@prisma/client";
import { CreateBugInput } from "../schemas/bug.schema";

const prisma = new PrismaClient();

export async function createBug(data: CreateBugInput) {
  const project = await prisma.project.findUnique({
    where: {
      id: data.projectId,
    },
  });

  if (!project) {
    throw new Error("Projeto não encontrado");
  }

  const developer = await prisma.developer.findUnique({
    where: {
      id: data.developerId,
    },
  });

  if (!developer) {
    throw new Error("Desenvolvedor não encontrado");
  }

  return prisma.bug.create({
    data: {
      title: data.title,
      description: data.description,
      solution: data.solution,
      projectId: data.projectId,
      developerId: data.developerId,
    },
  });
}