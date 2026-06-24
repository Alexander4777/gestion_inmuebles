import { Router } from 'express';
import { z } from 'zod';
import { mantenimientoEsquema } from '@proyecto-modular/shared/esquemas/mantenimiento';
import { requerirAuth } from '../../core/auth';
import { mantenimientosService } from './mantenimientos.service';

export const mantenimientosRouter = Router();
mantenimientosRouter.use(requerirAuth);

const mantenimientoActualizarEsquema = mantenimientoEsquema.partial().extend({
  estatus: z.enum(['pendiente', 'en-progreso', 'completado', 'cancelado']).optional(),
});

// ── GET / — Listar mantenimientos ───────────────────────────────────────────────
mantenimientosRouter.get('/', async (req, res) => {
  try {
    const { estatus, categoria, propiedadId } = req.query;
    const lista = await mantenimientosService.listar({
      estatus: estatus as 'pendiente' | 'en-progreso' | 'completado' | 'cancelado' | undefined,
      categoria: categoria as 'electricidad' | 'fontaneria' | 'carpinteria' | 'albañileria' | 'materiales' | 'otro' | undefined,
      propiedadId: propiedadId as string | undefined,
    });
    res.json(lista);
  } catch (error) {
    console.error('Error al listar mantenimientos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ── GET /:id — Obtener mantenimiento por ID ─────────────────────────────────────
mantenimientosRouter.get('/:id', async (req, res) => {
  try {
    const mantenimiento = await mantenimientosService.obtenerPorId(req.params.id);
    if (!mantenimiento) {
      res.status(404).json({ error: 'Mantenimiento no encontrado' });
      return;
    }
    res.json(mantenimiento);
  } catch (error) {
    console.error('Error al obtener mantenimiento:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ── POST / — Crear mantenimiento ────────────────────────────────────────────────
mantenimientosRouter.post('/', async (req, res) => {
  try {
    const datos = mantenimientoEsquema.parse(req.body);
    const mantenimiento = await mantenimientosService.crear(datos);
    res.status(201).json(mantenimiento);
  } catch (error: any) {
    if (error?.name === 'ZodError') {
      res.status(400).json({ error: 'Datos inválidos', detalles: error.errors });
      return;
    }
    console.error('Error al crear mantenimiento:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ── PATCH /:id — Actualizar mantenimiento ───────────────────────────────────────
mantenimientosRouter.patch('/:id', async (req, res) => {
  try {
    const datos = mantenimientoActualizarEsquema.parse(req.body);
    const mantenimiento = await mantenimientosService.actualizar(req.params.id, datos);
    if (!mantenimiento) {
      res.status(404).json({ error: 'Mantenimiento no encontrado' });
      return;
    }
    res.json(mantenimiento);
  } catch (error: any) {
    if (error?.name === 'ZodError') {
      res.status(400).json({ error: 'Datos inválidos', detalles: error.errors });
      return;
    }
    console.error('Error al actualizar mantenimiento:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ── DELETE /:id — Eliminar mantenimiento ────────────────────────────────────────
mantenimientosRouter.delete('/:id', async (req, res) => {
  try {
    const eliminado = await mantenimientosService.eliminar(req.params.id);
    if (!eliminado) {
      res.status(404).json({ error: 'Mantenimiento no encontrado' });
      return;
    }
    res.status(204).send();
  } catch (error) {
    console.error('Error al eliminar mantenimiento:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});
