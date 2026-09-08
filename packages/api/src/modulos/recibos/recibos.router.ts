import { Router } from 'express';
import { reciboEsquema } from '@proyecto-modular/shared/esquemas/recibos';
import { requerirAuth } from '../../core/auth';
import { recibosService } from './recibos.service';
import { generarPDFRecibo } from './recibos.pdf';

export const recibosRouter = Router();

// Todas las rutas requieren autenticación
recibosRouter.use(requerirAuth);

// ── GET / — Listar recibos ───────────────────────────────────────────────────────
recibosRouter.get('/', async (req, res) => {
  try {
    const { estatus, contratoId } = req.query;
    const lista = await recibosService.listar({
      estatus: estatus as string | undefined,
      contratoId: contratoId as string | undefined,
    });
    res.json(lista);
  } catch (error) {
    console.error('Error al listar recibos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ── GET /:id — Obtener recibo por ID ─────────────────────────────────────────────
recibosRouter.get('/:id', async (req, res) => {
  try {
    const recibo = await recibosService.obtenerPorId(req.params.id);
    if (!recibo) {
      res.status(404).json({ error: 'Recibo no encontrado' });
      return;
    }
    res.json(recibo);
  } catch (error) {
    console.error('Error al obtener recibo:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ── GET /:id/pdf — Descargar recibo en PDF ───────────────────────────────────────
recibosRouter.get('/:id/pdf', async (req, res) => {
  try {
    const recibo = await recibosService.obtenerPorId(req.params.id);
    if (!recibo) {
      res.status(404).json({ error: 'Recibo no encontrado' });
      return;
    }

    const buffer = await generarPDFRecibo(recibo);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="recibo-${recibo.numeroRecibo}.pdf"`,
    );
    res.setHeader('Content-Length', buffer.byteLength.toString());
    res.send(buffer);
  } catch (error) {
    console.error('Error al generar PDF del recibo:', error);
    res.status(500).json({ error: 'Error al generar el PDF' });
  }
});

// ── POST / — Crear recibo ───────────────────────────────────────────────────────
recibosRouter.post('/', async (req, res) => {
  try {
    const datos = reciboEsquema.parse(req.body);
    const recibo = await recibosService.crear(datos);
    res.status(201).json(recibo);
  } catch (error: any) {
    if (error?.name === 'ZodError') {
      res.status(400).json({ error: 'Datos inválidos', detalles: error.errors });
      return;
    }
    console.error('Error al crear recibo:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ── PATCH /:id — Actualizar recibo ───────────────────────────────────────────────
recibosRouter.patch('/:id', async (req, res) => {
  try {
    const recibo = await recibosService.actualizar(req.params.id, req.body);
    if (!recibo) {
      res.status(404).json({ error: 'Recibo no encontrado' });
      return;
    }
    res.json(recibo);
  } catch (error) {
    console.error('Error al actualizar recibo:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ── DELETE /:id — Eliminar recibo ────────────────────────────────────────────────
recibosRouter.delete('/:id', async (req, res) => {
  try {
    const eliminado = await recibosService.eliminar(req.params.id);
    if (!eliminado) {
      res.status(404).json({ error: 'Recibo no encontrado o no se puede eliminar (solo pendientes)' });
      return;
    }
    res.status(204).send();
  } catch (error) {
    console.error('Error al eliminar recibo:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});
