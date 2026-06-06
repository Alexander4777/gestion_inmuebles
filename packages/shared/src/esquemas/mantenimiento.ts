import { z } from 'zod';

export const mantenimientoEsquema = z.object({
  propiedadId: z.string().uuid('ID de propiedad inválido'),
  categoria: z.enum([
    'electricidad',
    'fontaneria',
    'carpinteria',
    'albañileria',
    'materiales',
    'otro',
  ]),
  descripcion: z.string().min(1, 'La descripción es requerida'),
  costo: z.number().nonnegative('El costo no puede ser negativo'),
  reportadoPor: z.string().optional(),
});

export type MantenimientoEntrada = z.infer<typeof mantenimientoEsquema>;
