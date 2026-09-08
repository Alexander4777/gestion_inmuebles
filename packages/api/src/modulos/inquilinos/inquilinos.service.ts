import { db } from '../../core/db';
import { inquilinos } from '../../core/db/esquema';
import { eq, and, desc, or, ilike } from 'drizzle-orm';
import type { InquilinoEntrada } from '@proyecto-modular/shared/esquemas/inquilinos';
import type { Inquilino } from '@proyecto-modular/shared/tipos/inquilinos';

type InquilinoRow = typeof inquilinos.$inferSelect;

// ── Mapeo DB ↔ Dominio ──────────────────────────────────────────────────────────

function mapearInquilino(row: InquilinoRow): Inquilino {
  return {
    id: row.id,
    nombre: row.nombre,
    apellidoPaterno: row.apellidoPaterno,
    apellidoMaterno: row.apellidoMaterno,
    rfc: row.rfc ?? undefined,
    curp: row.curp ?? undefined,
    telefono: row.telefono,
    correo: row.correo ?? undefined,
    activo: row.activo,
    creadoEn: row.creadoEn.toISOString(),
    actualizadoEn: row.actualizadoEn.toISOString(),
  };
}

// ── Servicio ─────────────────────────────────────────────────────────────────────

export const inquilinosService = {
  async listar(filtros?: { activo?: boolean; busqueda?: string }): Promise<Inquilino[]> {
    const condiciones: ReturnType<typeof eq>[] = [];

    if (filtros?.activo !== undefined) {
      condiciones.push(eq(inquilinos.activo, filtros.activo));
    }
    if (filtros?.busqueda) {
      const q = `%${filtros.busqueda}%`;
      const condicion = or(
        ilike(inquilinos.nombre, q),
        ilike(inquilinos.apellidoPaterno, q),
        ilike(inquilinos.apellidoMaterno, q),
        ilike(inquilinos.rfc, q),
      );
      if (condicion) condiciones.push(condicion);
    }

    const filas = await db
      .select()
      .from(inquilinos)
      .where(condiciones.length > 0 ? and(...condiciones) : undefined)
      .orderBy(desc(inquilinos.creadoEn));

    return filas.map(mapearInquilino);
  },

  async obtenerPorId(id: string): Promise<Inquilino | null> {
    const filas = await db
      .select()
      .from(inquilinos)
      .where(eq(inquilinos.id, id))
      .limit(1);

    if (filas.length === 0 || !filas[0]) return null;
    return mapearInquilino(filas[0]);
  },

  async crear(datos: InquilinoEntrada): Promise<Inquilino> {
    const [fila] = await db
      .insert(inquilinos)
      .values({
        nombre: datos.nombre,
        apellidoPaterno: datos.apellidoPaterno,
        apellidoMaterno: datos.apellidoMaterno,
        rfc: datos.rfc || null,
        curp: datos.curp || null,
        telefono: datos.telefono,
        correo: datos.correo || null,
        activo: true,
      })
      .returning();

    if (!fila) throw new Error('No se pudo crear el inquilino');
    return mapearInquilino(fila);
  },

  async actualizar(
    id: string,
    datos: Partial<InquilinoEntrada & { activo: boolean }>,
  ): Promise<Inquilino | null> {
    const valores: Record<string, unknown> = {};

    if (datos.nombre) valores.nombre = datos.nombre;
    if (datos.apellidoPaterno) valores.apellidoPaterno = datos.apellidoPaterno;
    if (datos.apellidoMaterno) valores.apellidoMaterno = datos.apellidoMaterno;
    if (datos.rfc !== undefined) valores.rfc = datos.rfc || null;
    if (datos.curp !== undefined) valores.curp = datos.curp || null;
    if (datos.telefono) valores.telefono = datos.telefono;
    if (datos.correo !== undefined) valores.correo = datos.correo || null;
    if (datos.activo !== undefined) valores.activo = datos.activo;

    const [fila] = await db
      .update(inquilinos)
      .set(valores)
      .where(eq(inquilinos.id, id))
      .returning();

    if (!fila) return null;
    return mapearInquilino(fila);
  },

  async eliminar(id: string): Promise<boolean> {
    // Soft delete — marcar como inactivo
    const resultado = await db
      .update(inquilinos)
      .set({ activo: false })
      .where(eq(inquilinos.id, id));
    return (resultado.rowCount ?? 0) > 0;
  },

  /**
   * Fija (o reemplaza) la contraseña del portal para un inquilino.
   * Hashea con bcrypt (cost 10) y persiste.
   * Retorna `true` si el inquilino existía, `false` si no.
   */
  async establecerPassword(id: string, passwordPlano: string): Promise<boolean> {
    const bcrypt = await import('bcryptjs');
    const hash = await bcrypt.default.hash(passwordPlano, 10);
    const resultado = await db
      .update(inquilinos)
      .set({ passwordHash: hash })
      .where(eq(inquilinos.id, id));
    return (resultado.rowCount ?? 0) > 0;
  },
};
