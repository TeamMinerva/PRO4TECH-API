import { z } from "zod";

export const createProjectSchema = z.object({
  name: z.string().min(1),
  technologies: z
    .array(z.string().trim().min(1, "O nome da tecnologia não pode estar vazio."))
    .min(1, "Informe ao menos uma tecnologia."),
  status: z.enum(["PLANNED", "IN_PROGRESS", "DONE"]),

  epics: z.array(
    z.object({
      name: z.string().min(1),
      description: z.string().min(1),
      objective: z.string().min(1),
      expectedResult: z.string().min(1),

      features: z.array(
        z.object({
          name: z.string().min(1),
          description: z.string().min(1),
          approvalCriteria: z.string().min(1),

          pbis: z.array(
            z.object({
              title: z.string().min(1),
              userStory: z.string().min(1),
              acceptanceCriteria: z.string().min(1),

              developerIds: z.array(
                z.number().int().positive()
              ).min(1)
            })
          )
        })
      )
    })
  )
});