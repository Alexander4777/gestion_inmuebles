/**
 * Entrenador: orquesta extracción de features → entrenamiento → evaluación → persistencia.
 *
 * Maneja el ciclo de vida completo del entrenamiento:
 * 1. Extrae dataset desde DB
 * 2. Valida que haya suficientes muestras (cold start)
 * 3. Entrena el modelo
 * 4. Calcula métricas en validación
 * 5. Persiste en JSON
 *
 * Si no hay suficientes muestras o no hay varianza, NO entrena y devuelve status 'sin-datos'.
 */

import {
  entrenarLogistico,
  type ModeloLogistico,
  type OpcionesEntrenamiento,
  type MetricasClasificacion,
  predecirLogistico,
} from './logreg';
import {
  entrenarLineal,
  type ModeloLineal,
  type OpcionesLineal,
  type MetricasRegresion,
  predecirLineal,
} from './linear';
import {
  importanciaLogistico,
  importanciaLineal,
  normalizarImportancia,
  type FeatureImportance,
} from './feature-importance';
import {
  extraerDatasetMorosidad,
  extraerDatasetVacancia,
  extraerDatasetMantenimiento,
  type DatasetListo,
} from './features';
import { guardarModelo, cargarModelo, type ModeloEntrenado } from './persistencia';
import { db } from '../../../core/db';
import { sql } from 'drizzle-orm';

export type EstadoModelo = 'entrenado' | 'sin-datos' | 'no-entrenado';

export interface ResultadoEntrenamiento<T extends ModeloEntrenado> {
  estado: EstadoModelo;
  modelo?: T;
  metricas?: T extends ModeloLogistico ? MetricasClasificacion : MetricasRegresion;
  mensaje?: string;
}

// ── Entrenamiento ──────────────────────────────────────────────────────────────

const UMBRAL_MINIMO_MUESTRAS = 30;

export async function entrenarMorosidad(
  opciones: OpcionesEntrenamiento = {},
): Promise<ResultadoEntrenamiento<ModeloLogistico>> {
  const dataset = await extraerDatasetMorosidad();

  if (dataset.features.length < UMBRAL_MINIMO_MUESTRAS) {
    return {
      estado: 'sin-datos',
      mensaje: `Se necesitan al menos ${UMBRAL_MINIMO_MUESTRAS} muestras para entrenar. Hay ${dataset.features.length}.`,
    };
  }

  // Validar varianza: si todos los labels son iguales, no hay nada que predecir
  const etiquetasUnicas = new Set(dataset.etiquetas);
  if (etiquetasUnicas.size < 2) {
    return {
      estado: 'sin-datos',
      mensaje: 'Dataset sin varianza: todos los recibos tienen el mismo estatus de morosidad.',
    };
  }

  const { modelo, metricas } = entrenarLogistico(
    dataset.features,
    dataset.etiquetas,
    dataset.nombresFeatures,
    opciones,
  );

  await guardarModelo('morosidad', modelo);

  return { estado: 'entrenado', modelo, metricas };
}

export async function entrenarVacancia(
  opciones: OpcionesEntrenamiento = {},
): Promise<ResultadoEntrenamiento<ModeloLogistico>> {
  const dataset = await extraerDatasetVacancia();

  if (dataset.features.length < UMBRAL_MINIMO_MUESTRAS) {
    return {
      estado: 'sin-datos',
      mensaje: `Se necesitan al menos ${UMBRAL_MINIMO_MUESTRAS} contratos finalizados para entrenar. Hay ${dataset.features.length}.`,
    };
  }

  const etiquetasUnicas = new Set(dataset.etiquetas);
  if (etiquetasUnicas.size < 2) {
    return {
      estado: 'sin-datos',
      mensaje: 'Dataset sin varianza: todos los contratos terminaron en su fecha de fin.',
    };
  }

  const { modelo, metricas } = entrenarLogistico(
    dataset.features,
    dataset.etiquetas,
    dataset.nombresFeatures,
    opciones,
  );

  await guardarModelo('vacancia', modelo);

  return { estado: 'entrenado', modelo, metricas };
}

export async function entrenarMantenimiento(
  opciones: OpcionesLineal = {},
): Promise<ResultadoEntrenamiento<ModeloLineal>> {
  const dataset = await extraerDatasetMantenimiento();

  if (dataset.features.length < UMBRAL_MINIMO_MUESTRAS) {
    return {
      estado: 'sin-datos',
      mensaje: `Se necesitan al menos ${UMBRAL_MINIMO_MUESTRAS} propiedades para entrenar. Hay ${dataset.features.length}.`,
    };
  }

  const { modelo, metricas } = entrenarLineal(
    dataset.features,
    dataset.etiquetas,
    dataset.nombresFeatures,
    opciones,
  );

  await guardarModelo('mantenimiento', modelo);

  return { estado: 'entrenado', modelo, metricas };
}

// ── Carga de modelos ──────────────────────────────────────────────────────────

export async function cargarMorosidad(): Promise<{
  modelo: ModeloLogistico | null;
  estado: EstadoModelo;
}> {
  const modelo = await cargarModelo('morosidad', 'logistico');
  return {
    modelo: modelo && modelo.tipo === 'logistico' ? modelo : null,
    estado: modelo ? 'entrenado' : 'no-entrenado',
  };
}

export async function cargarVacancia(): Promise<{
  modelo: ModeloLogistico | null;
  estado: EstadoModelo;
}> {
  const modelo = await cargarModelo('vacancia', 'logistico');
  return {
    modelo: modelo && modelo.tipo === 'logistico' ? modelo : null,
    estado: modelo ? 'entrenado' : 'no-entrenado',
  };
}

