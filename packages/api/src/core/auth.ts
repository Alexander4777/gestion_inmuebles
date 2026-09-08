import type { Request, Response, NextFunction, RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { env } from './env';
import type { RolUsuario, TokenPayload } from '@proyecto-modular/shared/tipos/auth';

// Re-exportar para que el código existente que importaba `TokenPayload`
// desde `./auth` no rompa.
export type { TokenPayload } from '@proyecto-modular/shared/tipos/auth';

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

/**
 * Factory de middleware que exige uno o más roles.
 *
 * Usar siempre DESPUÉS de `requerirAuth` en la cadena (o como
 * `router.use(requerirRol(...))` en un router donde ya se aplicó
 * `requerirAuth` arriba).
 *
 * @example
 *   router.use(requerirAuth, requerirRol('admin'));
 */
export function requerirRol(...roles: RolUsuario[]): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.usuario) {
      res.status(401).json({ error: 'No autenticado' });
      return;
    }
    if (!roles.includes(req.usuario.rol)) {
      res.status(403).json({ error: 'No tienes permiso para este recurso' });
      return;
    }
    next();
  };
}