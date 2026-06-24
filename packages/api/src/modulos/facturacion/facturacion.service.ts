import { randomUUID } from 'node:crypto';
import { db } from '../../core/db';
import { env } from '../../core/env';
import { facturas, recibos, contratos, inquilinos, propiedades } from '../../core/db/esquema';
import { eq, and, desc, sql } from 'drizzle-orm';
import type { FacturaEntrada, FacturaActualizarEntrada } from '@proyecto-modular/shared/esquemas/facturacion';
import type {
  Factura,
  EstatusFactura,
  UsoCFDI,
} from '@proyecto-modular/shared/tipos/facturacion';

type FacturaRow = typeof facturas.$inferSelect;

// ── Mapeo DB ↔ Dominio ──────────────────────────────────────────────────────────

function mapearFactura(row: FacturaRow): Factura {
  return {
    id: row.id,
    reciboId: row.reciboId,
    uuid: row.uuid ?? undefined,
    folioFiscal: row.folioFiscal ?? undefined,
    serie: row.serie,
    folio: row.folio,
    usoCFDI: row.usoCFDI as UsoCFDI,
    estatus: row.estatus as EstatusFactura,
    xmlPath: row.xmlPath ?? undefined,
    pdfPath: row.pdfPath ?? undefined,
    timbradoEn: row.timbradoEn?.toISOString() ?? undefined,
    canceladoEn: row.canceladoEn?.toISOString() ?? undefined,
    creadoEn: row.creadoEn.toISOString(),
    actualizadoEn: row.actualizadoEn.toISOString(),
  };
}

// ── Generador de serie+folio ────────────────────────────────────────────────────

/**
 * Genera el siguiente folio para la serie "A" (default).
 * Serie+folio se validan como únicos lógicamente; no hay constraint en DB.
 * En producción con Facturapi, el SAT asigna el folio real.
 */
async function generarSerieFolio(): Promise<{ serie: string; folio: string }> {
  const serie = 'A';
  const ultimo = await db
    .select({ maxFolio: sql<string>`MAX(${facturas.folio})` })
    .from(facturas)
    .where(eq(facturas.serie, serie));

  const maxFolio = ultimo[0]?.maxFolio;
  const siguiente = maxFolio ? parseInt(maxFolio, 10) + 1 : 1;
  const folio = String(siguiente).padStart(6, '0');

  return { serie, folio };
}

// ── Servicio ───────────────────────────────────────────────────────────────────

