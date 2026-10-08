import { prisma } from "../lib/prisma";
import type { DeveloperDetailsResponse } from "../schemas/developer.schema";

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

export async function getDeveloper(
  id: number
): Promise<DeveloperDetailsResponse | null> {
  const developer = await prisma.developer.findUnique({
    where: { id },
    include: {
      technologies: {
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      },
      bugs: {
        select: {
          id: true,
          title: true,
          description: true,
          solution: true,
          projectId: true,
          createdAt: true,
          project: {
            select: {
              id: true,
              name: true,
              status: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      pbis: {
        select: {
          id: true,
          title: true,
          userStory: true,
          acceptanceCriteria: true,
          feature: {
            select: {
              name: true,
              epic: {
                select: {
                  name: true,
                  project: {
                    select: {
                      id: true,
                      name: true,
                      status: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { id: "asc" },
      },
    },
  });

  if (!developer) {
    return null;
  }

  const projectMap = new Map<number, { id: number; name: string; status: string }>();

  for (const pbi of developer.pbis) {
    const project = pbi.feature?.epic?.project;
    if (project && !projectMap.has(project.id)) {
      projectMap.set(project.id, {
        id: project.id,
        name: project.name,
        status: project.status,
      });
    }
  }

  for (const bug of developer.bugs) {
    const project = bug.project;
    if (project && !projectMap.has(project.id)) {
      projectMap.set(project.id, {
        id: project.id,
        name: project.name,
        status: project.status,
      });
    }
  }

  const projects = Array.from(projectMap.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  const bugs = developer.bugs.map((bug) => ({
    id: bug.id,
    title: bug.title,
    description: bug.description,
    solution: bug.solution,
    projectId: bug.projectId,
    projectName: bug.project.name,
    createdAt: bug.createdAt,
  }));

  const pbis = developer.pbis.map((pbi) => ({
    id: pbi.id,
    title: pbi.title,
    projectName: pbi.feature.epic.project.name,
    featureName: pbi.feature.name,
    epicName: pbi.feature.epic.name,
  }));

  return {
    id: developer.id,
    name: developer.name,
    active: developer.active,
    createdAt: developer.createdAt,
    technologies: developer.technologies,
    projects,
    bugs,
    pbis,
  };
}
