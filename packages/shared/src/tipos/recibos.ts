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
}

export interface ConceptoRecibo {
  descripcion: string;
  monto: number;
}
