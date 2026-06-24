import { z } from 'zod';

export const facturaEsquema = z.object({
  reciboId: z.string().uuid('ID de recibo inválido'),
  usoCFDI: z.enum(['G03', 'D01', 'D10']),
});

export const facturaActualizarEsquema = z.object({
  usoCFDI: z.enum(['G03', 'D01', 'D10']).optional(),
});

export const facturaCancelarEsquema = z.object({
  motivo: z.string().min(1, 'El motivo es requerido').max(200, 'Máximo 200 caracteres'),
});

export type FacturaEntrada = z.infer<typeof facturaEsquema>;
export type FacturaActualizarEntrada = z.infer<typeof facturaActualizarEsquema>;
export type FacturaCancelarEntrada = z.infer<typeof facturaCancelarEsquema>;
