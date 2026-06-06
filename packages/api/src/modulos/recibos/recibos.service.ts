import { db } from '../../core/db';
import { recibos, contratos, inquilinos, propiedades } from '../../core/db/esquema';
import { eq, and, desc, sql } from 'drizzle-orm';
import type { ReciboEntrada } from '@proyecto-modular/shared/esquemas/recibos';
import type { Recibo, DetalleRecibo } from '@proyecto-modular/shared/tipos/recibos';

// ── DB ↔ Domain mapping ─────────────────────────────────────────────────────────

/**
 * Drizzle devuelve columnas `numeric` como `string`.
 * Convertimos al tipo de dominio `Recibo` (con `number` para montos).
 */
function mapearARecibo(dbRow: typeof recibos.$inferSelect): Recibo {
  return {
    id: dbRow.id,
    contratoId: dbRow.contratoId,
    numeroRecibo: dbRow.numeroRecibo,
    periodoInicio: dbRow.periodoInicio,
    periodoFin: dbRow.periodoFin,
    fechaLimitePago: dbRow.fechaLimitePago,
    renta: Number(dbRow.renta),
    otrosCobros: Number(dbRow.otrosCobros),
    total: Number(dbRow.total),
    estatus: dbRow.estatus as Recibo['estatus'],
    facturaId: dbRow.facturaId ?? undefined,
    pagadoEn: dbRow.pagadoEn?.toISOString() ?? undefined,
    creadoEn: dbRow.creadoEn.toISOString(),
    actualizadoEn: dbRow.actualizadoEn.toISOString(),
  };
}

// ── Helpers ──────────────────────────────────────────────────────────────────────

/** Genera el siguiente número de recibo: REC-YYYYMMDD-XXX */
async function generarNumeroRecibo(): Promise<string> {
  const hoy = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const prefijo = `REC-${hoy}-`;

  const ultimo = await db
    .select({ numeroRecibo: recibos.numeroRecibo })
    .from(recibos)
    .where(sql`${recibos.numeroRecibo} LIKE ${prefijo + '%'}`)
    .orderBy(desc(recibos.numeroRecibo))
    .limit(1);

  const secuencia =
    ultimo.length > 0 ? parseInt(ultimo[0]!.numeroRecibo.slice(-3), 10) + 1 : 1;

  return `${prefijo}${String(secuencia).padStart(3, '0')}`;
}

// ── Servicio ─────────────────────────────────────────────────────────────────────

export const recibosService = {
  /** Lista todos los recibos, opcionalmente filtrados por estatus o contrato */
  async listar(filtros?: { estatus?: string; contratoId?: string }): Promise<Recibo[]> {
    const condiciones: ReturnType<typeof eq>[] = [];

    if (filtros?.estatus) {
      condiciones.push(eq(recibos.estatus, filtros.estatus as Recibo['estatus']));
    }
    if (filtros?.contratoId) {
      condiciones.push(eq(recibos.contratoId, filtros.contratoId));
    }

    const filas = await db
      .select()
      .from(recibos)
      .where(condiciones.length > 0 ? and(...condiciones) : undefined)
      .orderBy(desc(recibos.creadoEn));

    return filas.map(mapearARecibo);
  },

  /** Obtiene un recibo por ID, incluyendo datos del contrato, inquilino y propiedad */
  async obtenerPorId(id: string): Promise<DetalleRecibo | null> {
    const filas = await db
      .select()
      .from(recibos)
      .leftJoin(contratos, eq(recibos.contratoId, contratos.id))
      .leftJoin(inquilinos, eq(contratos.inquilinoId, inquilinos.id))
      .leftJoin(propiedades, eq(contratos.propiedadId, propiedades.id))
      .where(eq(recibos.id, id))
      .limit(1);

    if (filas.length === 0 || !filas[0]) return null;

    const fila = filas[0];
    return {
      ...mapearARecibo(fila.recibos),
      desglose: [],
    };
  },

  /** Crea un nuevo recibo */
  async crear(datos: ReciboEntrada): Promise<Recibo> {
    const numeroRecibo = await generarNumeroRecibo();
    const total = Number(datos.renta) + Number(datos.otrosCobros ?? 0);

    const [fila] = await db
      .insert(recibos)
      .values({
        contratoId: datos.contratoId,
        numeroRecibo,
        periodoInicio: datos.periodoInicio,
        periodoFin: datos.periodoFin,
        fechaLimitePago: datos.fechaLimitePago,
        renta: String(datos.renta),
        otrosCobros: String(datos.otrosCobros ?? 0),
        total: String(total),
        estatus: 'pendiente',
      })
      .returning();

    if (!fila) throw new Error('No se pudo crear el recibo');
    return mapearARecibo(fila);
  },

  /** Actualiza el estatus de un recibo (ej: marcar como pagado) */
  async actualizar(
    id: string,
    datos: Partial<
      Pick<ReciboEntrada, 'fechaLimitePago' | 'renta' | 'otrosCobros'> & {
        estatus?: Recibo['estatus'];
      }
    >,
  ): Promise<Recibo | null> {
    const valores: Record<string, unknown> = {};

    if (datos.estatus) valores.estatus = datos.estatus;
    if (datos.fechaLimitePago) valores.fechaLimitePago = datos.fechaLimitePago;

    if (datos.renta !== undefined) {
      valores.renta = String(datos.renta);
      const actual = await db
        .select({ otrosCobros: recibos.otrosCobros })
        .from(recibos)
        .where(eq(recibos.id, id))
        .limit(1);
      const otros = actual[0] ? Number(actual[0].otrosCobros) : 0;
      valores.total = String(Number(datos.renta) + otros);
    }

    if (datos.otrosCobros !== undefined) {
      valores.otrosCobros = String(datos.otrosCobros);
      const actual = await db
        .select({ renta: recibos.renta })
        .from(recibos)
        .where(eq(recibos.id, id))
        .limit(1);
      const renta = actual[0] ? Number(actual[0].renta) : 0;
      valores.total = String(renta + Number(datos.otrosCobros));
    }

    if (datos.estatus === 'pagado') {
      valores.pagadoEn = new Date();
    }

    const [fila] = await db
      .update(recibos)
      .set(valores)
      .where(eq(recibos.id, id))
      .returning();

    return fila ? mapearARecibo(fila) : null;
  },

  /** Elimina un recibo (solo si está pendiente) */
  async eliminar(id: string): Promise<boolean> {
    const resultado = await db
      .delete(recibos)
      .where(and(eq(recibos.id, id), eq(recibos.estatus, 'pendiente')));

    return (resultado.rowCount ?? 0) > 0;
  },
};
