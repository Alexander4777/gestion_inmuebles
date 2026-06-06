import { z } from 'zod';

export const contratoEsquema = z.object({
  propiedadId: z.string().uuid('ID de propiedad inválido'),
  inquilinoId: z.string().uuid('ID de inquilino inválido'),
  fechaInicio: z.string().date('Fecha de inicio inválida'),
  fechaFin: z.string().date('Fecha de fin inválida'),
  rentaMensual: z.number().positive('La renta debe ser mayor a 0'),
  deposito: z.number().min(0, 'El depósito no puede ser negativo'),
  periodicidadPago: z.enum(['mensual', 'bimestral', 'anual']),
});

export type ContratoEntrada = z.infer<typeof contratoEsquema>;
