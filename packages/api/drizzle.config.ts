import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/core/db/esquema.ts',
  out: './migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: "postgresql://postgres:postgres@localhost:5432/proyecto_modular",
  },
});
