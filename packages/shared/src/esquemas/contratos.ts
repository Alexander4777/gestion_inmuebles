import { z } from 'zod';

export const contratoEsquema = z.object({
  propiedadId: z.string().uuid('ID de propiedad inválido'),
  inquilinoId: z.string().uuid('ID de inquilino inválido'),
  fechaInicio: z.string().date('Fecha de inicio inválida'),
  fechaFin: z.string().date('Fecha de fin inválida'),
  rentaMensual: z.number().positive('La renta debe ser mayor a 0'),
  deposito: z.number().min(0, 'El depósito no puede ser negativo'),
  periodicidadPago: z.enum(['mensual', 'bimestral', 'anual']),
  // ── Campos opcionales con defaults (no rompen callers existentes) ──────────
  diaPago: z.number().int().min(1).max(31).default(1),
  incrementoAnualPct: z.number().min(0).max(100).default(5),
  interesMoratorioPct: z.number().min(0).max(100).default(5),
  penaConvencional: z.number().min(0).optional(),
  lugarFirma: z.string().trim().min(1).optional(),
  fechaFirma: z.string().date().optional(),
});

export type ContratoEntrada = z.infer<typeof contratoEsquema>;
