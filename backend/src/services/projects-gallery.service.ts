import { prisma } from "../lib/prisma";
import type { ListProjectsQuery } from "../schemas/projects-gallery.schema";

export async function listProjects({ search, status }: ListProjectsQuery) {
  return prisma.project.findMany({
    where: {
      ...(search && { name: { contains: search, mode: "insensitive" } }),
      ...(status && { status }),
    },
    select: { id: true, name: true, status: true },
    orderBy: { name: "asc" },
  });
}