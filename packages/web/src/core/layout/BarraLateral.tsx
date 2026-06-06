import { Link, useLocation } from '@tanstack/react-router';
import {
  LayoutDashboard,
  Building2,
  Users,
  FileText,
  Receipt,
  // Se activarán en fases posteriores:
  // Wrench,
  // Calculator,
  // FileSpreadsheet,
} from 'lucide-react';
import { cn } from '@/core/ui/cn';

const enlaces = [
  { to: '/', etiqueta: 'Dashboard', icono: LayoutDashboard },
  { to: '/propiedades', etiqueta: 'Propiedades', icono: Building2 },
  { to: '/inquilinos', etiqueta: 'Inquilinos', icono: Users },
  { to: '/contratos', etiqueta: 'Contratos', icono: FileText },
  { to: '/recibos', etiqueta: 'Recibos', icono: Receipt },
  // Placeholders para siguientes fases
  // { to: '/facturacion', etiqueta: 'Facturación', icono: FileSpreadsheet },
  // { to: '/mantenimiento', etiqueta: 'Mantenimiento', icono: Wrench },
  // { to: '/contabilidad', etiqueta: 'Contabilidad', icono: Calculator },
];

export function BarraLateral() {
  const location = useLocation();

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

      <div className="p-4 border-t border-border text-xs text-muted-foreground">
        v0.0.0 — Desarrollo
      </div>
    </aside>
  );
}
