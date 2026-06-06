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
}

/** Referencia personal o laboral */
export interface Referencia {
  id: string;
  inquilinoId: string;
  nombre: string;
  parentesco: string;
  telefono: string;
}
