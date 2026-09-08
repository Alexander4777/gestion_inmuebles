import { Router } from 'express';
import { contratoEsquema } from '@proyecto-modular/shared/esquemas/contratos';
import { z } from 'zod';
import { requerirAuth } from '../../core/auth';
import { contratosService } from './contratos.service';
import { generarPDFContrato } from './contratos.pdf';

export const contratosRouter = Router();
contratosRouter.use(requerirAuth);

// Esquema parcial para PATCH (todos los campos opcionales)
const contratoEsquemaParcial = contratoEsquema.partial().extend({
  estatus: z.enum(['vigente', 'proximo-a-vencer', 'vencido', 'terminado', 'cancelado']).optional(),
  activo: z.boolean().optional(),
});

// ── GET / ─ Listar contratos ─────────────────────────────────────────────────────
contratosRouter.get('/', async (req, res) => {
  try {
    const { estatus, activo } = req.query;
    const lista = await contratosService.listar({
      estatus: estatus as string | undefined,
      activo: activo === undefined ? undefined : activo === 'true',
    });
    res.json(lista);
  } catch (error) {
    console.error('Error al listar contratos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ── GET /:id — Obtener contrato por ID ───────────────────────────────────────────
contratosRouter.get('/:id', async (req, res) => {
  try {
    const contrato = await contratosService.obtenerPorId(req.params.id);
    if (!contrato) {
      res.status(404).json({ error: 'Contrato no encontrado' });
      return;
    }
    res.json(contrato);
  } catch (error) {
    console.error('Error al obtener contrato:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ── GET /:id/pdf — Descargar contrato en PDF ────────────────────────────────────
contratosRouter.get('/:id/pdf', async (req, res) => {
  try {
    const contrato = await contratosService.obtenerPorId(req.params.id);
    if (!contrato) {
      res.status(404).json({ error: 'Contrato no encontrado' });
      return;
    }

    const buffer = await generarPDFContrato(contrato);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="contrato-${contrato.id}.pdf"`,
    );
    res.setHeader('Content-Length', buffer.byteLength.toString());
    res.send(buffer);
  } catch (error) {
    console.error('Error al generar PDF del contrato:', error);
    res.status(500).json({ error: 'Error al generar el PDF' });
  }
});

// ── POST / — Crear contrato ──────────────────────────────────────────────────────
contratosRouter.post('/', async (req, res) => {
  try {
    const datos = contratoEsquema.parse(req.body);
    const contrato = await contratosService.crear(datos);
    res.status(201).json(contrato);
  } catch (error: any) {
    if (error?.name === 'ZodError') {
      res.status(400).json({ error: 'Datos inválidos', detalles: error.errors });
      return;
    }
    console.error('Error al crear contrato:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ── PATCH /:id — Actualizar contrato ─────────────────────────────────────────────
contratosRouter.patch('/:id', async (req, res) => {
  try {
    const datos = contratoEsquemaParcial.parse(req.body);
    const contrato = await contratosService.actualizar(req.params.id, datos);
    if (!contrato) {
      res.status(404).json({ error: 'Contrato no encontrado' });
      return;
    }
    res.json(contrato);
  } catch (error: any) {
    if (error?.name === 'ZodError') {
      res.status(400).json({ error: 'Datos inválidos', detalles: error.errors });
      return;
    }
    console.error('Error al actualizar contrato:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ── DELETE /:id — Desactivar contrato (soft delete) ──────────────────────────────
contratosRouter.delete('/:id', async (req, res) => {
  try {
    const eliminado = await contratosService.eliminar(req.params.id);
    if (!eliminado) {
      res.status(404).json({ error: 'Contrato no encontrado' });
      return;
    }
    res.status(204).send();
  } catch (error) {
    console.error('Error al eliminar contrato:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});
