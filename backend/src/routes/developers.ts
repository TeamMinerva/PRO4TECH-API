import { Router, Request, Response } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

// Schema de validação do payload de criação
const createDeveloperSchema = z.object({
  name: z
    .string('O campo "name" é obrigatório.')
    .trim()
    .min(2, 'O nome deve ter no mínimo 2 caracteres.')
    .max(120, 'O nome deve ter no máximo 120 caracteres.'),

  skills: z
    .string('O campo "skills" é obrigatório.')
    .trim()
    .min(1, 'Informe ao menos uma competência técnica.')
    .max(500, 'O campo "skills" deve ter no máximo 500 caracteres.'),

  active: z.boolean().optional(),
});

router.post('/', async (req: Request, res: Response) => {
  const parseResult = createDeveloperSchema.safeParse(req.body);

  if (!parseResult.success) {
    return res.status(400).json({
      message: 'Dados inválidos para cadastro de desenvolvedor.',
      errors: parseResult.error.flatten().fieldErrors,
    });
  }

  const { name, skills, active } = parseResult.data;

  try {
    const developer = await prisma.developer.create({
      data: {
        name,
        skills,
        ...(active !== undefined ? { active } : {}),
      },
    });

    return res.status(201).json(developer);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      console.error(
        'Erro do Prisma ao criar desenvolvedor:',
        error.code,
        error.message
      );

      return res.status(500).json({
        message: 'Erro ao persistir desenvolvedor no banco de dados.',
      });
    }

    console.error('Erro inesperado ao criar desenvolvedor:', error);

    return res.status(500).json({
      message: 'Erro interno ao cadastrar desenvolvedor.',
    });
  }
});

export default router;