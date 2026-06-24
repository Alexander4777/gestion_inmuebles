import express from 'express';
import cors from 'cors';
import { authRouter } from '../modulos/auth/auth.router';
import { propiedadesRouter } from '../modulos/propiedades/propiedades.router';
import { inquilinosRouter } from '../modulos/inquilinos/inquilinos.router';
import { contratosRouter } from '../modulos/contratos/contratos.router';
import { recibosRouter } from '../modulos/recibos/recibos.router';
import { mantenimientosRouter } from '../modulos/mantenimientos/mantenimientos.router';
import { movimientosRouter } from '../modulos/movimientos/movimientos.router';

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
  app.use('/api/inquilinos', inquilinosRouter);
  app.use('/api/contratos', contratosRouter);
  app.use('/api/recibos', recibosRouter);
  app.use('/api/mantenimientos', mantenimientosRouter);
  app.use('/api/movimientos', movimientosRouter);

  return app;
}
