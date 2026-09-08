/**
 * Portal router — endpoints read-only para inquilinos autenticados.
 *
 * Montado en /api/portal desde core/app.ts.
 * TODO el router exige rol='inquilino' (no admin).
 */

import { Router } from 'express';
import { requerirAuth, requerirRol } from '../../core/auth';
import { portalService } from './portal.service';

export const portalRouter = Router();

portalRouter.use(requerirAuth);
portalRouter.use(requerirRol('inquilino'));

// ── GET /mi-contrato — Contrato vigente del inquilino autenticado ───────────────
portalRouter.get('/mi-contrato', async (req, res) => {
  try {
    const inquilinoId = req.usuario?.inquilinoId;
    if (!inquilinoId) {
      // El JWT no trae inquilinoId → algo está mal (token inconsistente)
      res.status(401).json({ error: 'Sesión inválida' });
      return;
    }

    const contrato = await portalService.obtenerContratoVigente(inquilinoId);
    if (!contrato) {
      res.status(404).json({ error: 'Sin contrato vigente' });
      return;
    }

    res.json(contrato);
  } catch (error) {
    console.error('Error al obtener contrato del portal:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ── GET /mi-perfil — Datos del propio inquilino (para saludo) ──────────────────
portalRouter.get('/mi-perfil', async (req, res) => {
  try {
    const inquilinoId = req.usuario?.inquilinoId;
    if (!inquilinoId) {
      res.status(401).json({ error: 'Sesión inválida' });
      return;
    }

    const inquilino = await portalService.obtenerInquilino(inquilinoId);
    if (!inquilino) {
      res.status(404).json({ error: 'Inquilino no encontrado' });
      return;
    }

    res.json(inquilino);
  } catch (error) {
    console.error('Error al obtener perfil del portal:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});