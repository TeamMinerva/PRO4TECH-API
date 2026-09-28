import { z } from "zod";
import { ProjectStatus } from "@prisma/client";

export const listProjectsQuerySchema = z.object({
  search: z.string().trim().min(1).optional(),
  status: z.nativeEnum(ProjectStatus).optional(),
});

export type ListProjectsQuery = z.infer<typeof listProjectsQuerySchema>;