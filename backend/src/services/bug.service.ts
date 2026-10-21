import { prisma } from "../lib/prisma";
import { CreateBugInput } from "../schemas/bug.schema";
import { IndexacaoService } from "./indexacao.service";

const indexador = new IndexacaoService();

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

  const bug = await prisma.bug.create({
    data: {
      title: data.title,
      description: data.description,
      solution: data.solution,
      projectId: data.projectId,
      developerId: data.developerId,
    },
  });

  indexador.atualizarProjetoNoRAG(bug.projectId);

  return bug;
}