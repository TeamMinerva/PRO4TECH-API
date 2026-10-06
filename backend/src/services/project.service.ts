import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";

interface CreatePBIData {
    title: string;
    userStory: string;
    acceptanceCriteria: string;
    developerIds: number[];
}

interface CreateFeatureData {
    name: string;
    description: string;
    approvalCriteria: string;
    pbis: CreatePBIData[];
}

interface CreateEpicData {
    name: string;
    description: string;
    objective: string;
    expectedResult: string;
    features: CreateFeatureData[];
}

interface CreateProjectData {
    name: string;
    technologies: string[];
    status: 'PLANNED' | 'IN_PROGRESS' | 'DONE';
    epics: CreateEpicData[];
}

export async function createProject(data: CreateProjectData) {
    return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        const project = await tx.project.create({
            data: {
                name: data.name,
                technologies: data.technologies,
                status: data.status,

                epics: {
                    create: data.epics.map((epic) => ({
                        name: epic.name,
                        description: epic.description,
                        objective: epic.objective,
                        expectedResult: epic.expectedResult,

                        features: {
                            create: epic.features.map((feature) => ({
                                name: feature.name,
                                description: feature.description,
                                approvalCriteria: feature.approvalCriteria,

                                pbis: {
                                    create: feature.pbis.map((pbi) => ({
                                        title: pbi.title,
                                        userStory: pbi.userStory,
                                        acceptanceCriteria: pbi.acceptanceCriteria,

                                        developers: {
                                            connect: pbi.developerIds.map((developerId) => ({
                                                id: developerId,
                                            })),
                                        },
                                    })),
                                },
                            })),
                        },
                    })),
                }
            },

            include: {
                epics: {
                    include: {
                        features: {
                            include: {
                                pbis: {
                                    include: {
                                        developers: true
                                    }
                                }
                            }
                        }
                    }
                }
            }

        });

        return project;
    });
}

export async function getProjectById(id: number) {
    const project = await prisma.project.findUnique({
        where: { id },
        include: {
            bugs: {
                orderBy: { createdAt: "desc" },
                include: {
                    developer: { select: { id: true, name: true } },
                },
            },
            epics: {
                orderBy: { id: "asc" },
                include: {
                    features: {
                        orderBy: { id: "asc" },
                        include: {
                            pbis: {
                                orderBy: { id: "asc" },
                                include: {
                                    developers: {
                                        select: {
                                            id: true,
                                            name: true,
                                            skills: true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
    });

    if (!project) {
        return null;
    }

    const developerMap = new Map<number, { id: number; name: string; skills: string[] }>();

    for (const epic of project.epics) {
        for (const feature of epic.features) {
            for (const pbi of feature.pbis) {
                for (const dev of pbi.developers) {
                    if (!developerMap.has(dev.id)) {
                        developerMap.set(dev.id, {
                            id: dev.id,
                            name: dev.name,
                            skills: dev.skills,
                        });
                    }
                }
            }
        }
    }

    const developers = Array.from(developerMap.values()).sort((a, b) =>
        a.name.localeCompare(b.name)
    );

    let similarProjects: Array<{
        id: number;
        name: string;
        technologies: string[];
        status: string;
    }> = [];

    if (project.technologies && project.technologies.length > 0) {
        similarProjects = await prisma.project.findMany({
            where: {
                id: {
                    not: project.id,
                },
                technologies: {
                    hasSome: project.technologies,
                },
            },
            take: 5,
            orderBy: { name: "asc" },
            select: {
                id: true,
                name: true,
                technologies: true,
                status: true,
            },
        });
    }

    const backlog = project.epics.flatMap((epic) =>
        epic.features.flatMap((feature) =>
            feature.pbis.map((pbi) => ({
                id: pbi.id,
                title: pbi.title,
                userStory: pbi.userStory,
                acceptanceCriteria: pbi.acceptanceCriteria,
                developers: pbi.developers.map((dev) => ({
                    id: dev.id,
                    name: dev.name,
                })),
            }))
        )
    );

    return {
        id: project.id,
        name: project.name,
        technologies: project.technologies,
        status: project.status,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        developers,
        similarProjects,
        backlog,
        bugs: project.bugs,
        epics: project.epics,
    };
}
