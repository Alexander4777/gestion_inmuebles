/**
 * Esquemas Zod del sistema de autenticación.
 *
 * Usados por el router de /api/auth para validar el body de login.
 * Mantenerlos en `shared/` permite que el frontend los reuse para validación
 * cliente si decide mostrar mensajes de error antes de pegarle al server.
 */

import { z } from 'zod';

/**
 * Body de POST /api/auth/login.
 *
 * El campo `usuario` es el identificador: literal 'admin' para admin,
 * o el correo del inquilino para rol='inquilino'. El server decide a qué
 * tabla pegarle según el valor.
 */
export const loginEsquema = z.object({
  usuario: z.string().min(1, 'El usuario es requerido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

export type LoginEntrada = z.infer<typeof loginEsquema>;

/**
 * Body de POST /api/inquilinos/:id/cuenta (endpoint admin para fijar password).
 */
export const establecerPasswordEsquema = z.object({
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .max(72, 'La contraseña no puede exceder 72 caracteres'),
});

export type EstablecerPasswordEntrada = z.infer<typeof establecerPasswordEsquema>;