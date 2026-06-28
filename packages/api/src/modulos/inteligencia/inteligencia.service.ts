/**
 * Servicio del módulo IA: orquesta el entrenador y expone predicciones a los routers.
 *
 * Responsabilidades:
 * - Convertir resultados del entrenador en tipos compartidos (shared).
 * - Calcular nivelRiesgo a partir de probabilidad y umbral.
 * - Manejar cold start (estado 'sin-datos' / 'no-entrenado') sin inventar predicciones.
 */

import {
  entrenarMorosidad,
  entrenarVacancia,
  entrenarMantenimiento,
  cargarMorosidad,
  cargarVacancia,
  cargarMantenimiento,
  predecirMorosidadRecibo,
  predecirVacanciaContrato,
  predecirCostoMantenimiento,
  featureImportanceMorosidad,
  featureImportanceVacancia,
  featureImportanceMantenimiento,
  contarRecibosFinalizados,
  contarContratosFinalizados,
  contarPropiedades,
} from './ml/entrenador';
import type {
  PrediccionMorosidad,
  PrediccionVacancia,
  PrediccionMantenimiento,
  ModeloInfo,
  MetricasModelo,
  DashboardIA,
  NivelRiesgo,
  EstadoModelo,
} from '@proyecto-modular/shared/tipos/inteligencia';
import { db } from '../../core/db';
import { sql, desc, eq, and } from 'drizzle-orm';
import {
  recibos,
  contratos,
  propiedades,
  contratos as contratosTbl,
  propiedades as propiedadesTbl,
} from '../../core/db/esquema';

// ── Utilidades ────────────────────────────────────────────────────────────────

/**
 * Clasifica probabilidad en nivel de riesgo.
 *
 * Regla:
 * - p >= max(0.7, umbral + 0.2)   → 'alto'  (al menos 0.2 por encima del umbral, o >= 0.7 fijo)
 * - p >= umbral                   → 'medio'
 * - p <  umbral                   → 'bajo'
 *
 * El umbral es la frontera entre bajo/medio. El "alto" requiere que la predicción
 * esté claramente por encima del umbral para evitar falsos positivos (recibos con
 * probabilidad apenas mayor al umbral no deberían disparar alertas críticas).
 */
export function clasificarRiesgo(probabilidad: number, umbral = 0.5): NivelRiesgo {
  const alto = Math.max(0.7, umbral + 0.2);
  if (probabilidad >= alto) return 'alto';
  if (probabilidad >= umbral) return 'medio';
  return 'bajo';
}

function aMetricasModelo(m: any, esClasificacion: boolean): MetricasModelo {
  if (!m) {
    return {
      principal: 0,
      principalNombre: esClasificacion ? 'accuracy' : 'r2',
      detalle: {},
      nEntrenamiento: 0,
      nPrueba: 0,
    };
  }
  if (esClasificacion) {
    return {
      principal: m.accuracy ?? 0,
      principalNombre: 'accuracy',
      detalle: {
        precision: m.precision ?? 0,
        recall: m.recall ?? 0,
        f1: m.f1 ?? 0,
        auc: m.auc ?? 0,
      },
      nEntrenamiento: m.nEntrenamiento ?? 0,
      nPrueba: m.nPrueba ?? 0,
    };
  }
  return {
    principal: m.r2 ?? 0,
    principalNombre: 'r2',
    detalle: {
      rmse: m.rmse ?? 0,
      mae: m.mae ?? 0,
    },
    nEntrenamiento: m.nEntrenamiento ?? 0,
    nPrueba: m.nPrueba ?? 0,
  };
}

// ── Info de modelos ───────────────────────────────────────────────────────────

export async function listarModelosInfo(): Promise<ModeloInfo[]> {
  const [mor, vac, man, nRecibos, nContratos, nPropiedades] = await Promise.all([
    cargarMorosidad(),
    cargarVacancia(),
    cargarMantenimiento(),
    contarRecibosFinalizados(),
    contarContratosFinalizados(),
    contarPropiedades(),
  ]);

  const modelos: ModeloInfo[] = [];

  modelos.push({
    nombre: 'morosidad',
    tipo: 'logistico',
    estado: mor.estado,
    version: mor.modelo?.version ?? null,
    metricas: mor.modelo?.metricas
      ? aMetricasModelo(mor.modelo.metricas, true)
      : null,
    calculadaEn: null,
    muestrasDisponibles: nRecibos,
  });

  modelos.push({
    nombre: 'vacancia',
    tipo: 'logistico',
    estado: vac.estado,
    version: vac.modelo?.version ?? null,
    metricas: vac.modelo?.metricas
      ? aMetricasModelo(vac.modelo.metricas, true)
      : null,
    calculadaEn: null,
    muestrasDisponibles: nContratos,
  });

  modelos.push({
    nombre: 'mantenimiento',
    tipo: 'lineal',
    estado: man.estado,
    version: man.modelo?.version ?? null,
    metricas: man.modelo?.metricas
      ? aMetricasModelo(man.modelo.metricas, false)
      : null,
    calculadaEn: null,
    muestrasDisponibles: nPropiedades,
  });

  return modelos;
}

