import express from 'express';
import cors from 'cors';
import { authRouter } from '../modulos/auth/auth.router';
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
  app.use('/api/recibos', recibosRouter);
  // Próximos: app.use('/api/propiedades', propiedadesRouter);
  // Próximos: app.use('/api/inquilinos', inquilinosRouter);
  // Próximos: app.use('/api/contratos', contratosRouter);

  return app;
}
