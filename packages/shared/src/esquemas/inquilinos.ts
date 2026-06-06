import { z } from 'zod';

export const referenciaEsquema = z.object({
  nombre: z.string().min(1),
  parentesco: z.string().min(1),
  telefono: z.string().min(10, 'El teléfono debe tener al menos 10 dígitos'),
});

export const inquilinoEsquema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  apellidoPaterno: z.string().min(1, 'El apellido paterno es requerido'),
  apellidoMaterno: z.string().min(1, 'El apellido materno es requerido'),
  rfc: z
    .string()
    .length(13, 'El RFC debe tener 13 caracteres')
    .regex(/^[A-ZÑ&]{4}\d{6}[A-Z0-9]{3}$/, 'RFC inválido')
    .optional()
    .or(z.literal('')),
  curp: z.string().length(18, 'La CURP debe tener 18 caracteres').optional().or(z.literal('')),
  telefono: z.string().min(10, 'El teléfono debe tener al menos 10 dígitos'),
  correo: z.string().email('Correo inválido').optional().or(z.literal('')),
});

export type InquilinoEntrada = z.infer<typeof inquilinoEsquema>;
