import { z } from "zod";

const texto = z.string().trim().max(4000);
const curto = z.string().trim().max(200);

const pbiDraftSchema = z
  .object({
    title: texto.optional(),
    userStory: texto.optional(),
    acceptanceCriteria: texto.optional(),
    developers: z.array(curto).max(30).optional(),
  })
  .strict();

const featureDraftSchema = z
  .object({
    name: texto.optional(),
    description: texto.optional(),
    approvalCriteria: texto.optional(),
    pbis: z.array(pbiDraftSchema).max(50).optional(),
  })
  .strict();

const epicDraftSchema = z
  .object({
    name: texto.optional(),
    description: texto.optional(),
    objective: texto.optional(),
    expectedResult: texto.optional(),
    features: z.array(featureDraftSchema).max(30).optional(),
  })
  .strict();

export const projectDraftSchema = z
  .object({
    name: texto.optional(),
    status: curto.optional(),
    technologies: z.array(curto).max(50).optional(),
    epics: z.array(epicDraftSchema).max(30).optional(),
  })
  .strict();

export type ProjectDraft = z.infer<typeof projectDraftSchema>;
