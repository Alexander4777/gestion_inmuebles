/**
 * Feature engineering desde la base de datos.
 *
 * Cada función extrae features y etiqueta (label) para un objetivo concreto:
 * - featuresMorosidad: predice si un recibo se va a pagar tarde
 * - featuresVacancia: predice si un contrato va a terminar anticipadamente
 * - featuresMantenimiento: predice el costo anual de mantenimiento por propiedad
 *
 * Las funciones devuelven datasets listos para entrenar:
 * { features: number[][], etiquetas: number[], nombresFeatures: string[] }
 *
 * Los features son valores numéricos brutos (sin normalizar). El entrenamiento se encarga
 * de la normalización interna. Para predicción individual, los features deben pasarse tal cual
 * el modelo fue entrenado (mismo orden, misma escala).
 */

import { db } from '../../../core/db';
import { sql, eq, and, lt, gt, isNotNull } from 'drizzle-orm';
import {
  recibos,
  contratos,
  inquilinos,
  propiedades,
  mantenimientos,
} from '../../../core/db/esquema';

export interface DatasetListo {
  features: number[][];
  etiquetas: number[]; // clasificación: 0/1, regresión: número
  nombresFeatures: string[];
  ids: string[]; // id del objetivo asociado a cada fila
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function diasEntre(fecha1: Date | string, fecha2: Date | string): number {
  const f1 = typeof fecha1 === 'string' ? new Date(fecha1) : fecha1;
  const f2 = typeof fecha2 === 'string' ? new Date(fecha2) : fecha2;
  return Math.floor((f2.getTime() - f1.getTime()) / (1000 * 60 * 60 * 24));
}

// ── MOROSIDAD ─────────────────────────────────────────────────────────────────

const NOMBRES_FEATURES_MOROSIDAD = [
  'monto_recibo',
  'renta_mensual',
  'ratio_monto_renta', // monto / renta mensual (recibos con extras son más impagables)
  'antiguedad_contrato_dias',
  'meses_desde_inicio_contrato',
  'recibos_previos_inquilino',
  'pct_morosidad_historica_inquilino', // 0-1
  'dias_atraso_promedio_inquilino', // promedio histórico de días tarde
  'recibos_vencidos_inquilino', // # total
  'monto_promedio_recibos_inquilino',
  'cambios_direccion_inquilino', // no tenemos, pero podemos dejarlo como 0
] as const;

/**
 * Extrae features para entrenar o predecir morosidad de recibos.
 *
 * Target: 1 si el recibo fue pagado con atraso (>3 días) o está vencido/cancelado,
 *         0 si fue pagado a tiempo (≤3 días).
 *
 * Sólo considera recibos ya finalizados (pagados o cancelados) para entrenamiento.
 */
export async function extraerDatasetMorosidad(): Promise<DatasetListo> {
  // Sub-consultas: por contrato, calcular métricas del inquilino al momento del recibo
  // Estrategia simplificada: traer todos los recibos finalizados con su contrato,
  // y agregar métricas históricas del inquilino.
  const filasRaw = await db.execute<{
    recibo_id: string;
    fecha_limite: string;
    pagado_en: string | null;
    estatus: string;
    total: string;
    renta_mensual: string;
    contrato_id: string;
    fecha_inicio: string;
    inquilino_id: string;
  }>(sql`
    SELECT
      r.id AS recibo_id,
      r.fecha_limite_pago AS fecha_limite,
      r.pagado_en AS pagado_en,
      r.estatus AS estatus,
      r.total AS total,
      c.renta_mensual AS renta_mensual,
      c.id AS contrato_id,
      c.fecha_inicio AS fecha_inicio,
      c.inquilino_id AS inquilino_id
    FROM recibos r
    INNER JOIN contratos c ON r.contrato_id = c.id
    WHERE r.estatus IN ('pagado', 'vencido', 'cancelado')
      AND r.fecha_limite_pago IS NOT NULL
  `);

  const filas = (filasRaw as any).rows ?? filasRaw;

  // Por cada recibo, calcular features del inquilino hasta la fecha del recibo
  const datasets: DatasetListo = {
    features: [],
    etiquetas: [],
    nombresFeatures: [...NOMBRES_FEATURES_MOROSIDAD],
    ids: [],
  };

  for (const fila of filas) {
    const fechaRecibo = new Date(fila.fecha_limite);
    // Métricas históricas del inquilino ANTES de este recibo
    const histRaw = await db.execute<{
      total_recibos: string;
      vencidos: string;
      dias_atraso_acum: string;
      monto_promedio: string;
    }>(sql`
      SELECT
        COUNT(*)::int AS total_recibos,
        COUNT(*) FILTER (WHERE r.estatus IN ('vencido', 'cancelado'))::int AS vencidos,
        COALESCE(SUM(
          GREATEST(0, EXTRACT(DAY FROM (r.pagado_en - r.fecha_limite_pago)))::int
        ), 0)::int AS dias_atraso_acum,
        COALESCE(AVG(r.total), 0)::numeric AS monto_promedio
      FROM recibos r
      INNER JOIN contratos c ON r.contrato_id = c.id
      WHERE c.inquilino_id = ${fila.inquilino_id}
        AND r.fecha_limite_pago < ${fila.fecha_limite}::date
        AND r.estatus IN ('pagado', 'vencido', 'cancelado')
        AND r.pagado_en IS NOT NULL
    `);

    const hist = ((histRaw as any).rows ?? histRaw)[0] as {
      total_recibos: string;
      vencidos: string;
      dias_atraso_acum: string;
      monto_promedio: string;
    };

    const totalRecibosPrev = Number(hist.total_recibos);
    const pctMorosidad =
      totalRecibosPrev > 0 ? Number(hist.vencidos) / totalRecibosPrev : 0;
    const diasAtrasoProm =
      totalRecibosPrev > 0 ? Number(hist.dias_atraso_acum) / totalRecibosPrev : 0;

    const fechaInicio = new Date(fila.fecha_inicio);
    const antiguedadDias = diasEntre(fechaInicio, fechaRecibo);
    const mesesDesdeInicio = Math.max(0, Math.floor(antiguedadDias / 30));

    const total = Number(fila.total);
    const renta = Number(fila.renta_mensual);
    const ratio = renta > 0 ? total / renta : 1;

    const features = [
      total,
      renta,
      ratio,
      antiguedadDias,
      mesesDesdeInicio,
      totalRecibosPrev,
      pctMorosidad,
      diasAtrasoProm,
      Number(hist.vencidos),
      Number(hist.monto_promedio),
      0, // cambios_direccion (placeholder)
    ];

    // Etiqueta: 1 si pagó tarde (>3 días) o está vencido/cancelado, 0 si pagó ≤3 días
    let etiqueta = 0;
    if (fila.estatus === 'vencido' || fila.estatus === 'cancelado') {
      etiqueta = 1;
    } else if (fila.pagado_en) {
      const atraso = diasEntre(fechaRecibo, new Date(fila.pagado_en));
      etiqueta = atraso > 3 ? 1 : 0;
    }

    datasets.features.push(features);
    datasets.etiquetas.push(etiqueta);
    datasets.ids.push(fila.recibo_id);
  }

  return datasets;
}

/**
 * Extrae features de morosidad para UN recibo específico (predicción individual).
 * Devuelve el mismo orden y escala que el dataset de entrenamiento.
 */
export async function featuresMorosidadIndividual(
  reciboId: string,
): Promise<{ features: number[]; nombresFeatures: string[] } | null> {
  const filasRaw = await db.execute<{
    recibo_id: string;
    fecha_limite: string;
    total: string;
    renta_mensual: string;
    contrato_id: string;
    fecha_inicio: string;
    inquilino_id: string;
  }>(sql`
    SELECT
      r.id AS recibo_id,
      r.fecha_limite_pago AS fecha_limite,
      r.total AS total,
      c.renta_mensual AS renta_mensual,
      c.id AS contrato_id,
      c.fecha_inicio AS fecha_inicio,
      c.inquilino_id AS inquilino_id
    FROM recibos r
    INNER JOIN contratos c ON r.contrato_id = c.id
    WHERE r.id = ${reciboId}
  `);
  const fila = ((filasRaw as any).rows ?? filasRaw)[0];
  if (!fila) return null;

  const fechaRecibo = new Date(fila.fecha_limite);

  const histRaw = await db.execute<{
    total_recibos: string;
    vencidos: string;
    dias_atraso_acum: string;
    monto_promedio: string;
  }>(sql`
    SELECT
      COUNT(*)::int AS total_recibos,
      COUNT(*) FILTER (WHERE r.estatus IN ('vencido', 'cancelado'))::int AS vencidos,
      COALESCE(SUM(
        GREATEST(0, EXTRACT(DAY FROM (r.pagado_en - r.fecha_limite_pago)))::int
      ), 0)::int AS dias_atraso_acum,
      COALESCE(AVG(r.total), 0)::numeric AS monto_promedio
    FROM recibos r
    INNER JOIN contratos c ON r.contrato_id = c.id
    WHERE c.inquilino_id = ${fila.inquilino_id}
      AND r.fecha_limite_pago < ${fila.fecha_limite}::date
      AND r.estatus IN ('pagado', 'vencido', 'cancelado')
      AND r.pagado_en IS NOT NULL
  `);
  const hist = ((histRaw as any).rows ?? histRaw)[0] as {
    total_recibos: string;
    vencidos: string;
    dias_atraso_acum: string;
    monto_promedio: string;
  };

  const totalRecibosPrev = Number(hist.total_recibos);
  const pctMorosidad = totalRecibosPrev > 0 ? Number(hist.vencidos) / totalRecibosPrev : 0;
  const diasAtrasoProm = totalRecibosPrev > 0 ? Number(hist.dias_atraso_acum) / totalRecibosPrev : 0;

  const fechaInicio = new Date(fila.fecha_inicio);
  const antiguedadDias = diasEntre(fechaInicio, fechaRecibo);
  const mesesDesdeInicio = Math.max(0, Math.floor(antiguedadDias / 30));

  const total = Number(fila.total);
  const renta = Number(fila.renta_mensual);
  const ratio = renta > 0 ? total / renta : 1;

  return {
    features: [
      total,
      renta,
      ratio,
      antiguedadDias,
      mesesDesdeInicio,
      totalRecibosPrev,
      pctMorosidad,
      diasAtrasoProm,
      Number(hist.vencidos),
      Number(hist.monto_promedio),
      0,
    ],
    nombresFeatures: [...NOMBRES_FEATURES_MOROSIDAD],
  };
}

// ── VACANCIA ──────────────────────────────────────────────────────────────────

const NOMBRES_FEATURES_VACANCIA = [
  'antiguedad_contrato_dias',
  'meses_desde_inicio',
  'duracion_contrato_dias',
  'renta_mensual',
  'renta_vs_promedio', // renta / renta promedio del portafolio
  'deposito',
  'contratos_previos_inquilino', // # contratos previos del mismo inquilino
  'recibos_vencidos_contrato', // # de vencidos en este contrato
  'pct_morosidad_contrato', // 0-1
  'mantenimientos_recientes', // # mantenimientos en últimos 6 meses
  'costo_mantenimiento_total',
] as const;

/**
 * Predice si un contrato va a terminar anticipadamente (no en fechaFin).
 *
 * Etiqueta: 1 si el contrato fue terminado anticipadamente (activo=false con fechaFin futura
 *           al momento de terminarse), 0 si terminó en fechaFin o sigue vigente.
 *
 * Para entrenamiento usamos contratos ya finalizados.
 */
export async function extraerDatasetVacancia(): Promise<DatasetListo> {
  // Contratos finalizados (terminados anticipadamente o completados)
  const filasRaw = await db.execute<{
    contrato_id: string;
    fecha_inicio: string;
    fecha_fin: string;
    activo: boolean;
    actualizado_en: string;
    renta_mensual: string;
    deposito: string;
    inquilino_id: string;
    recibos_vencidos: string;
    total_recibos: string;
  }>(sql`
    SELECT
      c.id AS contrato_id,
      c.fecha_inicio,
      c.fecha_fin,
      c.activo,
      c.actualizado_en,
      c.renta_mensual,
      c.deposito,
      c.inquilino_id,
      COUNT(r.id) FILTER (WHERE r.estatus IN ('vencido', 'cancelado'))::int AS recibos_vencidos,
      COUNT(r.id)::int AS total_recibos
    FROM contratos c
    LEFT JOIN recibos r ON r.contrato_id = c.id
    WHERE c.activo = false OR c.estatus = 'terminado'
    GROUP BY c.id
  `);

  const filas = ((filasRaw as any).rows ?? filasRaw) as Array<{
    contrato_id: string;
    fecha_inicio: string;
    fecha_fin: string;
    activo: boolean;
    actualizado_en: string;
    renta_mensual: string;
    deposito: string;
    inquilino_id: string;
    recibos_vencidos: string;
    total_recibos: string;
  }>;

  // Renta promedio del portafolio
  const rentaPromRaw = await db.execute<{ promedio: string }>(
    sql`SELECT AVG(renta_mensual)::numeric AS promedio FROM contratos`,
  );
  const rentaProm = Number(
    ((rentaPromRaw as any).rows ?? rentaPromRaw)[0]?.promedio ?? 15000,
  );

  const datasets: DatasetListo = {
    features: [],
    etiquetas: [],
    nombresFeatures: [...NOMBRES_FEATURES_VACANCIA],
    ids: [],
  };

  for (const fila of filas) {
    const fechaInicio = new Date(fila.fecha_inicio);
    const fechaFin = new Date(fila.fecha_fin);
    const fechaTermino = new Date(fila.actualizado_en);

    const duracion = diasEntre(fechaInicio, fechaFin);
    const antiguedad = diasEntre(fechaInicio, fechaTermino);
    const meses = Math.max(0, Math.floor(antiguedad / 30));

    const renta = Number(fila.renta_mensual);
    const deposito = Number(fila.deposito);

    // Contratos previos del inquilino
    const prevRaw = await db.execute<{ count: string }>(sql`
      SELECT COUNT(*)::int AS count FROM contratos WHERE inquilino_id = ${fila.inquilino_id} AND id <> ${fila.contrato_id}
    `);
    const contratosPrevios = Number(((prevRaw as any).rows ?? prevRaw)[0]?.count ?? 0);

    // Mantenimientos recientes
    const mantRaw = await db.execute<{ count: string; costo_total: string }>(sql`
      SELECT
        COUNT(*)::int AS count,
        COALESCE(SUM(costo), 0)::numeric AS costo_total
      FROM mantenimientos
      WHERE propiedad_id = (SELECT propiedad_id FROM contratos WHERE id = ${fila.contrato_id})
        AND creado_en > NOW() - INTERVAL '6 months'
    `);
    const mant = ((mantRaw as any).rows ?? mantRaw)[0] as {
      count: string;
      costo_total: string;
    };

    const totalRecibos = Number(fila.total_recibos);
    const recibosVencidos = Number(fila.recibos_vencidos);
    const pctMorosidad = totalRecibos > 0 ? recibosVencidos / totalRecibos : 0;

    const features = [
      antiguedad,
      meses,
      duracion,
      renta,
      rentaProm > 0 ? renta / rentaProm : 1,
      deposito,
      contratosPrevios,
      recibosVencidos,
      pctMorosidad,
      Number(mant.count),
      Number(mant.costo_total),
    ];

    // Etiqueta: 1 si terminó ANTES de fechaFin
    const etiqueta = fechaTermino < fechaFin ? 1 : 0;

    datasets.features.push(features);
    datasets.etiquetas.push(etiqueta);
    datasets.ids.push(fila.contrato_id);
  }

  return datasets;
}

/**
 * Features para un contrato VIGENTE (predicción individual).
 */
export async function featuresVacanciaIndividual(
  contratoId: string,
): Promise<{ features: number[]; nombresFeatures: string[] } | null> {
  const contrato = await db
    .select()
    .from(contratos)
    .where(eq(contratos.id, contratoId))
    .limit(1);
  if (contrato.length === 0 || !contrato[0]) return null;
  const c = contrato[0];

  const fechaInicio = new Date(c.fechaInicio);
  const fechaFin = new Date(c.fechaFin);
  const hoy = new Date();

  const duracion = diasEntre(fechaInicio, fechaFin);
  const antiguedad = diasEntre(fechaInicio, hoy);
  const meses = Math.max(0, Math.floor(antiguedad / 30));

  const renta = Number(c.rentaMensual);
  const deposito = Number(c.deposito);

  const prevRaw = await db.execute<{ count: string }>(sql`
    SELECT COUNT(*)::int AS count FROM contratos WHERE inquilino_id = ${c.inquilinoId} AND id <> ${c.id}
  `);
  const contratosPrevios = Number(((prevRaw as any).rows ?? prevRaw)[0]?.count ?? 0);

  const rentaPromRaw = await db.execute<{ promedio: string }>(
    sql`SELECT AVG(renta_mensual)::numeric AS promedio FROM contratos`,
  );
  const rentaProm = Number(
    ((rentaPromRaw as any).rows ?? rentaPromRaw)[0]?.promedio ?? 15000,
  );

  const mantRaw = await db.execute<{ count: string; costo_total: string }>(sql`
    SELECT
      COUNT(*)::int AS count,
      COALESCE(SUM(costo), 0)::numeric AS costo_total
    FROM mantenimientos
    WHERE propiedad_id = ${c.propiedadId}
      AND creado_en > NOW() - INTERVAL '6 months'
  `);
  const mant = ((mantRaw as any).rows ?? mantRaw)[0] as {
    count: string;
    costo_total: string;
  };

  // Recibos del contrato actual
  const recibosContrato = await db
    .select({ estatus: recibos.estatus })
    .from(recibos)
    .where(eq(recibos.contratoId, c.id));
  const totalRecibos = recibosContrato.length;
  const recibosVencidos = recibosContrato.filter(
    (r) => r.estatus === 'vencido' || r.estatus === 'cancelado',
  ).length;
  const pctMorosidad = totalRecibos > 0 ? recibosVencidos / totalRecibos : 0;

  return {
    features: [
      antiguedad,
      meses,
      duracion,
      renta,
      rentaProm > 0 ? renta / rentaProm : 1,
      deposito,
      contratosPrevios,
      recibosVencidos,
      pctMorosidad,
      Number(mant.count),
      Number(mant.costo_total),
    ],
    nombresFeatures: [...NOMBRES_FEATURES_VACANCIA],
  };
}

// ── MANTENIMIENTO ─────────────────────────────────────────────────────────────

const NOMBRES_FEATURES_MANTENIMIENTO = [
  'edad_propiedad_dias',
  'tipo_propiedad_idx', // 0-4 (casa, depto, local, bodega, otro)
  'mantenimientos_previos_total',
  'mantenimientos_ultimo_anio',
  'costo_promedio_historico',
  'costo_total_historico',
  'categoria_mas_frecuente_idx', // categoría moda (0-5)
  'tasa_resolucion_dias',
  'recibos_cobrados_promedio_mensual', // ingreso mensual promedio
] as const;

/**
 * Predice el costo anual esperado de mantenimiento por propiedad.
 *
 * Etiqueta: suma de costos de mantenimientos en los últimos 12 meses.
 * Features: históricas de la propiedad.
 *
 * Para entrenamiento usamos todas las propiedades (incluyendo las sin mantenimientos, costo=0).
 */
export async function extraerDatasetMantenimiento(): Promise<DatasetListo> {
  // Traer propiedades con sus métricas de mantenimiento
  const filasRaw = await db.execute<{
    propiedad_id: string;
    creada_en: string;
    tipo: string;
    total_mant: string;
    mant_ultimo_anio: string;
    costo_promedio: string;
    costo_total: string;
    categoria_moda: string | null;
    tasa_resolucion_dias: string | null;
    costo_ultimo_anio: string;
  }>(sql`
    SELECT
      p.id AS propiedad_id,
      p.creada_en,
      p.tipo,
      COUNT(m.id)::int AS total_mant,
      COUNT(m.id) FILTER (WHERE m.creado_en > NOW() - INTERVAL '12 months')::int AS mant_ultimo_anio,
      COALESCE(AVG(m.costo), 0)::numeric AS costo_promedio,
      COALESCE(SUM(m.costo), 0)::numeric AS costo_total,
      (
        SELECT m2.categoria
        FROM mantenimientos m2
        WHERE m2.propiedad_id = p.id
        GROUP BY m2.categoria
        ORDER BY COUNT(*) DESC
        LIMIT 1
      ) AS categoria_moda,
      COALESCE(AVG(
        EXTRACT(DAY FROM (m.completado_en - m.creado_en))::int
      ) FILTER (WHERE m.completado_en IS NOT NULL), 0)::numeric AS tasa_resolucion_dias,
      COALESCE(SUM(m.costo) FILTER (WHERE m.creado_en > NOW() - INTERVAL '12 months'), 0)::numeric AS costo_ultimo_anio
    FROM propiedades p
    LEFT JOIN mantenimientos m ON m.propiedad_id = p.id
    GROUP BY p.id
  `);

  const filas = ((filasRaw as any).rows ?? filasRaw) as Array<{
    propiedad_id: string;
    creada_en: string;
    tipo: string;
    total_mant: string;
    mant_ultimo_anio: string;
    costo_promedio: string;
    costo_total: string;
    categoria_moda: string | null;
    tasa_resolucion_dias: string | null;
    costo_ultimo_anio: string;
  }>;

  // Ingreso promedio mensual por propiedad (de movimientos contables)
  const ingresosRaw = await db.execute<{ promedio: string }>(
    sql`SELECT COALESCE(AVG(monto), 0)::numeric AS promedio FROM movimientos_contables WHERE tipo = 'ingreso'`,
  );
  const ingresoPromedio = Number(
    ((ingresosRaw as any).rows ?? ingresosRaw)[0]?.promedio ?? 15000,
  );

  const tipoIdx: Record<string, number> = {
    casa: 0,
    departamento: 1,
    'local-comercial': 2,
    bodega: 3,
    otro: 4,
  };
  const categoriaIdx: Record<string, number> = {
    electricidad: 0,
    fontaneria: 1,
    carpinteria: 2,
    albañileria: 3,
    materiales: 4,
    otro: 5,
  };

  const datasets: DatasetListo = {
    features: [],
    etiquetas: [],
    nombresFeatures: [...NOMBRES_FEATURES_MANTENIMIENTO],
    ids: [],
  };

  for (const fila of filas) {
    const fechaCreada = new Date(fila.creada_en);
    const edadDias = diasEntre(fechaCreada, new Date());

    const features = [
      edadDias,
      tipoIdx[fila.tipo] ?? 4,
      Number(fila.total_mant),
      Number(fila.mant_ultimo_anio),
      Number(fila.costo_promedio),
      Number(fila.costo_total),
      fila.categoria_moda ? (categoriaIdx[fila.categoria_moda] ?? 5) : 5,
      Number(fila.tasa_resolucion_dias ?? 0),
      ingresoPromedio,
    ];

    // Etiqueta: costo total en los últimos 12 meses (lo que queremos predecir)
    datasets.features.push(features);
    datasets.etiquetas.push(Number(fila.costo_ultimo_anio));
    datasets.ids.push(fila.propiedad_id);
  }

  return datasets;
}

/**
 * Features para una propiedad específica (predicción individual).
 */
export async function featuresMantenimientoIndividual(
  propiedadId: string,
): Promise<{ features: number[]; nombresFeatures: string[] } | null> {
  const filasRaw = await db.execute<{
    propiedad_id: string;
    creada_en: string;
    tipo: string;
    total_mant: string;
    mant_ultimo_anio: string;
    costo_promedio: string;
    costo_total: string;
    categoria_moda: string | null;
    tasa_resolucion_dias: string | null;
  }>(sql`
    SELECT
      p.id AS propiedad_id,
      p.creada_en,
      p.tipo,
      COUNT(m.id)::int AS total_mant,
      COUNT(m.id) FILTER (WHERE m.creado_en > NOW() - INTERVAL '12 months')::int AS mant_ultimo_anio,
      COALESCE(AVG(m.costo), 0)::numeric AS costo_promedio,
      COALESCE(SUM(m.costo), 0)::numeric AS costo_total,
      (
        SELECT m2.categoria
        FROM mantenimientos m2
        WHERE m2.propiedad_id = p.id
        GROUP BY m2.categoria
        ORDER BY COUNT(*) DESC
        LIMIT 1
      ) AS categoria_moda,
      COALESCE(AVG(
        EXTRACT(DAY FROM (m.completado_en - m.creado_en))::int
      ) FILTER (WHERE m.completado_en IS NOT NULL), 0)::numeric AS tasa_resolucion_dias
    FROM propiedades p
    LEFT JOIN mantenimientos m ON m.propiedad_id = p.id
    WHERE p.id = ${propiedadId}
    GROUP BY p.id
  `);

  const fila = ((filasRaw as any).rows ?? filasRaw)[0] as
    | (typeof filasRaw extends { rows: infer T } ? T : never)
    | undefined;
  if (!fila) return null;

  const ingresosRaw = await db.execute<{ promedio: string }>(
    sql`SELECT COALESCE(AVG(monto), 0)::numeric AS promedio FROM movimientos_contables WHERE tipo = 'ingreso'`,
  );
  const ingresoPromedio = Number(
    ((ingresosRaw as any).rows ?? ingresosRaw)[0]?.promedio ?? 15000,
  );

  const tipoIdx: Record<string, number> = {
    casa: 0,
    departamento: 1,
    'local-comercial': 2,
    bodega: 3,
    otro: 4,
  };
  const categoriaIdx: Record<string, number> = {
    electricidad: 0,
    fontaneria: 1,
    carpinteria: 2,
    albañileria: 3,
    materiales: 4,
    otro: 5,
  };

  const fechaCreada = new Date((fila as any).creada_en);
  const edadDias = diasEntre(fechaCreada, new Date());

  return {
    features: [
      edadDias,
      tipoIdx[(fila as any).tipo] ?? 4,
      Number((fila as any).total_mant),
      Number((fila as any).mant_ultimo_anio),
      Number((fila as any).costo_promedio),
      Number((fila as any).costo_total),
      (fila as any).categoria_moda
        ? (categoriaIdx[(fila as any).categoria_moda] ?? 5)
        : 5,
      Number((fila as any).tasa_resolucion_dias ?? 0),
      ingresoPromedio,
    ],
    nombresFeatures: [...NOMBRES_FEATURES_MANTENIMIENTO],
  };
}

// ── Wrappers individuales (para el entrenador) ───────────────────────────────

/** Devuelve el vector de features para un recibo, o null si no existe. */
export async function extraerFeaturesRecibo(reciboId: string): Promise<number[] | null> {
  const r = await featuresMorosidadIndividual(reciboId);
  return r?.features ?? null;
}

/** Devuelve el vector de features para un contrato, o null si no existe. */
export async function extraerFeaturesContrato(contratoId: string): Promise<number[] | null> {
  const r = await featuresVacanciaIndividual(contratoId);
  return r?.features ?? null;
}

/** Devuelve el vector de features para una propiedad, o null si no existe. */
export async function extraerFeaturesPropiedad(
  propiedadId: string,
): Promise<number[] | null> {
  const r = await featuresMantenimientoIndividual(propiedadId);
  return r?.features ?? null;
}

// Re-export de tipos para mantener autocompletado
export type NombreFeatureMorosidad = (typeof NOMBRES_FEATURES_MOROSIDAD)[number];
export type NombreFeatureVacancia = (typeof NOMBRES_FEATURES_VACANCIA)[number];
export type NombreFeatureMantenimiento = (typeof NOMBRES_FEATURES_MANTENIMIENTO)[number];

// Para evitar warning de imports no usados
void lt;
void gt;
void isNotNull;
void and;
void eq;
void mantenimientos;
void inquilinos;
void propiedades;
