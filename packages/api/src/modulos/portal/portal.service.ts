/**
 * Portal service: lógica de consulta para inquilinos autenticados.
 *
 * "Contrato vigente" = el contrato activo (activo=true) más reciente del
 * inquilino, cuyo estatus NO está en ('terminado', 'cancelado').
 *
 * Mantenemos `mapearContrato` y `mapearPropiedad` aquí en vez de importar
 * desde contratos.service para no acoplar el módulo portal al de contratos.
 * Si la forma de Contrato cambia, hay que tocar ambos — el costo de duplicar
 * ~25 líneas es menor que el de importar entre módulos de dominio.
 */

import { db } from '../../core/db';
import { contratos, propiedades, inquilinos } from '../../core/db/esquema';
import { and, eq, ne, desc } from 'drizzle-orm';
import type { Contrato } from '@proyecto-modular/shared/tipos/contratos';
import type { EstatusContrato } from '@proyecto-modular/shared/tipos/contratos';
import type { Propiedad } from '@proyecto-modular/shared/tipos/propiedades';
import type { Inquilino } from '@proyecto-modular/shared/tipos/inquilinos';

type ContratoRow = typeof contratos.$inferSelect;
type PropiedadRow = typeof propiedades.$inferSelect;
type InquilinoRow = typeof inquilinos.$inferSelect;

// ── Mapeos (duplicados de contratos.service — ver comentario de arriba) ────────

function mapearPropiedad(row: PropiedadRow): Propiedad {
  return {
    id: row.id,
    nombre: row.nombre,
    tipo: row.tipo as Propiedad['tipo'],
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

function mapearContrato(
  row: ContratoRow,
  propiedad?: PropiedadRow | null,
): Contrato {
  return {
    id: row.id,
    propiedadId: row.propiedadId,
    inquilinoId: row.inquilinoId,
    fechaInicio: row.fechaInicio,
    fechaFin: row.fechaFin,
    rentaMensual: Number(row.rentaMensual),
    deposito: Number(row.deposito),
    periodicidadPago: row.periodicidadPago as Contrato['periodicidadPago'],
    estatus: row.estatus as EstatusContrato,
    activo: row.activo,
    creadoEn: row.creadoEn.toISOString(),
    actualizadoEn: row.actualizadoEn.toISOString(),
    propiedad: propiedad ? mapearPropiedad(propiedad) : undefined,
  };
}

// ── Servicio ───────────────────────────────────────────────────────────────────

export interface ContratoPortal extends Contrato {
  inquilino?: Inquilino; // el inquilino autenticado, para el saludo
}

export const portalService = {
  /**
   * Devuelve el contrato vigente más reciente del inquilino (con la propiedad
   * embebida y los datos del propio inquilino). Si no tiene ninguno, retorna null.
   */
  async obtenerContratoVigente(inquilinoId: string): Promise<ContratoPortal | null> {
    const filas = await db
      .select({ contrato: contratos, propiedad: propiedades, inquilino: inquilinos })
      .from(contratos)
      .leftJoin(propiedades, eq(contratos.propiedadId, propiedades.id))
      .leftJoin(inquilinos, eq(contratos.inquilinoId, inquilinos.id))
      .where(
        and(
          eq(contratos.inquilinoId, inquilinoId),
          eq(contratos.activo, true),
          ne(contratos.estatus, 'terminado'),
          ne(contratos.estatus, 'cancelado'),
        ),
      )
      .orderBy(desc(contratos.fechaInicio))
      .limit(1);

    if (filas.length === 0 || !filas[0]) return null;
    const f = filas[0];
    return {
      ...mapearContrato(f.contrato, f.propiedad),
      inquilino: f.inquilino ? mapearInquilino(f.inquilino) : undefined,
    };
  },

  /**
   * Datos básicos del inquilino autenticado (para saludo en el header del portal).
   */
  async obtenerInquilino(inquilinoId: string): Promise<Inquilino | null> {
    const filas = await db
      .select()
      .from(inquilinos)
      .where(eq(inquilinos.id, inquilinoId))
      .limit(1);
    if (filas.length === 0 || !filas[0]) return null;
    return mapearInquilino(filas[0]);
  },
};