import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import type { UpdateProjectData } from "../schemas/project.schema";
import { IndexacaoService } from "./indexacao.service";

const indexador = new IndexacaoService();

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
    technologyIds: number[];
    status: 'PLANNED' | 'IN_PROGRESS' | 'DONE';
    epics: CreateEpicData[];
}

export async function createProject(data: CreateProjectData) {
    return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        const project = await tx.project.create({
            data: {
                name: data.name,
                technologies: {
                    connect: [...new Set(data.technologyIds)].map((id) => ({ id })),
                },
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
                technologies: true,
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

        indexador.atualizarProjetoNoRAG(project.id);

        return project;
    });
}

export async function getProjectById(id: number) {
    const project = await prisma.project.findUnique({
        where: { id },
        include: {
            technologies: {
                select: { id: true, name: true },
                orderBy: { name: "asc" },
            },
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
                                            active: true,
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

    const developerMap = new Map<number, { id: number; name: string }>();

    for (const epic of project.epics) {
        for (const feature of epic.features) {
            for (const pbi of feature.pbis) {
                for (const dev of pbi.developers) {
                    if (!developerMap.has(dev.id)) {
                        developerMap.set(dev.id, {
                            id: dev.id,
                            name: dev.name,
                        });
                    }
                }
            }
        }
    }

    const developers = Array.from(developerMap.values()).sort((a, b) =>
        a.name.localeCompare(b.name)
    );

    const techIds = project.technologies.map((t: any) => t.id);
    let similarProjects: Array<{
        id: number;
        name: string;
        technologies: string[];
        status: string;
    }> = [];

    if (techIds.length > 0) {
        const found = await prisma.project.findMany({
            where: {
                id: {
                    not: project.id,
                },
                technologies: {
                    some: {
                        id: { in: techIds },
                    },
                },
            },
            take: 5,
            orderBy: { name: "asc" },
            select: {
                id: true,
                name: true,
                status: true,
                technologies: {
                    select: { name: true },
                    orderBy: { name: "asc" },
                },
            },
        });

        similarProjects = found.map((p: any) => ({
            id: p.id,
            name: p.name,
            status: p.status,
            technologies: p.technologies.map((t: any) => t.name),
        }));
    }

    const backlog = project.epics.flatMap((epic: any) =>
        epic.features.flatMap((feature: any) =>
            feature.pbis.map((pbi: any) => ({
                id: pbi.id,
                title: pbi.title,
                userStory: pbi.userStory,
                acceptanceCriteria: pbi.acceptanceCriteria,
                developers: pbi.developers.map((dev: any) => ({
                    id: dev.id,
                    name: dev.name,
                })),
            }))
        )
    );

    return {
        id: project.id,
        name: project.name,
        technologies: project.technologies.map((t: any) => t.name),
        technologyIds: project.technologies.map((t: any) => t.id),
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

export const getProject = getProjectById;

export async function updateProject(id: number, data: UpdateProjectData) {
    return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        const existing = await tx.project.findUnique({
            where: { id },
            select: {
                epics: {
                    select: {
                        id: true,
                        features: { select: { id: true, pbis: { select: { id: true } } } },
                    },
                },
            },
        });

        if (!existing) {
            return null;
        }

        const epicIds = new Set(existing.epics.map((e: any) => e.id));
        const featureIds = new Set(existing.epics.flatMap((e: any) => e.features.map((f: any) => f.id)));
        const pbiIds = new Set(
            existing.epics.flatMap((e: any) => e.features.flatMap((f: any) => f.pbis.map((p: any) => p.id)))
        );

        const keptEpics = new Set(data.epics.map((e: any) => e.id));
        const keptFeatures = new Set(data.epics.flatMap((e: any) => e.features.map((f: any) => f.id)));
        const keptPbis = new Set(
            data.epics.flatMap((e: any) => e.features.flatMap((f: any) => f.pbis.map((p: any) => p.id)))
        );

        await tx.pBI.deleteMany({ where: { id: { in: [...pbiIds].filter((i) => !keptPbis.has(i)) } } });
        await tx.feature.deleteMany({
            where: { id: { in: [...featureIds].filter((i) => !keptFeatures.has(i)) } },
        });
        await tx.epic.deleteMany({ where: { id: { in: [...epicIds].filter((i) => !keptEpics.has(i)) } } });

        await tx.project.update({
            where: { id },
            data: {
                name: data.name,
                technologies: {
                    set: [...new Set(data.technologyIds)].map((techId) => ({ id: techId })),
                },
                status: data.status,
            },
        });

        for (const epic of data.epics) {
            const epicData = {
                name: epic.name,
                description: epic.description,
                objective: epic.objective,
                expectedResult: epic.expectedResult,
            };
            const savedEpic = epicIds.has(epic.id)
                ? await tx.epic.update({ where: { id: epic.id }, data: epicData })
                : await tx.epic.create({ data: { ...epicData, projectId: id } });

            for (const feature of epic.features) {
                const featureData = {
                    name: feature.name,
                    description: feature.description,
                    approvalCriteria: feature.approvalCriteria,
                };
                const savedFeature = featureIds.has(feature.id)
                    ? await tx.feature.update({ where: { id: feature.id }, data: featureData })
                    : await tx.feature.create({ data: { ...featureData, epicId: savedEpic.id } });

                for (const pbi of feature.pbis) {
                    const pbiData = {
                        title: pbi.title,
                        userStory: pbi.userStory,
                        acceptanceCriteria: pbi.acceptanceCriteria,
                    };
                    const developers = pbi.developerIds.map((devId: any) => ({ id: devId }));

                    if (pbiIds.has(pbi.id)) {
                        await tx.pBI.update({
                            where: { id: pbi.id },
                            data: { ...pbiData, featureId: savedFeature.id, developers: { set: developers } },
                        });
                    } else {
                        await tx.pBI.create({
                            data: {
                                ...pbiData,
                                featureId: savedFeature.id,
                                developers: { connect: developers },
                            },
                        });
                    }
                }
            }
        }

        indexador.atualizarProjetoNoRAG(id);

        return { id };
    });
}