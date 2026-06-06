import express from 'express';
import cors from 'cors';

export function crearApp() {
  const app = express();

  // Middlewares globales
  app.use(cors());
  app.use(express.json());

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ estado: 'ok', version: '0.0.0' });
  });

  // Las rutas de módulos se montarán aquí
  // Ejemplo: app.use('/api/propiedades', propiedadesRouter);

  return app;
}
