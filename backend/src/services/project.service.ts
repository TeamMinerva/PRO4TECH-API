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

        return project;
    });
}

export async function getProject(id: number) {
    return await prisma.project.findUnique({
        where: { id },
        include: {
            technologies: { select: { id: true, name: true }, orderBy: { name: "asc" } },
            epics: {
                orderBy: { id: "asc" },
                include: {
                    features: {
                        orderBy: { id: "asc" },
                        include: {
                            pbis: {
                                orderBy: { id: "asc" },
                                include: {
                                    developers: { select: { id: true, name: true, active: true } },
                                },
                            },
                        },
                    },
                },
            },
        },
    });
}
