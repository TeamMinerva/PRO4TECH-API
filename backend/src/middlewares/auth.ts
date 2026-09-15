import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserPayload } from '../@types/express';

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: 'Token não fornecido.' });
  }

  const parts = authHeader.split(' ');

  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ message: 'Token não fornecido.' });
  }

  const token = parts[1];
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('JWT_SECRET não foi configurado nas variáveis de ambiente.');
  }

  try {
    const decoded = jwt.verify(token, secret) as UserPayload;

    if (!decoded || typeof decoded !== 'object' || !decoded.id || !decoded.email) {
      return res.status(401).json({ message: 'Token inválido ou expirado.' });
    }

    req.user = {
      id: decoded.id,
      email: decoded.email,
    };

    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Token inválido ou expirado.' });
  }
}
