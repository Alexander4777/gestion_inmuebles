import express from 'express';
import cors from 'cors';
import { authRouter } from '../modulos/auth/auth.router';
import { propiedadesRouter } from '../modulos/propiedades/propiedades.router';
import { contratosRouter } from '../modulos/contratos/contratos.router';
import { recibosRouter } from '../modulos/recibos/recibos.router';

export function crearApp() {
  const app = express();

  // Middlewares globales
  app.use(cors());
  app.use(express.json());

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ estado: 'ok', version: '0.0.0' });
  });

  // ── Módulos ──────────────────────────────────────────────────────────────────
  app.use('/api/auth', authRouter);
  app.use('/api/propiedades', propiedadesRouter);
  app.use('/api/contratos', contratosRouter);
  app.use('/api/recibos', recibosRouter);
  // Próximos: app.use('/api/inquilinos', inquilinosRouter);

  return app;
}
