import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from './env';

export interface TokenPayload {
  sub: string;
  rol: 'admin' | 'operador';
  iat?: number;
  exp?: number;
}

export function generarToken(payload: Omit<TokenPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: '24h' });
}

export function verificarToken(token: string): TokenPayload {
  return jwt.verify(token, env.JWT_SECRET) as TokenPayload;
}

/**
 * Middleware que exige autenticación JWT.
 * Se monta en rutas protegidas.
 */
export function requerirAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    _res.status(401).json({ error: 'Token no proporcionado' });
    return;
  }

  try {
    const token = header.slice(7);
    req.usuario = verificarToken(token);
    next();
  } catch {
    _res.status(401).json({ error: 'Token inválido o expirado' });
  }
}
