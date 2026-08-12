import { Link, useLocation } from '@tanstack/react-router';
import {
  LayoutDashboard,
  Building2,
  Users,
  FileText,
  Receipt,
  Wrench,
  Calculator,
  FileSpreadsheet,
  Sparkles,
  LogOut,
} from 'lucide-react';
import { cn } from '@/core/ui/cn';

const enlaces = [
  { to: '/', etiqueta: 'Dashboard', icono: LayoutDashboard },
  { to: '/propiedades', etiqueta: 'Propiedades', icono: Building2 },
  { to: '/inquilinos', etiqueta: 'Inquilinos', icono: Users },
  { to: '/contratos', etiqueta: 'Contratos', icono: FileText },
  { to: '/recibos', etiqueta: 'Recibos', icono: Receipt },
  { to: '/mantenimientos', etiqueta: 'Mantenimiento', icono: Wrench },
  { to: '/contabilidad', etiqueta: 'Contabilidad', icono: Calculator },
  { to: '/facturacion', etiqueta: 'Facturación', icono: FileSpreadsheet },
  { to: '/inteligencia', etiqueta: 'Inteligencia IA', icono: Sparkles },
];

export function BarraLateral() {
  const location = useLocation();

  function handleLogout() {
    localStorage.removeItem('token');
    // Forzar recarga completa para que cualquier cache (TanStack Query, etc.)
    // se limpie y el beforeLoad del RootRoute redirija a /login.
    window.location.href = '/login';
  }

  return (
    <aside className="w-64 border-r border-border bg-secondary/30 flex flex-col">
      <div className="p-6 border-b border-border">
        <h1 className="text-lg font-bold tracking-tight">Proyecto Modular</h1>
        <p className="text-xs text-muted-foreground mt-1">Gestión de Arrendamiento</p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {enlaces.map((enlace) => {
          const Icono = enlace.icono;
          const activo = location.pathname === enlace.to;

          return (
            <Link
              key={enlace.to}
              to={enlace.to}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                activo
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
              )}
            >
              <Icono size={18} />
              {enlace.etiqueta}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground truncate">v0.0.0 — Desarrollo</span>
        <button
          type="button"
          onClick={handleLogout}
          aria-label="Cerrar sesión"
          title="Cerrar sesión"
          className={cn(
            'inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-md',
            'text-xs font-medium text-muted-foreground',
            'hover:bg-red-50 hover:text-red-700 transition-colors',
          )}
        >
          <LogOut size={14} />
          Salir
        </button>
      </div>
    </aside>
  );
}
