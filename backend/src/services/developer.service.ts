import { prisma } from "../lib/prisma";
import { IndexacaoService } from "./indexacao.service";

const indexador = new IndexacaoService();

interface CreateDeveloperData {
  name: string;
  technologyIds: number[];
  active?: boolean;
}

export async function createDeveloper(data: CreateDeveloperData) {
  const developer = await prisma.developer.create({
    data: {
      name: data.name,
      technologies: {
        connect: [...new Set(data.technologyIds)].map((id) => ({ id })),
      },
      ...(data.active !== undefined ? { active: data.active } : {}),
    },
    include: { technologies: true },
  });

  indexador.atualizarDesenvolvedorNoRAG(developer.id);

  return developer;
}

export async function getDeveloper(id: number) {
  return await prisma.developer.findUnique({
    where: { id },
    include: {
      technologies: { select: { id: true, name: true }, orderBy: { name: "asc" } },
    },
  });
}