import { Router } from 'express';
import { requerirAuth } from '../../core/auth';
import { movimientosService } from './movimientos.service';
import {
  movimientoEsquema,
  movimientoActualizarEsquema,
  estadoResultadosEsquema,
} from '@proyecto-modular/shared/esquemas/contabilidad';
import type { TipoMovimiento } from '@proyecto-modular/shared/tipos/contabilidad';

export const movimientosRouter = Router();
movimientosRouter.use(requerirAuth);

// ── GET /estado-resultados — Reporte mensual (debe ir antes de /:id) ──────────
movimientosRouter.get('/estado-resultados', async (req, res) => {
  try {
    const { mes, año } = estadoResultadosEsquema.parse(req.query);
    const reporte = await movimientosService.calcularEstadoResultados(mes, año);
    res.json(reporte);
  } catch (error: any) {
    if (error?.name === 'ZodError') {
      res.status(400).json({ error: 'Parámetros inválidos', detalles: error.errors });
      return;
    }
    console.error('Error al calcular estado de resultados:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ── GET / — Listar movimientos ─────────────────────────────────────────────────
movimientosRouter.get('/', async (req, res) => {
  try {
    const { tipo, fechaDesde, fechaHasta, propiedadId } = req.query;
    const lista = await movimientosService.listar({
      tipo: tipo as TipoMovimiento | undefined,
      fechaDesde: fechaDesde as string | undefined,
      fechaHasta: fechaHasta as string | undefined,
      propiedadId: propiedadId as string | undefined,
    });
    res.json(lista);
  } catch (error) {
    console.error('Error al listar movimientos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ── GET /:id — Obtener movimiento ──────────────────────────────────────────────
movimientosRouter.get('/:id', async (req, res) => {
  try {
    const mov = await movimientosService.obtenerPorId(req.params.id);
    if (!mov) {
      res.status(404).json({ error: 'Movimiento no encontrado' });
      return;
    }
    res.json(mov);
  } catch (error) {
    console.error('Error al obtener movimiento:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ── POST / — Crear movimiento ──────────────────────────────────────────────────
movimientosRouter.post('/', async (req, res) => {
  try {
    const datos = movimientoEsquema.parse(req.body);
    const mov = await movimientosService.crear(datos);
    res.status(201).json(mov);
  } catch (error: any) {
    if (error?.name === 'ZodError') {
      res.status(400).json({ error: 'Datos inválidos', detalles: error.errors });
      return;
    }
    if (error?.message?.includes('no válida')) {
      res.status(400).json({ error: error.message });
      return;
    }
    console.error('Error al crear movimiento:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ── PATCH /:id — Actualizar movimiento ─────────────────────────────────────────
movimientosRouter.patch('/:id', async (req, res) => {
  try {
    const datos = movimientoActualizarEsquema.parse(req.body);
    const mov = await movimientosService.actualizar(req.params.id, datos);
    if (!mov) {
      res.status(404).json({ error: 'Movimiento no encontrado' });
      return;
    }
    res.json(mov);
  } catch (error: any) {
    if (error?.name === 'ZodError') {
      res.status(400).json({ error: 'Datos inválidos', detalles: error.errors });
      return;
    }
    if (error?.message?.includes('no válida')) {
      res.status(400).json({ error: error.message });
      return;
    }
    console.error('Error al actualizar movimiento:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ── DELETE /:id — Eliminar movimiento ──────────────────────────────────────────
movimientosRouter.delete('/:id', async (req, res) => {
  try {
    const eliminado = await movimientosService.eliminar(req.params.id);
    if (!eliminado) {
      res.status(404).json({ error: 'Movimiento no encontrado' });
      return;
    }
    res.status(204).send();
  } catch (error) {
    console.error('Error al eliminar movimiento:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});
