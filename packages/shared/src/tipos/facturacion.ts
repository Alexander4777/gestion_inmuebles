export type EstatusFactura = 'pendiente' | 'timbrada' | 'cancelada' | 'error';

export type UsoCFDI = 'G03' | 'D01' | 'D10'; // G03=gastos, D01=honorarios, D10=arrendamiento

export interface Factura {
  id: string;
  reciboId: string;
  uuid?: string; // UUID asignado por el SAT
  folioFiscal?: string;
  serie: string;
  folio: string;
  usoCFDI: UsoCFDI;
  estatus: EstatusFactura;
  xmlPath?: string;
  pdfPath?: string;
  timbradoEn?: string;
  canceladoEn?: string;
  creadoEn: string;
  actualizadoEn: string;
}
