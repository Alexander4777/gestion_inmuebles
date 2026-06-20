import { Router } from 'express';
import { z } from 'zod';
import { direccionEsquema } from '@proyecto-modular/shared/esquemas/propiedades';
import { requerirAuth } from '../../core/auth';
import { propiedadesService } from './propiedades.service';

export const propiedadesRouter = Router();
propiedadesRouter.use(requerirAuth);

const propiedadCrearEsquema = direccionEsquema.extend({
  nombre: z.string().min(1, 'El nombre es requerido'),
  tipo: z.enum(['casa', 'departamento', 'local-comercial', 'bodega', 'otro']),
});

const propiedadActualizarEsquema = propiedadCrearEsquema.partial().extend({
  activa: z.boolean().optional(),
});

// ── GET / ─ Listar propiedades ──────────────────────────────────────────────────
propiedadesRouter.get('/', async (req, res) => {
  try {
    const { activa, busqueda } = req.query;
    const lista = await propiedadesService.listar({
      activa: activa === undefined ? undefined : activa === 'true',
      busqueda: busqueda as string | undefined,
    });
    res.json(lista);
  } catch (error) {
    console.error('Error al listar propiedades:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ── GET /:id — Obtener propiedad por ID ─────────────────────────────────────────
propiedadesRouter.get('/:id', async (req, res) => {
  try {
    const propiedad = await propiedadesService.obtenerPorId(req.params.id);
    if (!propiedad) {
      res.status(404).json({ error: 'Propiedad no encontrada' });
      return;
    }
    res.json(propiedad);
  } catch (error) {
    console.error('Error al obtener propiedad:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ── POST / — Crear propiedad ────────────────────────────────────────────────────
propiedadesRouter.post('/', async (req, res) => {
  try {
    const datos = propiedadCrearEsquema.parse(req.body);
    const propiedad = await propiedadesService.crear(datos);
    res.status(201).json(propiedad);
  } catch (error: any) {
    if (error?.name === 'ZodError') {
      res.status(400).json({ error: 'Datos inválidos', detalles: error.errors });
      return;
    }
    console.error('Error al crear propiedad:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ── PATCH /:id — Actualizar propiedad ───────────────────────────────────────────
propiedadesRouter.patch('/:id', async (req, res) => {
  try {
    const datos = propiedadActualizarEsquema.parse(req.body);
    const propiedad = await propiedadesService.actualizar(req.params.id, datos);
    if (!propiedad) {
      res.status(404).json({ error: 'Propiedad no encontrada' });
      return;
    }
    res.json(propiedad);
  } catch (error: any) {
    if (error?.name === 'ZodError') {
      res.status(400).json({ error: 'Datos inválidos', detalles: error.errors });
      return;
    }
    console.error('Error al actualizar propiedad:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ── DELETE /:id — Desactivar propiedad (soft delete) ────────────────────────────
propiedadesRouter.delete('/:id', async (req, res) => {
  try {
    const eliminado = await propiedadesService.eliminar(req.params.id);
    if (!eliminado) {
      res.status(404).json({ error: 'Propiedad no encontrada' });
      return;
    }
    res.status(204).send();
  } catch (error) {
    console.error('Error al eliminar propiedad:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});
