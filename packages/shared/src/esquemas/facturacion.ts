import { z } from 'zod';

export const facturaEsquema = z.object({
  reciboId: z.string().uuid('ID de recibo inválido'),
  usoCFDI: z.enum(['G03', 'D01', 'D10']),
});

export type FacturaEntrada = z.infer<typeof facturaEsquema>;
