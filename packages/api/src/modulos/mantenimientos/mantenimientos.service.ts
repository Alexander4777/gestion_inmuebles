import { db } from '../../core/db';
import { mantenimientos, propiedades } from '../../core/db/esquema';
import { eq, and, desc } from 'drizzle-orm';
import type { MantenimientoEntrada } from '@proyecto-modular/shared/esquemas/mantenimiento';
import type {
  SolicitudMantenimiento,
  CategoriaMantenimiento,
  EstatusMantenimiento,
} from '@proyecto-modular/shared/tipos/mantenimiento';

type MantenimientoRow = typeof mantenimientos.$inferSelect;
type PropiedadRow = typeof propiedades.$inferSelect;

// ── Mapeo DB ↔ Dominio ──────────────────────────────────────────────────────────

function mapearMantenimiento(
  row: MantenimientoRow,
  _propiedad?: PropiedadRow | null,
): SolicitudMantenimiento {
  return {
    id: row.id,
    propiedadId: row.propiedadId,
    categoria: row.categoria as CategoriaMantenimiento,
    descripcion: row.descripcion,
    costo: Number(row.costo),
    estatus: row.estatus as EstatusMantenimiento,
    reportadoPor: row.reportadoPor ?? undefined,
    completadoEn: row.completadoEn?.toISOString() ?? undefined,
    creadoEn: row.creadoEn.toISOString(),
    actualizadoEn: row.actualizadoEn.toISOString(),
    // Nota: la propiedad se podría agregar en una versión extendida
  };
}

// ── Servicio ─────────────────────────────────────────────────────────────────────

export const mantenimientosService = {
  async listar(filtros?: {
    estatus?: EstatusMantenimiento;
    categoria?: CategoriaMantenimiento;
    propiedadId?: string;
  }): Promise<SolicitudMantenimiento[]> {
    const condiciones: ReturnType<typeof eq>[] = [];

    if (filtros?.estatus) {
      condiciones.push(eq(mantenimientos.estatus, filtros.estatus));
    }
    if (filtros?.categoria) {
      condiciones.push(eq(mantenimientos.categoria, filtros.categoria));
    }
    if (filtros?.propiedadId) {
      condiciones.push(eq(mantenimientos.propiedadId, filtros.propiedadId));
    }

    const filas = await db
      .select()
      .from(mantenimientos)
      .where(condiciones.length > 0 ? and(...condiciones) : undefined)
      .orderBy(desc(mantenimientos.creadoEn));

    return filas.map((f) => mapearMantenimiento(f));
  },

  async obtenerPorId(id: string): Promise<SolicitudMantenimiento | null> {
    const filas = await db
      .select({ mantenimiento: mantenimientos, propiedad: propiedades })
      .from(mantenimientos)
      .leftJoin(propiedades, eq(mantenimientos.propiedadId, propiedades.id))
      .where(eq(mantenimientos.id, id))
      .limit(1);

    if (filas.length === 0 || !filas[0]) return null;
    return mapearMantenimiento(filas[0].mantenimiento, filas[0].propiedad);
  },

  async crear(datos: MantenimientoEntrada): Promise<SolicitudMantenimiento> {
    const [fila] = await db
      .insert(mantenimientos)
      .values({
        propiedadId: datos.propiedadId,
        categoria: datos.categoria,
        descripcion: datos.descripcion,
        costo: String(datos.costo),
        reportadoPor: datos.reportadoPor || null,
        estatus: 'pendiente',
      })
      .returning();

    if (!fila) throw new Error('No se pudo crear el mantenimiento');
    return mapearMantenimiento(fila);
  },

  async actualizar(
    id: string,
    datos: Partial<MantenimientoEntrada & { estatus: EstatusMantenimiento }>,
  ): Promise<SolicitudMantenimiento | null> {
    const valores: Record<string, unknown> = {};

    if (datos.categoria) valores.categoria = datos.categoria;
    if (datos.descripcion) valores.descripcion = datos.descripcion;
    if (datos.costo !== undefined) valores.costo = String(datos.costo);
    if (datos.reportadoPor !== undefined) valores.reportadoPor = datos.reportadoPor || null;
    if (datos.estatus) valores.estatus = datos.estatus;

    // Si se marca como completado, registrar fecha
    if (datos.estatus) {
      valores.completadoEn = datos.estatus === 'completado' ? new Date() : null;
    }

    const [fila] = await db
      .update(mantenimientos)
      .set(valores)
      .where(eq(mantenimientos.id, id))
      .returning();

    if (!fila) return null;
    return this.obtenerPorId(fila.id);
  },

  async eliminar(id: string): Promise<boolean> {
    const resultado = await db.delete(mantenimientos).where(eq(mantenimientos.id, id));
    return (resultado.rowCount ?? 0) > 0;
  },
};
