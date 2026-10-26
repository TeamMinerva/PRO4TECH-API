import { prisma } from "../lib/prisma";
import type { CreateBugInput } from "../schemas/bug.schema";
import { IndexacaoService } from "./indexacao.service";

const indexador = new IndexacaoService();

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

  const bug = await prisma.bug.create({
    data: normalize(data),
  });

  indexador.atualizarProjetoNoRAG(bug.projectId);
  indexador.atualizarDesenvolvedorNoRAG(bug.developerId);

  return bug;
}

export async function updateBug(id: number, data: CreateBugInput) {
  const existing = await prisma.bug.findUnique({
    where: { id },
    select: { id: true, projectId: true, developerId: true },
  });

  if (!existing) {
    throw new Error("Bug não encontrado");
  }

  await validateRelations(data);

  const updatedBug = await prisma.bug.update({
    where: { id },
    data: normalize(data),
  });

  indexador.atualizarProjetoNoRAG(updatedBug.projectId);
  indexador.atualizarDesenvolvedorNoRAG(updatedBug.developerId);

  if (existing.projectId !== updatedBug.projectId) {
    indexador.atualizarProjetoNoRAG(existing.projectId);
  }

  if (existing.developerId !== updatedBug.developerId) {
    indexador.atualizarDesenvolvedorNoRAG(existing.developerId);
  }

  return updatedBug;
}