export const facturacionService = {
  async listar(filtros?: { estatus?: EstatusFactura; reciboId?: string }): Promise<Factura[]> {
    const condiciones: ReturnType<typeof eq>[] = [];

    if (filtros?.estatus) {
      condiciones.push(eq(facturas.estatus, filtros.estatus));
    }
    if (filtros?.reciboId) {
      condiciones.push(eq(facturas.reciboId, filtros.reciboId));
    }

    const filas = await db
      .select()
      .from(facturas)
      .where(condiciones.length > 0 ? and(...condiciones) : undefined)
      .orderBy(desc(facturas.creadoEn));

    return filas.map(mapearFactura);
  },

  async obtenerPorId(id: string): Promise<Factura | null> {
    const filas = await db
      .select()
      .from(facturas)
      .leftJoin(recibos, eq(facturas.reciboId, recibos.id))
      .leftJoin(contratos, eq(recibos.contratoId, contratos.id))
      .leftJoin(inquilinos, eq(contratos.inquilinoId, inquilinos.id))
      .leftJoin(propiedades, eq(contratos.propiedadId, propiedades.id))
      .where(eq(facturas.id, id))
      .limit(1);

    return filas[0]?.facturas ? mapearFactura(filas[0].facturas) : null;
  },

  async crear(datos: FacturaEntrada): Promise<Factura> {
    // Validar que el recibo existe
    const recibo = await db
      .select()
      .from(recibos)
      .where(eq(recibos.id, datos.reciboId))
      .limit(1);

    if (recibo.length === 0 || !recibo[0]) {
      throw new Error(`Recibo ${datos.reciboId} no encontrado`);
    }

    // Validar 1:1 (un recibo no puede tener más de una factura)
    if (recibo[0].facturaId) {
      throw new Error(`El recibo ${datos.reciboId} ya tiene una factura asociada`);
    }

    const { serie, folio } = await generarSerieFolio();

    const [fila] = await db
      .insert(facturas)
      .values({
        reciboId: datos.reciboId,
        serie,
        folio,
        usoCFDI: datos.usoCFDI,
        estatus: 'pendiente',
      })
      .returning();

    if (!fila) throw new Error('No se pudo crear la factura');

    // Actualizar recibo.facturaId
    await db.update(recibos).set({ facturaId: fila.id }).where(eq(recibos.id, datos.reciboId));

    return mapearFactura(fila);
  },

  async actualizar(
    id: string,
    datos: FacturaActualizarEntrada,
  ): Promise<Factura | null> {
    const actual = await this.obtenerPorId(id);
    if (!actual) return null;

    // Sólo se puede actualizar una factura pendiente
    if (actual.estatus !== 'pendiente') {
      throw new Error(`No se puede actualizar una factura con estatus "${actual.estatus}"`);
    }

    const valores: Record<string, unknown> = {};
    if (datos.usoCFDI) valores.usoCFDI = datos.usoCFDI;

    const [fila] = await db
      .update(facturas)
      .set(valores)
      .where(eq(facturas.id, id))
      .returning();

    return fila ? mapearFactura(fila) : null;
  },

  /**
   * Simula el timbrado de un CFDI.
   *
   * TODO v2: integrar con Facturapi
   *   if (env.FACTURAPI_KEY) {
   *     const res = await fetch('https://www.facturapi.io/v2/cfdis', {
   *       method: 'POST',
   *       headers: { Authorization: `Bearer ${env.FACTURAPI_KEY}` },
   *       body: JSON.stringify({...}),
   *     });
   *     const data = await res.json();
   *     // data.id = UUID del SAT
   *   }
   */
  async timbrar(id: string): Promise<Factura | null> {
    const actual = await this.obtenerPorId(id);
    if (!actual) return null;
    if (actual.estatus !== 'pendiente') {
      throw new Error(`No se puede timbrar una factura con estatus "${actual.estatus}"`);
    }

    // Generar UUID y folio fiscal (stub — en producción los asigna el SAT)
    const uuid = randomUUID();
    const folioFiscal = uuid.replace(/-/g, '').slice(0, 30).toUpperCase();

    const [fila] = await db
      .update(facturas)
      .set({
        uuid,
        folioFiscal,
        timbradoEn: new Date(),
        estatus: 'timbrada',
      })
      .where(eq(facturas.id, id))
      .returning();

    return fila ? mapearFactura(fila) : null;
  },

  /**
   * Cancela una factura (pendiente o timbrada).
   *
   * TODO v2: notificar al SAT via Facturapi
   *   if (env.FACTURAPI_KEY && actual.estatus === 'timbrada') {
   *     await fetch(`https://www.facturapi.io/v2/cfdis/${actual.uuid}`, {
   *       method: 'DELETE',
   *       headers: { Authorization: `Bearer ${env.FACTURAPI_KEY}` },
   *       body: JSON.stringify({ motivo }),
   *     });
   *   }
   */
  async cancelar(id: string, motivo: string): Promise<Factura | null> {
    const actual = await this.obtenerPorId(id);
    if (!actual) return null;
    if (actual.estatus === 'cancelada') {
      throw new Error('La factura ya está cancelada');
    }
    if (actual.estatus === 'error') {
      throw new Error('No se puede cancelar una factura con error');
    }

    const [fila] = await db
      .update(facturas)
      .set({
        estatus: 'cancelada',
        canceladoEn: new Date(),
      })
      .where(eq(facturas.id, id))
      .returning();

    // Log del motivo (no se persiste en DB en este MVP)
    console.log(`[facturacion] Factura ${id} cancelada. Motivo: ${motivo}`);

    return fila ? mapearFactura(fila) : null;
  },

  async eliminar(id: string): Promise<boolean> {
    const actual = await this.obtenerPorId(id);
    if (!actual) return false;
    if (actual.estatus !== 'pendiente') {
      throw new Error('Sólo se pueden eliminar facturas en estatus pendiente');
    }

    // Limpiar referencia en el recibo
    await db.update(recibos).set({ facturaId: null }).where(eq(recibos.id, actual.reciboId));

    const resultado = await db.delete(facturas).where(eq(facturas.id, id));
    return (resultado.rowCount ?? 0) > 0;
  },
};

// Para que no haya warning de variable no usada
void env;