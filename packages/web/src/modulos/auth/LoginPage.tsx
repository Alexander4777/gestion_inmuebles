import { useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';

const API = '/api/auth/login';

export function LoginPage() {
  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem('token')) navigate({ to: '/' });
  }, [navigate]);
  const [form, setForm] = useState({ usuario: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Error de autenticación');
      }

      const { token } = await res.json();
      localStorage.setItem('token', token);
      navigate({ to: '/' });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary/20">
      <div className="w-full max-w-sm">
        <div className="bg-card rounded-2xl border border-border shadow-sm p-8">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold tracking-tight">Proyecto Modular</h1>
            <p className="text-sm text-muted-foreground mt-1">Gestión de Arrendamiento</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1.5">Usuario</label>
              <input
                type="text"
                name="usuario"
                value={form.usuario}
                onChange={handleChange}
                required
                autoComplete="username"
                className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Contraseña</label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                required
                autoComplete="current-password"
                className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {loading ? 'Iniciando sesión…' : 'Iniciar sesión'}
            </button>
          </form>

          <p className="text-xs text-muted-foreground text-center mt-6">
            Desarrollo: <code className="bg-secondary px-1 rounded">admin</code> / <code className="bg-secondary px-1 rounded">admin123</code>
          </p>
        </div>
      </div>
    </div>
  );
}
