import { Router, Request, Response } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = Router();
const prisma = new PrismaClient();

const registerSchema = z.object({
  email: z
    .string('O campo "email" é obrigatório.')
    .trim()
    .email('Formato de e-mail inválido.'),
  password: z
    .string('O campo "password" é obrigatório.')
    .min(6, 'A senha deve ter no mínimo 6 caracteres.'),
});

const loginSchema = z.object({
  email: z
    .string('O campo "email" é obrigatório.')
    .trim()
    .email('Formato de e-mail inválido.'),
  password: z
    .string('O campo "password" é obrigatório.')
    .min(1, 'O campo "password" é obrigatório.'),
});

// POST /register
router.post('/register', async (req: Request, res: Response) => {
  const parseResult = registerSchema.safeParse(req.body);

  if (!parseResult.success) {
    return res.status(400).json({
      message: 'Dados inválidos para cadastro de usuário.',
      errors: parseResult.error.flatten().fieldErrors,
    });
  }

  const { email, password } = parseResult.data;

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(409).json({
        message: 'E-mail já cadastrado.',
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
      },
      select: {
        id: true,
        email: true,
        createdAt: true,
      },
    });

    return res.status(201).json(user);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return res.status(409).json({
          message: 'E-mail já cadastrado.',
        });
      }

      console.error('Erro do Prisma ao registrar usuário:', error.code, error.message);
      return res.status(500).json({
        message: 'Erro ao persistir usuário no banco de dados.',
      });
    }

    console.error('Erro inesperado ao registrar usuário:', error);
    return res.status(500).json({
      message: 'Erro interno ao cadastrar usuário.',
    });
  }
});

// POST /login
router.post('/login', async (req: Request, res: Response) => {
  const parseResult = loginSchema.safeParse(req.body);

  if (!parseResult.success) {
    return res.status(400).json({
      message: 'Dados inválidos para autenticação.',
      errors: parseResult.error.flatten().fieldErrors,
    });
  }

  const { email, password } = parseResult.data;

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({
        message: 'Credenciais inválidas.',
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        message: 'Credenciais inválidas.',
      });
    }

    const secret = process.env.JWT_SECRET;

    if (!secret) {
      throw new Error('JWT_SECRET não foi configurado nas variáveis de ambiente.');
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      secret,
      { expiresIn: '1d' }
    );

    return res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        createdAt: user.createdAt,
      },
      token,
    });
  } catch (error) {
    console.error('Erro inesperado no login:', error);
    return res.status(500).json({
      message: 'Erro interno ao autenticar usuário.',
    });
  }
});

export default router;
