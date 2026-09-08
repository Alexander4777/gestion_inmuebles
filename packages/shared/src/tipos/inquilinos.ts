import type { Direccion } from './propiedades';

/** Datos personales del inquilino */
export interface Inquilino {
  id: string;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  rfc?: string;
  curp?: string;
  telefono: string;
  correo?: string;
  activo: boolean;
  creadoEn: string;
  actualizadoEn: string;

  // ── Campos opcionales para el PDF (no requieren migración DB) ────────────
  /** Tipo y número de identificación oficial (INE, pasaporte, etc.). */
  identificacionOficial?: string;
  /** Estado civil (soltero, casado, etc.). */
  estadoCivil?: string;
  /** Nacionalidad. */
  nacionalidad?: string;
  /** Ocupación o profesión. */
  ocupacion?: string;
  /** Domicilio particular del inquilino (no la propiedad arrendada). */
  domicilio?: Direccion;
}

/** Referencia personal o laboral */
export interface Referencia {
  id: string;
  inquilinoId: string;
  nombre: string;
  parentesco: string;
  telefono: string;
}
