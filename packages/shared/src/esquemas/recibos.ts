import { z } from 'zod';

export const conceptoReciboEsquema = z.object({
  descripcion: z.string().min(1),
  monto: z.number().nonnegative(),
});

export const reciboEsquema = z.object({
  contratoId: z.string().uuid('ID de contrato inválido'),
  periodoInicio: z.string().date('Fecha de inicio de periodo inválida'),
  periodoFin: z.string().date('Fecha de fin de periodo inválida'),
  fechaLimitePago: z.string().date('Fecha límite de pago inválida'),
  renta: z.number().positive('La renta debe ser mayor a 0'),
  otrosCobros: z.number().nonnegative().default(0),
  desglose: z.array(conceptoReciboEsquema).default([]),
});

export type ReciboEntrada = z.infer<typeof reciboEsquema>;
