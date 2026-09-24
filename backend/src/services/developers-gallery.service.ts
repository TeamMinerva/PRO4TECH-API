import { prisma } from "../lib/prisma";
import type { ListDevelopersQuery } from "../schemas/developers-gallery.schema"

export async function listDevelopers({ search, active }: ListDevelopersQuery) {
  return prisma.developer.findMany({
    where: {
      ...(search && { name: { contains: search, mode: "insensitive" } }),
      ...(active !== undefined && { active }),
    },
    select: { id: true, name: true, active: true },
    orderBy: { name: "asc" },
  });
}