import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { sql } from 'drizzle-orm';
import { generarToken } from '../../core/auth';
import { loginEsquema } from '@proyecto-modular/shared/esquemas/auth';
import { db } from '../../core/db';
import { inquilinos } from '../../core/db/esquema';

export const authRouter = Router();

/**
 * POST /auth/login — login unificado para admin e inquilino.
 *
 * El campo `usuario` se interpreta según el valor:
 *   - 'admin' (literal)  → compara contra admin/admin123 (temporal).
 *   - cualquier otro    → busca en `inquilinos` por lower(correo).
 *
 * Respuesta:
 *   { token, rol, inquilinoId? }
 *
 * El cliente decide a dónde enrutar según `rol`.
 */
authRouter.post('/login', async (req, res) => {
  try {
    const { usuario, password } = loginEsquema.parse(req.body);

    // ── Admin (credenciales hardcoded de desarrollo) ────────────────────────────
    if (usuario === 'admin') {
      if (password === 'admin123') {
        const token = generarToken({ sub: 'admin', rol: 'admin' });
        res.json({ token, rol: 'admin' });
        return;
      }
      res.status(401).json({ error: 'Credenciales inválidas' });
      return;
    }

    // ── Inquilino: lookup por correo (case-insensitive) ─────────────────────────
    const filas = await db
      .select({
        id: inquilinos.id,
        passwordHash: inquilinos.passwordHash,
        activo: inquilinos.activo,
      })
      .from(inquilinos)
      .where(sql`lower(${inquilinos.correo}) = lower(${usuario})`)
      .limit(1);

    const fila = filas[0];

    if (!fila || !fila.passwordHash || !fila.activo) {
      // Mismo mensaje para "no existe" / "sin cuenta" / "mal password" / "inactivo"
      // para no filtrar cuál fue el motivo.
      res.status(401).json({ error: 'Credenciales inválidas' });
      return;
    }

    const passwordOk = await bcrypt.compare(password, fila.passwordHash);
    if (!passwordOk) {
      res.status(401).json({ error: 'Credenciales inválidas' });
      return;
    }

    const token = generarToken({
      sub: fila.id,
      rol: 'inquilino',
      inquilinoId: fila.id,
    });
    res.json({ token, rol: 'inquilino', inquilinoId: fila.id });
  } catch (error: any) {
    if (error?.name === 'ZodError') {
      res.status(400).json({ error: 'Datos inválidos', detalles: error.errors });
      return;
    }
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});