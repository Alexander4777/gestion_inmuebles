import { z } from 'zod';

export const nombreModeloEsquema = z.enum(['morosidad', 'vacancia', 'mantenimiento']);

export const opcionesEntrenamientoEsquema = z
  .object({
    tazaAprendizaje: z.number().positive().optional(),
    epocas: z.number().int().positive().optional(),
    regularizacionL2: z.number().nonnegative().optional(),
    proporcionValidacion: z.number().min(0.05).max(0.5).optional(),
    semilla: z.number().int().optional(),
  })
  .partial();

export const opcionesEntrenamientoLinealEsquema = z
  .object({
    regularizacionL2: z.number().nonnegative().optional(),
    proporcionValidacion: z.number().min(0.05).max(0.5).optional(),
    semilla: z.number().int().optional(),
  })
  .partial();

export const prediccionesQueryEsquema = z.object({
  limite: z.coerce.number().int().min(1).max(200).optional().default(50),
  umbral: z.coerce.number().min(0).max(1).optional().default(0.5),
});

export type NombreModeloTipo = z.infer<typeof nombreModeloEsquema>;
export type OpcionesEntrenamientoTipo = z.infer<typeof opcionesEntrenamientoEsquema>;
export type OpcionesEntrenamientoLinealTipo = z.infer<typeof opcionesEntrenamientoLinealEsquema>;
export type PrediccionesQueryTipo = z.infer<typeof prediccionesQueryEsquema>;