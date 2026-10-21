import { z } from "zod";

export const createProjectSchema = z.object({
  name: z.string().min(1),
  technologyIds: z
    .array(z.number().int().positive("Id de tecnologia inválido."))
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
              ).min(1),
            })
          ),
        })
      ),
    })
  ),
});

export const updateProjectSchema = z.object({
  name: z.string().min(1, "O projeto precisa de um nome."),
  technologyIds: z
    .array(z.number().int().positive("Id de tecnologia inválido."))
    .min(1, "Informe ao menos uma tecnologia."),
  status: z.enum(["PLANNED", "IN_PROGRESS", "DONE"]),

  epics: z.array(
    z.object({
      id: z.number().int(),
      name: z.string().min(1, "Todo épico precisa de um nome."),
      description: z.string().min(1, "Todo épico precisa de uma descrição."),
      objective: z.string().min(1, "Todo épico precisa de um objetivo."),
      expectedResult: z.string().min(1, "Todo épico precisa de um resultado esperado."),

      features: z.array(
        z.object({
          id: z.number().int(),
          name: z.string().min(1, "Toda feature precisa de um nome."),
          description: z.string().min(1, "Toda feature precisa de uma descrição."),
          approvalCriteria: z.string().min(1, "Toda feature precisa de critérios de aprovação."),

          pbis: z.array(
            z.object({
              id: z.number().int(),
              title: z.string().min(1, "Todo PBI precisa de um título."),
              userStory: z.string().min(1, "Todo PBI precisa de uma user story."),
              acceptanceCriteria: z.string().min(1, "Todo PBI precisa de critérios de aprovação."),
              developerIds: z
                .array(z.number().int().positive())
                .min(1, "Todo PBI precisa de ao menos um desenvolvedor."),
            })
          ),
        })
      ),
    })
  ),
});

export type UpdateProjectData = z.infer<typeof updateProjectSchema>;

export const getProjectParamsSchema = z.object({
  id: z.coerce
    .number({ message: "O identificador do projeto deve ser um número inteiro positivo." })
    .int("O identificador do projeto deve ser um número inteiro positivo.")
    .positive("O identificador do projeto deve ser um número inteiro positivo.")
    .max(2147483647, "O identificador informado excede o limite máximo permitido."),
});

export const projectIdParamSchema = getProjectParamsSchema;

export type GetProjectParams = z.infer<typeof getProjectParamsSchema>;
