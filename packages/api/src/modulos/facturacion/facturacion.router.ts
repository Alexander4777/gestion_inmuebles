import { Router } from 'express';
import { requerirAuth } from '../../core/auth';
import { facturacionService } from './facturacion.service';
import {
  facturaEsquema,
  facturaActualizarEsquema,
  facturaCancelarEsquema,
} from '@proyecto-modular/shared/esquemas/facturacion';
import type { EstatusFactura } from '@proyecto-modular/shared/tipos/facturacion';

export const facturacionRouter = Router();
facturacionRouter.use(requerirAuth);

// ── POST /:id/timbrar — Simular timbrado (debe ir antes de /:id) ───────────────
facturacionRouter.post('/:id/timbrar', async (req, res) => {
  try {
    const factura = await facturacionService.timbrar(req.params.id);
    if (!factura) {
      res.status(404).json({ error: 'Factura no encontrada' });
      return;
    }
    res.json(factura);
  } catch (error: any) {
    if (error?.message?.includes('estatus')) {
      res.status(400).json({ error: error.message });
      return;
    }
    console.error('Error al timbrar factura:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ── POST /:id/cancelar — Cancelar CFDI ──────────────────────────────────────────
facturacionRouter.post('/:id/cancelar', async (req, res) => {
  try {
    const { motivo } = facturaCancelarEsquema.parse(req.body);
    const factura = await facturacionService.cancelar(req.params.id, motivo);
    if (!factura) {
      res.status(404).json({ error: 'Factura no encontrada' });
      return;
    }
    res.json(factura);
  } catch (error: any) {
    if (error?.name === 'ZodError') {
      res.status(400).json({ error: 'Datos inválidos', detalles: error.errors });
      return;
    }
    if (error?.message?.includes('cancelada') || error?.message?.includes('error')) {
      res.status(400).json({ error: error.message });
      return;
    }
    console.error('Error al cancelar factura:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ── GET / — Listar facturas ────────────────────────────────────────────────────
facturacionRouter.get('/', async (req, res) => {
  try {
    const { estatus, reciboId } = req.query;
    const lista = await facturacionService.listar({
      estatus: estatus as EstatusFactura | undefined,
      reciboId: reciboId as string | undefined,
    });
    res.json(lista);
  } catch (error) {
    console.error('Error al listar facturas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ── GET /:id — Obtener factura ──────────────────────────────────────────────────
facturacionRouter.get('/:id', async (req, res) => {
  try {
    const factura = await facturacionService.obtenerPorId(req.params.id);
    if (!factura) {
      res.status(404).json({ error: 'Factura no encontrada' });
      return;
    }
    res.json(factura);
  } catch (error) {
    console.error('Error al obtener factura:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ── POST / — Crear factura ─────────────────────────────────────────────────────
facturacionRouter.post('/', async (req, res) => {
  try {
    const datos = facturaEsquema.parse(req.body);
    const factura = await facturacionService.crear(datos);
    res.status(201).json(factura);
  } catch (error: any) {
    if (error?.name === 'ZodError') {
      res.status(400).json({ error: 'Datos inválidos', detalles: error.errors });
      return;
    }
    if (
      error?.message?.includes('no encontrado') ||
      error?.message?.includes('ya tiene')
    ) {
      res.status(400).json({ error: error.message });
      return;
    }
    console.error('Error al crear factura:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ── PATCH /:id — Actualizar factura (sólo pendiente) ────────────────────────────
facturacionRouter.patch('/:id', async (req, res) => {
  try {
    const datos = facturaActualizarEsquema.parse(req.body);
    const factura = await facturacionService.actualizar(req.params.id, datos);
    if (!factura) {
      res.status(404).json({ error: 'Factura no encontrada' });
      return;
    }
    res.json(factura);
  } catch (error: any) {
    if (error?.name === 'ZodError') {
      res.status(400).json({ error: 'Datos inválidos', detalles: error.errors });
      return;
    }
    if (error?.message?.includes('estatus')) {
      res.status(400).json({ error: error.message });
      return;
    }
    console.error('Error al actualizar factura:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ── DELETE /:id — Eliminar factura (sólo pendiente) ────────────────────────────
facturacionRouter.delete('/:id', async (req, res) => {
  try {
    const eliminado = await facturacionService.eliminar(req.params.id);
    if (!eliminado) {
      res.status(404).json({ error: 'Factura no encontrada' });
      return;
    }
    res.status(204).send();
  } catch (error: any) {
    if (error?.message?.includes('pendiente')) {
      res.status(400).json({ error: error.message });
      return;
    }
    console.error('Error al eliminar factura:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});