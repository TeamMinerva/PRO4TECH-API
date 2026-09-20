import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";
import { RegisterInput, LoginInput } from "../schemas/auth.schema";

export async function findUserByEmail(email: string) {
  return await prisma.user.findUnique({
    where: { email },
  });
}

export async function registerUser(data: RegisterInput) {
  const existingUser = await findUserByEmail(data.email);

  if (existingUser) {
    return null;
  }

  const hashedPassword = await bcrypt.hash(data.password, 10);

  return await prisma.user.create({
    data: {
      email: data.email,
      password: hashedPassword,
    },
    select: {
      id: true,
      email: true,
      createdAt: true,
    },
  });
}

export async function loginUser(data: LoginInput) {
  const user = await findUserByEmail(data.email);

  if (!user) {
    return null;
  }

  const isPasswordValid = await bcrypt.compare(data.password, user.password);

  if (!isPasswordValid) {
    return null;
  }

  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET não foi configurado nas variáveis de ambiente.");
  }

  const token = jwt.sign(
    { id: user.id, email: user.email },
    secret,
    { expiresIn: "1d" }
  );

  return {
    user: {
      id: user.id,
      email: user.email,
      createdAt: user.createdAt,
    },
    token,
  };
}
