import type { Propiedad } from './propiedades';
import type { Inquilino } from './inquilinos';

export type EstatusContrato =
  | 'vigente'
  | 'proximo-a-vencer'
  | 'vencido'
  | 'terminado'
  | 'cancelado';

export type PeriodicidadPago = 'mensual' | 'bimestral' | 'anual';

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

  // Relaciones (opcionales al cargar)
  propiedad?: Propiedad;
  inquilino?: Inquilino;
}
