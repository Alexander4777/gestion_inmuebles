import { Router } from 'express';
import { generarToken } from '../../core/auth';

export const authRouter = Router();

// ── POST /auth/login ────────────────────────────────────────────────────────────
authRouter.post('/login', (req, res) => {
  const { usuario, password } = req.body as { usuario?: string; password?: string };

  // Credenciales de desarrollo (temporal — reemplazar por DB en producción)
  if (usuario === 'admin' && password === 'admin123') {
    const token = generarToken({ sub: 'admin', rol: 'admin' });
    res.json({ token });
    return;
  }

  res.status(401).json({ error: 'Credenciales inválidas' });
});
