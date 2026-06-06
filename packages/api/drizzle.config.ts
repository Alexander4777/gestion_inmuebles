import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/core/db/esquema.ts',
  out: './migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
