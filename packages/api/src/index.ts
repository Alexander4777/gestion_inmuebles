import { crearApp } from './core/app';
import { env } from './core/env';

const app = crearApp();

app.listen(env.PORT, () => {
  console.log(`🚀 API iniciada en http://localhost:${env.PORT}`);
  console.log(`   Entorno: ${env.NODE_ENV}`);
  console.log(`   Health:  http://localhost:${env.PORT}/api/health`);
});

export { app };
