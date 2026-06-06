import { z } from 'zod';

export const direccionEsquema = z.object({
  calle: z.string().min(1, 'La calle es requerida'),
  numero: z.string().min(1, 'El número es requerido'),
  colonia: z.string().min(1, 'La colonia es requerida'),
  codigoPostal: z.string().length(5, 'El código postal debe tener 5 dígitos'),
  ciudad: z.string().min(1, 'La ciudad es requerida'),
  estado: z.string().min(1, 'El estado es requerido'),
});

export type DireccionEntrada = z.infer<typeof direccionEsquema>;
