import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { UserPayload } from "../@types/express";

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: "Token não fornecido." });
  }

  const parts = authHeader.split(" ");

  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return res.status(401).json({ message: "Token não fornecido." });
  }

  const token = parts[1];
  const secret = process.env.JWT_SECRET;

  if (!token) {
    return res.status(401).json({ message: "Token não fornecido." });
  }

  if (!secret) {
    console.error("JWT_SECRET não foi configurado nas variáveis de ambiente.");
    return res.status(500).json({
      message: "Erro de configuração de autenticação no servidor.",
    });
  }

  try {
    const decoded = jwt.verify(token, secret) as UserPayload;

    if (
      !decoded ||
      typeof decoded !== "object" ||
      typeof decoded.id !== "number" ||
      !Number.isInteger(decoded.id) ||
      decoded.id <= 0 ||
      typeof decoded.email !== "string" ||
      decoded.email.trim().length === 0
    ) {
      return res.status(401).json({ message: "Token inválido ou expirado." });
    }

    req.user = {
      id: decoded.id,
      email: decoded.email,
    };

    return next();
  } catch {
    return res.status(401).json({ message: "Token inválido ou expirado." });
  }
}
