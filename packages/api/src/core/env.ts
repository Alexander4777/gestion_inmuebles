import 'dotenv/config';
import { z } from 'zod';

const envEsquema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(3001),
  DATABASE_URL: z.string().url('DATABASE_URL debe ser una URL válida'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET debe tener al menos 32 caracteres'),
  FACTURAPI_KEY: z.string().optional(),
});

export const env = envEsquema.parse(process.env);