// ── Entrenamiento ─────────────────────────────────────────────────────────────

export async function entrenar(nombreModelo: 'morosidad' | 'vacancia' | 'mantenimiento') {
  switch (nombreModelo) {
    case 'morosidad':
      return entrenarMorosidad();
    case 'vacancia':
      return entrenarVacancia();
    case 'mantenimiento':
      return entrenarMantenimiento();
  }
}

// ── Predicciones: morosidad (top) ─────────────────────────────────────────────

export async function topMorosidad(
  limite: number,
  umbral: number,
): Promise<PrediccionMorosidad[]> {
  const { modelo, estado } = await cargarMorosidad();

  // Recibos pendientes (no pagados ni cancelados): target de morosidad
  const r = await db.execute<{ id: string }>(sql`
    SELECT id FROM recibos
    WHERE estatus IN ('pendiente', 'vencido')
    ORDER BY fecha_limite_pago ASC
    LIMIT ${limite * 2}
  `);
  const filas = ((r as any).rows ?? r) as Array<{ id: string }>;
  const recibosPendientes = filas.map((f) => f.id).slice(0, limite);

  if (estado !== 'entrenado' || !modelo) {
    return recibosPendientes.map((id) => ({
      reciboId: id,
      probabilidad: 0.5,
      nivelRiesgo: 'sin-datos' as NivelRiesgo,
      estadoModelo: estado,
    }));
  }

  const importancias = await featureImportanceMorosidad(modelo);

  const predicciones: PrediccionMorosidad[] = [];
  for (const id of recibosPendientes) {
    const r = await predecirMorosidadRecibo(id);
    if (r.nivelRiesgo !== 'sin-datos' && r.probabilidad >= umbral) {
      predicciones.push({
        reciboId: id,
        probabilidad: r.probabilidad,
        nivelRiesgo: r.nivelRiesgo,
        featureImportance: importancias,
        estadoModelo: estado,
      });
    }
  }

  return predicciones.sort((a, b) => b.probabilidad - a.probabilidad).slice(0, limite);
}

// ── Predicciones: vacancia (top) ──────────────────────────────────────────────

export async function topVacancia(
  limite: number,
  umbral: number,
): Promise<PrediccionVacancia[]> {
  const { modelo, estado } = await cargarVacancia();

  const r = await db.execute<{ id: string }>(sql`
    SELECT id FROM contratos
    WHERE activo = true AND estatus IN ('vigente', 'proximo-a-vencer')
    ORDER BY fecha_fin ASC
    LIMIT ${limite * 2}
  `);
  const filas = ((r as any).rows ?? r) as Array<{ id: string }>;
  const contratosVigentes = filas.map((f) => f.id).slice(0, limite);

  if (estado !== 'entrenado' || !modelo) {
    return contratosVigentes.map((id) => ({
      contratoId: id,
      probabilidad: 0.5,
      nivelRiesgo: 'sin-datos' as NivelRiesgo,
      estadoModelo: estado,
    }));
  }

  const importancias = await featureImportanceVacancia(modelo);

  const predicciones: PrediccionVacancia[] = [];
  for (const id of contratosVigentes) {
    const v = await predecirVacanciaContrato(id);
    if (v.nivelRiesgo !== 'sin-datos' && v.probabilidad >= umbral) {
      predicciones.push({
        contratoId: id,
        probabilidad: v.probabilidad,
        nivelRiesgo: v.nivelRiesgo,
        featureImportance: importancias,
        estadoModelo: estado,
      });
    }
  }

  return predicciones.sort((a, b) => b.probabilidad - a.probabilidad).slice(0, limite);
}

// ── Predicciones: mantenimiento (top) ─────────────────────────────────────────

