import { prisma } from "../lib/prisma";
import type { ListTechnologiesQuery } from "../schemas/technology.schema";

export class TechnologyNameConflictError extends Error {
  constructor() {
    super("Já existe uma tecnologia com esse nome.");
  }
}

export async function listTechnologies({ search }: ListTechnologiesQuery) {
  return prisma.technology.findMany({
    where: search ? { name: { contains: search, mode: "insensitive" } } : {},
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}

export async function getTechnology(id: number) {
  return prisma.technology.findUnique({
    where: { id },
    include: {
      developers: { select: { id: true, name: true, active: true } },
      projects: { select: { id: true, name: true, status: true } },
    },
  });
}

async function assertNameAvailable(name: string, ignoreId?: number) {
  const existing = await prisma.technology.findFirst({
    where: {
      name: { equals: name, mode: "insensitive" },
      ...(ignoreId !== undefined && { id: { not: ignoreId } }),
    },
    select: { id: true },
  });

  if (existing) throw new TechnologyNameConflictError();
}

export async function createTechnology(data: { name: string }) {
  await assertNameAvailable(data.name);
  return prisma.technology.create({ data: { name: data.name } });
}

export async function updateTechnology(id: number, data: { name: string }) {
  await assertNameAvailable(data.name, id);
  return prisma.technology.update({ where: { id }, data: { name: data.name } });
}

export async function deleteTechnology(id: number) {
  return prisma.technology.delete({ where: { id } });
}