export async function cargarMantenimiento(): Promise<{
  modelo: ModeloLineal | null;
  estado: EstadoModelo;
}> {
  const modelo = await cargarModelo('mantenimiento', 'lineal');
  return {
    modelo: modelo && modelo.tipo === 'lineal' ? modelo : null,
    estado: modelo ? 'entrenado' : 'no-entrenado',
  };
}

// ── Feature importance ────────────────────────────────────────────────────────

export async function featureImportanceMorosidad(
  modelo: ModeloLogistico,
): Promise<FeatureImportance[]> {
  // Re-extraer dataset para usar como validación
  const dataset = await extraerDatasetMorosidad();
  if (dataset.features.length < 10) return [];

  const nVal = Math.max(10, Math.floor(dataset.features.length * 0.2));
  const XVal = dataset.features.slice(0, nVal);
  const yVal = dataset.etiquetas.slice(0, nVal);

  const importancias = importanciaLogistico(modelo, XVal, yVal);
  return normalizarImportancia(importancias);
}

export async function featureImportanceVacancia(
  modelo: ModeloLogistico,
): Promise<FeatureImportance[]> {
  const dataset = await extraerDatasetVacancia();
  if (dataset.features.length < 10) return [];

  const nVal = Math.max(10, Math.floor(dataset.features.length * 0.2));
  const XVal = dataset.features.slice(0, nVal);
  const yVal = dataset.etiquetas.slice(0, nVal);

  const importancias = importanciaLogistico(modelo, XVal, yVal);
  return normalizarImportancia(importancias);
}

export async function featureImportanceMantenimiento(
  modelo: ModeloLineal,
): Promise<FeatureImportance[]> {
  const dataset = await extraerDatasetMantenimiento();
  if (dataset.features.length < 10) return [];

  const nVal = Math.max(10, Math.floor(dataset.features.length * 0.2));
  const XVal = dataset.features.slice(0, nVal);
  const yVal = dataset.etiquetas.slice(0, nVal);

  const importancias = importanciaLineal(modelo, XVal, yVal);
  return normalizarImportancia(importancias);
}

// ── Predicción individual ─────────────────────────────────────────────────────

export async function predecirMorosidadRecibo(
  reciboId: string,
): Promise<{ probabilidad: number; nivelRiesgo: 'bajo' | 'medio' | 'alto' | 'sin-datos' }> {
  const { modelo, estado } = await cargarMorosidad();
  if (estado !== 'entrenado' || !modelo) {
    return { probabilidad: 0.5, nivelRiesgo: 'sin-datos' };
  }

  // Extraer features del recibo
  const { extraerFeaturesRecibo } = await import('./features');
  const features = await extraerFeaturesRecibo(reciboId);
  if (!features) return { probabilidad: 0.5, nivelRiesgo: 'sin-datos' };

  const p = predecirLogistico(modelo, features);
  return {
    probabilidad: p,
    nivelRiesgo: p >= 0.7 ? 'alto' : p >= 0.4 ? 'medio' : 'bajo',
  };
}

export async function predecirVacanciaContrato(
  contratoId: string,
): Promise<{ probabilidad: number; nivelRiesgo: 'bajo' | 'medio' | 'alto' | 'sin-datos' }> {
  const { modelo, estado } = await cargarVacancia();
  if (estado !== 'entrenado' || !modelo) {
    return { probabilidad: 0.5, nivelRiesgo: 'sin-datos' };
  }

  const { extraerFeaturesContrato } = await import('./features');
  const features = await extraerFeaturesContrato(contratoId);
  if (!features) return { probabilidad: 0.5, nivelRiesgo: 'sin-datos' };

  const p = predecirLogistico(modelo, features);
  return {
    probabilidad: p,
    nivelRiesgo: p >= 0.7 ? 'alto' : p >= 0.4 ? 'medio' : 'bajo',
  };
}

export async function predecirCostoMantenimiento(
  propiedadId: string,
): Promise<{ valorEstimado: number; disponible: boolean }> {
  const { modelo, estado } = await cargarMantenimiento();
  if (estado !== 'entrenado' || !modelo) {
    return { valorEstimado: 0, disponible: false };
  }

  const { extraerFeaturesPropiedad } = await import('./features');
  const features = await extraerFeaturesPropiedad(propiedadId);
  if (!features) return { valorEstimado: 0, disponible: false };

  const valor = Math.max(0, predecirLineal(modelo, features));
  return { valorEstimado: valor, disponible: true };
}

// ── Conteos (para cold start checks en endpoints) ─────────────────────────────

export async function contarRecibosFinalizados(): Promise<number> {
  const r = await db.execute<{ c: string }>(
    sql`SELECT COUNT(*)::int AS c FROM recibos WHERE estatus IN ('pagado', 'vencido', 'cancelado')`,
  );
  const filas = (r as any).rows ?? r;
  return Number(filas[0]?.c ?? 0);
}

export async function contarContratosFinalizados(): Promise<number> {
  const r = await db.execute<{ c: string }>(
    sql`SELECT COUNT(*)::int AS c FROM contratos WHERE activo = false OR estatus = 'terminado'`,
  );
  const filas = (r as any).rows ?? r;
  return Number(filas[0]?.c ?? 0);
}

export async function contarPropiedades(): Promise<number> {
  const r = await db.execute<{ c: string }>(sql`SELECT COUNT(*)::int AS c FROM propiedades`);
  const filas = (r as any).rows ?? r;
  return Number(filas[0]?.c ?? 0);
}

export { DatasetListo };