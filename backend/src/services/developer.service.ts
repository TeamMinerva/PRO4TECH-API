import { prisma } from "../lib/prisma";

interface CreateDeveloperData {
  name: string;
  skills: string;
  active?: boolean;
}

export async function createDeveloper(data: CreateDeveloperData) {
  return await prisma.developer.create({
    data: {
      name: data.name,
      skills: data.skills,
      ...(data.active !== undefined ? { active: data.active } : {}),
    },
  });
}