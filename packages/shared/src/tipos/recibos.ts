import type { Contrato, ArrendadorSnapshot } from './contratos';
import type { Inquilino } from './inquilinos';
import type { Propiedad } from './propiedades';

export type EstatusRecibo = 'pendiente' | 'pagado' | 'vencido' | 'cancelado';

export interface Recibo {
  id: string;
  contratoId: string;
  numeroRecibo: string;
  periodoInicio: string;
  periodoFin: string;
  fechaLimitePago: string;
  renta: number;
  otrosCobros: number;
  total: number;
  estatus: EstatusRecibo;
  facturaId?: string;
  pagadoEn?: string;
  creadoEn: string;
  actualizadoEn: string;
}

export interface DetalleRecibo extends Recibo {
  // Desglose de otros cobros
  desglose: ConceptoRecibo[];
  // Relaciones (opcionales al cargar)
  contrato?: Contrato;
  inquilino?: Inquilino;
  propiedad?: Propiedad;
  /**
   * Snapshot del arrendador para el PDF del recibo. Si existe, se imprime
   * arriba del TOTAL en la zona derecha (estilo "RECIBÍ DE: <nombre>").
   * Si no, se imprime "A completar manualmente".
   */
  arrendadorSnapshot?: ArrendadorSnapshot;
}

export interface ConceptoRecibo {
  descripcion: string;
  monto: number;
}
