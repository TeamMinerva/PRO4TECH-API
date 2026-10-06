import { prisma } from "../lib/prisma";

interface CreateDeveloperData {
  name: string;
  technologyIds: number[];
  active?: boolean;
}

export async function createDeveloper(data: CreateDeveloperData) {
  return await prisma.developer.create({
    data: {
      name: data.name,
      technologies: {
        connect: [...new Set(data.technologyIds)].map((id) => ({ id })),
      },
      ...(data.active !== undefined ? { active: data.active } : {}),
    },
    include: { technologies: true },
  });
}

export async function getDeveloper(id: number) {
  return await prisma.developer.findUnique({
    where: { id },
    include: {
      technologies: { select: { id: true, name: true }, orderBy: { name: "asc" } },
    },
  });
}