export async function topMantenimiento(
  limite: number,
): Promise<PrediccionMantenimiento[]> {
  const { modelo, estado } = await cargarMantenimiento();

  const r = await db.execute<{ id: string }>(sql`
    SELECT id FROM propiedades
    ORDER BY creada_en DESC
    LIMIT ${limite * 2}
  `);
  const filas = ((r as any).rows ?? r) as Array<{ id: string }>;
  const todasPropiedades = filas.map((f) => f.id).slice(0, limite);

  if (estado !== 'entrenado' || !modelo) {
    return todasPropiedades.map((id) => ({
      propiedadId: id,
      valorEstimado: 0,
      estadoModelo: estado,
    }));
  }

  const importancias = await featureImportanceMantenimiento(modelo);

  const predicciones: PrediccionMantenimiento[] = [];
  for (const id of todasPropiedades) {
    const m = await predecirCostoMantenimiento(id);
    predicciones.push({
      propiedadId: id,
      valorEstimado: m.valorEstimado,
      estadoModelo: estado,
      featureImportance: m.disponible ? importancias : undefined,
    });
  }

  return predicciones
    .sort((a, b) => b.valorEstimado - a.valorEstimado)
    .slice(0, limite);
}

// ── Predicción individual ─────────────────────────────────────────────────────

export async function prediccionReciboIndividual(
  reciboId: string,
): Promise<PrediccionMorosidad | null> {
  const { modelo, estado } = await cargarMorosidad();
  const r = await predecirMorosidadRecibo(reciboId);
  const importancias =
    estado === 'entrenado' && modelo ? await featureImportanceMorosidad(modelo) : undefined;
  return {
    reciboId,
    probabilidad: r.probabilidad,
    nivelRiesgo: r.nivelRiesgo,
    featureImportance: importancias,
    estadoModelo: estado,
  };
}

export async function prediccionContratoIndividual(
  contratoId: string,
): Promise<PrediccionVacancia | null> {
  const { modelo, estado } = await cargarVacancia();
  const v = await predecirVacanciaContrato(contratoId);
  const importancias =
    estado === 'entrenado' && modelo ? await featureImportanceVacancia(modelo) : undefined;
  return {
    contratoId,
    probabilidad: v.probabilidad,
    nivelRiesgo: v.nivelRiesgo,
    featureImportance: importancias,
    estadoModelo: estado,
  };
}

export async function prediccionPropiedadIndividual(
  propiedadId: string,
): Promise<PrediccionMantenimiento | null> {
  const { modelo, estado } = await cargarMantenimiento();
  const m = await predecirCostoMantenimiento(propiedadId);
  const importancias =
    estado === 'entrenado' && modelo ? await featureImportanceMantenimiento(modelo) : undefined;
  return {
    propiedadId,
    valorEstimado: m.valorEstimado,
    estadoModelo: estado,
    featureImportance: m.disponible ? importancias : undefined,
  };
}

// ── Dashboard IA ──────────────────────────────────────────────────────────────

export async function obtenerDashboardIA(): Promise<DashboardIA> {
  const [modelos, topMor, topVac, topMant] = await Promise.all([
    listarModelosInfo(),
    topMorosidad(5, 0.5),
    topVacancia(5, 0.5),
    topMantenimiento(5),
  ]);

  // Estado general: peor estado entre los 3 modelos
  const prioridades: Record<EstadoModelo, number> = {
    'sin-datos': 2,
    'no-entrenado': 1,
    entrenado: 0,
  };
  const peor = modelos.reduce(
    (acc, m) => (prioridades[m.estado] > prioridades[acc] ? m.estado : acc),
    'entrenado' as EstadoModelo,
  );

  return {
    estadoGeneral: peor,
    totalRecibosEnRiesgo: topMor.filter((p) => p.nivelRiesgo === 'alto' || p.nivelRiesgo === 'medio').length,
    totalContratosEnRiesgo: topVac.filter((p) => p.nivelRiesgo === 'alto' || p.nivelRiesgo === 'medio').length,
    totalPropiedadesEnMantenimientoAlto: topMant.filter((p) => p.valorEstimado > 0).length,
    topMorosidad: topMor,
    topVacancia: topVac,
    topMantenimiento: topMant,
    modelos,
  };
}

// Para evitar warning de imports no usados
void desc;
void eq;
void and;
void recibos;
void contratos;
void propiedades;
void contratosTbl;
void propiedadesTbl;