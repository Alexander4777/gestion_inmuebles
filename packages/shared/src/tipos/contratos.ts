import type { Propiedad, Direccion } from './propiedades';
import type { Inquilino } from './inquilinos';

export type EstatusContrato =
  | 'vigente'
  | 'proximo-a-vencer'
  | 'vencido'
  | 'terminado'
  | 'cancelado';

export type PeriodicidadPago = 'mensual' | 'bimestral' | 'anual';

/**
 * Snapshot con los datos identificativos del ARRENDADOR que se imprimen
 * en el contrato. Es opcional: cuando exista una entidad `arrendadores`
 * en BD, el service de contratos la poblará al armar el PDF. Mientras
 * tanto, los huecos se imprimen como "A completar manualmente".
 */
export interface ArrendadorSnapshot {
  nombreCompleto?: string;
  identificacionOficial?: string;
  estadoCivil?: string;
  nacionalidad?: string;
  ocupacion?: string;
  domicilio?: Direccion;
}

/**
 * Snapshot con los datos identificativos del FIADOR. Hereda los campos
 * del arrendador más `esPropietarioDomicilio` (cláusula que aparece en
 * algunos modelos mexicanos).
 */
export interface FiadorSnapshot extends ArrendadorSnapshot {
  esPropietarioDomicilio?: boolean;
}

export interface Contrato {
  id: string;
  propiedadId: string;
  inquilinoId: string;
  fechaInicio: string;
  fechaFin: string;
  rentaMensual: number;
  deposito: number;
  periodicidadPago: PeriodicidadPago;
  estatus: EstatusContrato;
  activo: boolean;
  creadoEn: string;
  actualizadoEn: string;

  // ── Campos opcionales para el PDF (no requieren migración DB) ────────────
  /** Día del mes en que el arrendatario paga la renta. Default: 1. */
  diaPago?: number;
  /** Porcentaje de incremento anual sobre la renta. Default: 5. */
  incrementoAnualPct?: number;
  /** Porcentaje de interés moratorio mensual. Default: 5. */
  interesMoratorioPct?: number;
  /** Pena convencional por terminación anticipada (en pesos). Default: 1 mes de renta. */
  penaConvencional?: number;
  /** Ciudad/estado donde se firma el contrato. */
  lugarFirma?: string;
  /** Fecha efectiva de firma del contrato (ISO date). */
  fechaFirma?: string;
  /** Snapshot del arrendador. Cuando se implemente el módulo, se pobla automáticamente. */
  arrendadorSnapshot?: ArrendadorSnapshot;
  /** Snapshot del fiador. Cuando se implemente el módulo, se pobla automáticamente. */
  fiadorSnapshot?: FiadorSnapshot;

  // Relaciones (opcionales al cargar)
  propiedad?: Propiedad;
  inquilino?: Inquilino;
}
