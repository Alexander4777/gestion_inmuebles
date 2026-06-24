import { Router } from 'express';
import { z } from 'zod';
import { inquilinoEsquema } from '@proyecto-modular/shared/esquemas/inquilinos';
import { requerirAuth } from '../../core/auth';
import { inquilinosService } from './inquilinos.service';

export const inquilinosRouter = Router();
inquilinosRouter.use(requerirAuth);

const inquilinoActualizarEsquema = inquilinoEsquema.partial().extend({
  activo: z.boolean().optional(),
});

// ── GET / — Listar inquilinos ───────────────────────────────────────────────────
inquilinosRouter.get('/', async (req, res) => {
  try {
    const { activo, busqueda } = req.query;
    const lista = await inquilinosService.listar({
      activo: activo === undefined ? undefined : activo === 'true',
      busqueda: busqueda as string | undefined,
    });
    res.json(lista);
  } catch (error) {
    console.error('Error al listar inquilinos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ── GET /:id — Obtener inquilino por ID ─────────────────────────────────────────
inquilinosRouter.get('/:id', async (req, res) => {
  try {
    const inquilino = await inquilinosService.obtenerPorId(req.params.id);
    if (!inquilino) {
      res.status(404).json({ error: 'Inquilino no encontrado' });
      return;
    }
    res.json(inquilino);
  } catch (error) {
    console.error('Error al obtener inquilino:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ── POST / — Crear inquilino ────────────────────────────────────────────────────
inquilinosRouter.post('/', async (req, res) => {
  try {
    const datos = inquilinoEsquema.parse(req.body);
    const inquilino = await inquilinosService.crear(datos);
    res.status(201).json(inquilino);
  } catch (error: any) {
    if (error?.name === 'ZodError') {
      res.status(400).json({ error: 'Datos inválidos', detalles: error.errors });
      return;
    }
    console.error('Error al crear inquilino:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ── PATCH /:id — Actualizar inquilino ───────────────────────────────────────────
inquilinosRouter.patch('/:id', async (req, res) => {
  try {
    const datos = inquilinoActualizarEsquema.parse(req.body);
    const inquilino = await inquilinosService.actualizar(req.params.id, datos);
    if (!inquilino) {
      res.status(404).json({ error: 'Inquilino no encontrado' });
      return;
    }
    res.json(inquilino);
  } catch (error: any) {
    if (error?.name === 'ZodError') {
      res.status(400).json({ error: 'Datos inválidos', detalles: error.errors });
      return;
    }
    console.error('Error al actualizar inquilino:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ── DELETE /:id — Desactivar inquilino (soft delete) ────────────────────────────
inquilinosRouter.delete('/:id', async (req, res) => {
  try {
    const eliminado = await inquilinosService.eliminar(req.params.id);
    if (!eliminado) {
      res.status(404).json({ error: 'Inquilino no encontrado' });
      return;
    }
    res.status(204).send();
  } catch (error) {
    console.error('Error al eliminar inquilino:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});
