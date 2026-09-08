import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import * as path from 'path';
import { authRouter } from '../modulos/auth/auth.router';
import { propiedadesRouter } from '../modulos/propiedades/propiedades.router';
import { inquilinosRouter } from '../modulos/inquilinos/inquilinos.router';
import { contratosRouter } from '../modulos/contratos/contratos.router';
import { recibosRouter } from '../modulos/recibos/recibos.router';
import { mantenimientosRouter } from '../modulos/mantenimientos/mantenimientos.router';
import { movimientosRouter } from '../modulos/movimientos/movimientos.router';
import { facturacionRouter } from '../modulos/facturacion/facturacion.router';
import { inteligenciaRouter } from '../modulos/inteligencia/inteligencia.router';
import { portalRouter } from '../modulos/portal/portal.router';

// Resolución de la ruta absoluta del directorio de uploads en disco.
// Sigue el patrón de modulos/inteligencia/ml/persistencia.ts (ESM no tiene __dirname).
// Este archivo vive en: packages/api/src/core/app.ts
// uploads debe estar en:  packages/api/data/uploads
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const RUTA_UPLOADS = path.resolve(__dirname, '../../data/uploads');

export function crearApp() {
  const app = express();

  // Middlewares globales
  app.use(cors());
  app.use(express.json());

  // Archivos estáticos subidos (fotos de propiedades).
  // Público: las URLs se usan dentro de <img src> en el frontend.
  // IMPORTANTE: montar ANTES de los routers para que no choquen con rutas /api/*.
  app.use('/uploads', express.static(RUTA_UPLOADS));

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
  app.use('/api/facturas', facturacionRouter);
  app.use('/api/ia', inteligenciaRouter);
  app.use('/api/portal', portalRouter);

  return app;
}
