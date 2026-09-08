/**
 * Tipos del sistema de autenticación.
 *
 * Compartidos entre backend (emisor del JWT) y frontend (decodifica el payload
 * para decidir a dónde enrutar). El backend es la fuente de verdad — el frontend
 * NO verifica la firma, eso siempre lo hace el server.
 */

export type RolUsuario = 'admin' | 'operador' | 'inquilino';

/**
 * Payload del JWT firmado por el backend.
 *
 * `sub` identifica al sujeto (literal `'admin'` para admin, o el UUID del
 * inquilino para rol='inquilino'). `inquilinoId` se duplica como claim
 * dedicada para que el frontend pueda enrutar sin decodificar sub.
 */
export interface TokenPayload {
  sub: string;
  rol: RolUsuario;
  inquilinoId?: string;
  iat?: number;
  exp?: number;
}

/**
 * Subset del payload que el frontend guarda en memoria (sin iat/exp).
 */
export interface SesionUsuario {
  rol: RolUsuario;
  inquilinoId?: string;
}