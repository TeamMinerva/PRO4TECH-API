import { prisma } from "../lib/prisma";
import type { CreateBugInput } from "../schemas/bug.schema";

async function validateRelations(data: CreateBugInput) {
  const [project, developer] = await Promise.all([
    prisma.project.findUnique({
      where: { id: data.projectId },
      select: { id: true },
    }),
    prisma.developer.findUnique({
      where: { id: data.developerId },
      select: { id: true },
    }),
  ]);

  if (!project) {
    throw new Error("Projeto não encontrado");
  }

  if (!developer) {
    throw new Error("Desenvolvedor não encontrado");
  }
}

function normalize(data: CreateBugInput) {
  const normalized = {
    title: data.title.trim(),
    description: data.description.trim(),
    solution: data.solution.trim(),
    projectId: data.projectId,
    developerId: data.developerId,
  };

  return normalized;
}

export async function createBug(data: CreateBugInput) {
  await validateRelations(data);

  return prisma.bug.create({
    data: normalize(data),
  });
}

export async function updateBug(id: number, data: CreateBugInput) {
  const existing = await prisma.bug.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!existing) {
    throw new Error("Bug não encontrado");
  }

  await validateRelations(data);

  return prisma.bug.update({
    where: { id },
    data: normalize(data),
  });
}