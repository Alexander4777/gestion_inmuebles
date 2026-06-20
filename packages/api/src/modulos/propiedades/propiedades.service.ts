import { db } from '../../core/db';
import { propiedades } from '../../core/db/esquema';
import { eq, and, desc, ilike } from 'drizzle-orm';
import type { DireccionEntrada } from '@proyecto-modular/shared/esquemas/propiedades';
import type { Propiedad, PropiedadTipo } from '@proyecto-modular/shared/tipos/propiedades';

type PropiedadRow = typeof propiedades.$inferSelect;

// ── Mapeo DB ↔ Dominio ──────────────────────────────────────────────────────────

/** Compone el objeto `direccion` desde las columnas aplanadas en DB. */
function mapearPropiedad(row: PropiedadRow): Propiedad {
  return {
    id: row.id,
    nombre: row.nombre,
    tipo: row.tipo as PropiedadTipo,
    activa: row.activa,
    creadaEn: row.creadaEn.toISOString(),
    actualizadaEn: row.actualizadaEn.toISOString(),
    direccion: {
      calle: row.calle,
      numero: row.numero,
      colonia: row.colonia,
      codigoPostal: row.codigoPostal,
      ciudad: row.ciudad,
      estado: row.estado,
    },
  };
}

// ── Servicio ─────────────────────────────────────────────────────────────────────

export interface PropiedadEntrada extends DireccionEntrada {
  nombre: string;
  tipo: PropiedadTipo;
}

export const propiedadesService = {
  async listar(filtros?: { activa?: boolean; busqueda?: string }): Promise<Propiedad[]> {
    const condiciones: ReturnType<typeof eq>[] = [];

    if (filtros?.activa !== undefined) {
      condiciones.push(eq(propiedades.activa, filtros.activa));
    }
    if (filtros?.busqueda) {
      condiciones.push(ilike(propiedades.nombre, `%${filtros.busqueda}%`));
    }

    const filas = await db
      .select()
      .from(propiedades)
      .where(condiciones.length > 0 ? and(...condiciones) : undefined)
      .orderBy(desc(propiedades.creadaEn));

    return filas.map(mapearPropiedad);
  },

  async obtenerPorId(id: string): Promise<Propiedad | null> {
    const filas = await db
      .select()
      .from(propiedades)
      .where(eq(propiedades.id, id))
      .limit(1);

    if (filas.length === 0 || !filas[0]) return null;
    return mapearPropiedad(filas[0]);
  },

  async crear(datos: PropiedadEntrada): Promise<Propiedad> {
    const [fila] = await db
      .insert(propiedades)
      .values({
        nombre: datos.nombre,
        calle: datos.calle,
        numero: datos.numero,
        colonia: datos.colonia,
        codigoPostal: datos.codigoPostal,
        ciudad: datos.ciudad,
        estado: datos.estado,
        tipo: datos.tipo,
        activa: true,
      })
      .returning();

    if (!fila) throw new Error('No se pudo crear la propiedad');
    return mapearPropiedad(fila);
  },

  async actualizar(
    id: string,
    datos: Partial<PropiedadEntrada & { activa: boolean }>,
  ): Promise<Propiedad | null> {
    const valores: Record<string, unknown> = {};

    if (datos.nombre) valores.nombre = datos.nombre;
    if (datos.calle) valores.calle = datos.calle;
    if (datos.numero) valores.numero = datos.numero;
    if (datos.colonia) valores.colonia = datos.colonia;
    if (datos.codigoPostal) valores.codigoPostal = datos.codigoPostal;
    if (datos.ciudad) valores.ciudad = datos.ciudad;
    if (datos.estado) valores.estado = datos.estado;
    if (datos.tipo) valores.tipo = datos.tipo;
    if (datos.activa !== undefined) valores.activa = datos.activa;

    const [fila] = await db
      .update(propiedades)
      .set(valores)
      .where(eq(propiedades.id, id))
      .returning();

    if (!fila) return null;
    return mapearPropiedad(fila);
  },

  async eliminar(id: string): Promise<boolean> {
    // Soft delete — marcar como inactiva
    const resultado = await db
      .update(propiedades)
      .set({ activa: false })
      .where(eq(propiedades.id, id));
    return (resultado.rowCount ?? 0) > 0;
  },
};
