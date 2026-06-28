/**
 * Router REST del módulo IA: /api/ia
 *
 * Endpoints:
 * - GET    /morosidad                       — top de recibos pendientes en riesgo
 * - GET    /morosidad/:reciboId             — predicción individual + feature importance
 * - GET    /vacancia                        — top de contratos vigentes en riesgo
 * - GET    /vacancia/:contratoId            — predicción individual
 * - GET    /mantenimiento                   — costo anual esperado por propiedad
 * - GET    /mantenimiento/:propiedadId      — predicción individual
 * - GET    /modelos                         — info de los 3 modelos entrenados
 * - POST   /modelos/:nombre/entrenar        — trigger manual de reentrenamiento
 * - GET    /dashboard                       — resumen agregado para el DashboardPage
 */

import { Router } from 'express';
import { requerirAuth } from '../../core/auth';
import {
  nombreModeloEsquema,
  opcionesEntrenamientoEsquema,
  opcionesEntrenamientoLinealEsquema,
  prediccionesQueryEsquema,
} from '@proyecto-modular/shared/esquemas/inteligencia';
import * as svc from './inteligencia.service';

export const inteligenciaRouter = Router();
inteligenciaRouter.use(requerirAuth);

// ── GET /dashboard ─────────────────────────────────────────────────────────────
inteligenciaRouter.get('/dashboard', async (_req, res) => {
  try {
    const dashboard = await svc.obtenerDashboardIA();
    res.json(dashboard);
  } catch (error) {
    console.error('Error al obtener dashboard IA:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ── GET /modelos ───────────────────────────────────────────────────────────────
inteligenciaRouter.get('/modelos', async (_req, res) => {
  try {
    const modelos = await svc.listarModelosInfo();
    res.json(modelos);
  } catch (error) {
    console.error('Error al listar modelos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ── POST /modelos/:nombre/entrenar ─────────────────────────────────────────────
inteligenciaRouter.post('/modelos/:nombre/entrenar', async (req, res) => {
  try {
    const nombre = nombreModeloEsquema.parse(req.params.nombre);
    const opciones =
      nombre === 'mantenimiento'
        ? opcionesEntrenamientoLinealEsquema.parse(req.body ?? {})
        : opcionesEntrenamientoEsquema.parse(req.body ?? {});

    const resultado = await svc.entrenar(nombre);

    if (resultado.estado === 'sin-datos') {
      res.status(422).json({
        estado: resultado.estado,
        mensaje: resultado.mensaje,
      });
      return;
    }

    // opciones se acepta por la API pero sólo algunas se aplican en el MVP
    void opciones;

    if (resultado.estado === 'no-entrenado') {
      res.status(404).json({ estado: resultado.estado });
      return;
    }

    res.json({
      estado: resultado.estado,
      modelo: resultado.modelo,
      metricas: resultado.metricas,
    });
  } catch (error: any) {
    if (error?.name === 'ZodError') {
      res.status(400).json({ error: 'Datos inválidos', detalles: error.errors });
      return;
    }
    console.error('Error al entrenar modelo:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ── GET /morosidad ─────────────────────────────────────────────────────────────
inteligenciaRouter.get('/morosidad', async (req, res) => {
  try {
    const { limite, umbral } = prediccionesQueryEsquema.parse(req.query);
    const preds = await svc.topMorosidad(limite, umbral);
    res.set('X-IA-Status', preds[0]?.estadoModelo ?? 'no-entrenado');
    res.json(preds);
  } catch (error: any) {
    if (error?.name === 'ZodError') {
      res.status(400).json({ error: 'Query inválida', detalles: error.errors });
      return;
    }
    console.error('Error al predecir morosidad:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ── GET /morosidad/:reciboId ───────────────────────────────────────────────────
inteligenciaRouter.get('/morosidad/:reciboId', async (req, res) => {
  try {
    const pred = await svc.prediccionReciboIndividual(req.params.reciboId);
    if (!pred) {
      res.status(404).json({ error: 'Recibo no encontrado' });
      return;
    }
    res.set('X-IA-Status', pred.estadoModelo);
    res.json(pred);
  } catch (error) {
    console.error('Error al predecir recibo:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ── GET /vacancia ──────────────────────────────────────────────────────────────
inteligenciaRouter.get('/vacancia', async (req, res) => {
  try {
    const { limite, umbral } = prediccionesQueryEsquema.parse(req.query);
    const preds = await svc.topVacancia(limite, umbral);
    res.set('X-IA-Status', preds[0]?.estadoModelo ?? 'no-entrenado');
    res.json(preds);
  } catch (error: any) {
    if (error?.name === 'ZodError') {
      res.status(400).json({ error: 'Query inválida', detalles: error.errors });
      return;
    }
    console.error('Error al predecir vacancia:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ── GET /vacancia/:contratoId ──────────────────────────────────────────────────
inteligenciaRouter.get('/vacancia/:contratoId', async (req, res) => {
  try {
    const pred = await svc.prediccionContratoIndividual(req.params.contratoId);
    if (!pred) {
      res.status(404).json({ error: 'Contrato no encontrado' });
      return;
    }
    res.set('X-IA-Status', pred.estadoModelo);
    res.json(pred);
  } catch (error) {
    console.error('Error al predecir contrato:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ── GET /mantenimiento ─────────────────────────────────────────────────────────
inteligenciaRouter.get('/mantenimiento', async (req, res) => {
  try {
    const { limite } = prediccionesQueryEsquema.parse(req.query);
    const preds = await svc.topMantenimiento(limite);
    res.set('X-IA-Status', preds[0]?.estadoModelo ?? 'no-entrenado');
    res.json(preds);
  } catch (error: any) {
    if (error?.name === 'ZodError') {
      res.status(400).json({ error: 'Query inválida', detalles: error.errors });
      return;
    }
    console.error('Error al predecir mantenimiento:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ── GET /mantenimiento/:propiedadId ────────────────────────────────────────────
inteligenciaRouter.get('/mantenimiento/:propiedadId', async (req, res) => {
  try {
    const pred = await svc.prediccionPropiedadIndividual(req.params.propiedadId);
    if (!pred) {
      res.status(404).json({ error: 'Propiedad no encontrada' });
      return;
    }
    res.set('X-IA-Status', pred.estadoModelo);
    res.json(pred);
  } catch (error) {
    console.error('Error al predecir propiedad:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});