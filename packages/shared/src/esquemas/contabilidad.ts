import { z } from 'zod';

const categoriaIngreso = z.enum(['renta', 'deposito', 'otro-ingreso']);
const categoriaGasto = z.enum([
  'luz',
  'internet',
  'predial',
  'honorarios-administrador',
  'mantenimiento',
  'sat',
  'otro-gasto',
]);

export const movimientoEsquema = z.object({
  tipo: z.enum(['ingreso', 'gasto']),
  categoria: z.union([categoriaIngreso, categoriaGasto]),
  monto: z.number().positive('El monto debe ser mayor a 0'),
  descripcion: z.string().min(1, 'La descripción es requerida'),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida (YYYY-MM-DD)'),
  propiedadId: z.string().uuid('ID de propiedad inválido').optional(),
  contratoId: z.string().uuid('ID de contrato inválido').optional(),
  facturaId: z.string().uuid('ID de factura inválido').optional(),
});

export const movimientoActualizarEsquema = movimientoEsquema.partial();

export const estadoResultadosEsquema = z.object({
  mes: z.coerce.number().int().min(1).max(12),
  año: z.coerce.number().int().min(2000).max(2100),
});

export type MovimientoEntrada = z.infer<typeof movimientoEsquema>;
export type MovimientoActualizarEntrada = z.infer<typeof movimientoActualizarEsquema>;
export type EstadoResultadosQuery = z.infer<typeof estadoResultadosEsquema>;
