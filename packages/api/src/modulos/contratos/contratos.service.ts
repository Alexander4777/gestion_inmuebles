import { db } from '../../core/db';
import { contratos, propiedades, inquilinos } from '../../core/db/esquema';
import { eq, and, desc } from 'drizzle-orm';
import type { ContratoEntrada } from '@proyecto-modular/shared/esquemas/contratos';
import type { Contrato, EstatusContrato } from '@proyecto-modular/shared/tipos/contratos';
import type { Propiedad } from '@proyecto-modular/shared/tipos/propiedades';
import type { Inquilino } from '@proyecto-modular/shared/tipos/inquilinos';

// ── Tipos de filas de la DB ──────────────────────────────────────────────────────

type ContratoRow = typeof contratos.$inferSelect;
type PropiedadRow = typeof propiedades.$inferSelect;
type InquilinoRow = typeof inquilinos.$inferSelect;

// ── Mapeo DB ↔ Dominio ──────────────────────────────────────────────────────────

/** Componer el objeto `direccion` desde columnas aplanadas de la tabla propiedades. */
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
  inquilino?: InquilinoRow | null,
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
    inquilino: inquilino ? mapearInquilino(inquilino) : undefined,
  };
}

// ── Cálculo de estatus por fecha ─────────────────────────────────────────────────

/**
 * Determina el estatus del contrato según fechas (ignora estatus manuales).
 * - Si fechaFin < hoy → vencido
 * - Si fechaFin dentro de 30 días → proximo-a-vencer
 * - En cualquier otro caso → vigente
 */
function calcularEstatusPorFecha(fechaFin: string, estatusActual: EstatusContrato): EstatusContrato {
  if (estatusActual === 'terminado' || estatusActual === 'cancelado') return estatusActual;
  const hoy = new Date();
  const fin = new Date(fechaFin + 'T00:00:00');
  const diffDias = Math.floor((fin.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDias < 0) return 'vencido';
  if (diffDias <= 30) return 'proximo-a-vencer';
  return 'vigente';
}

// ── Servicio ─────────────────────────────────────────────────────────────────────

export const contratosService = {
  async listar(filtros?: { estatus?: string; activo?: boolean }): Promise<Contrato[]> {
    const condiciones: ReturnType<typeof eq>[] = [];

    if (filtros?.estatus) {
      condiciones.push(eq(contratos.estatus, filtros.estatus as EstatusContrato));
    }
    if (filtros?.activo !== undefined) {
      condiciones.push(eq(contratos.activo, filtros.activo));
    }

    const filas = await db
      .select({ contrato: contratos, propiedad: propiedades, inquilino: inquilinos })
      .from(contratos)
      .leftJoin(propiedades, eq(contratos.propiedadId, propiedades.id))
      .leftJoin(inquilinos, eq(contratos.inquilinoId, inquilinos.id))
      .where(condiciones.length > 0 ? and(...condiciones) : undefined)
      .orderBy(desc(contratos.creadoEn));

    return filas.map((f) =>
      mapearContrato(f.contrato, f.propiedad, f.inquilino),
    );
  },

  async obtenerPorId(id: string): Promise<Contrato | null> {
    const filas = await db
      .select({ contrato: contratos, propiedad: propiedades, inquilino: inquilinos })
      .from(contratos)
      .leftJoin(propiedades, eq(contratos.propiedadId, propiedades.id))
      .leftJoin(inquilinos, eq(contratos.inquilinoId, inquilinos.id))
      .where(eq(contratos.id, id))
      .limit(1);

    if (filas.length === 0 || !filas[0]) return null;
    return mapearContrato(filas[0].contrato, filas[0].propiedad, filas[0].inquilino);
  },

  async crear(datos: ContratoEntrada): Promise<Contrato> {
    const estatus = calcularEstatusPorFecha(datos.fechaFin, 'vigente');

    const [fila] = await db
      .insert(contratos)
      .values({
        propiedadId: datos.propiedadId,
        inquilinoId: datos.inquilinoId,
        fechaInicio: datos.fechaInicio,
        fechaFin: datos.fechaFin,
        rentaMensual: String(datos.rentaMensual),
        deposito: String(datos.deposito),
        periodicidadPago: datos.periodicidadPago,
        estatus,
      })
      .returning();

    if (!fila) throw new Error('No se pudo crear el contrato');
    return mapearContrato(fila);
  },

  async actualizar(
    id: string,
    datos: Partial<ContratoEntrada & { estatus: EstatusContrato; activo: boolean }>,
  ): Promise<Contrato | null> {
    const valores: Record<string, unknown> = {};

    if (datos.fechaInicio) valores.fechaInicio = datos.fechaInicio;
    if (datos.fechaFin) valores.fechaFin = datos.fechaFin;
    if (datos.rentaMensual !== undefined) valores.rentaMensual = String(datos.rentaMensual);
    if (datos.deposito !== undefined) valores.deposito = String(datos.deposito);
    if (datos.periodicidadPago) valores.periodicidadPago = datos.periodicidadPago;
    if (datos.propiedadId) valores.propiedadId = datos.propiedadId;
    if (datos.inquilinoId) valores.inquilinoId = datos.inquilinoId;
    if (datos.activo !== undefined) valores.activo = datos.activo;

    // Estatus manual gana sobre el cálculo automático, salvo que se cambie la fechaFin
    if (datos.estatus) {
      valores.estatus = datos.estatus;
    } else if (datos.fechaFin) {
      const actual = await db
        .select({ estatus: contratos.estatus })
        .from(contratos)
        .where(eq(contratos.id, id))
        .limit(1);
      const estatusActual = actual[0]?.estatus as EstatusContrato;
      valores.estatus = calcularEstatusPorFecha(datos.fechaFin, estatusActual);
    }

    const [fila] = await db
      .update(contratos)
      .set(valores)
      .where(eq(contratos.id, id))
      .returning();

    if (!fila) return null;
    return this.obtenerPorId(fila.id);
  },

  async eliminar(id: string): Promise<boolean> {
    // Soft delete — marcar como inactivo en lugar de borrar (preserva histórico)
    const resultado = await db
      .update(contratos)
      .set({ activo: false })
      .where(eq(contratos.id, id));
    return (resultado.rowCount ?? 0) > 0;
  },
};
