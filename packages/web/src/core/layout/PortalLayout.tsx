import { Outlet } from '@tanstack/react-router';
import { LogOut } from 'lucide-react';

/**
 * Layout del portal de inquilino.
 *
 * A diferencia de AppLayout (admin), este NO muestra la sidebar con todos
 * los módulos — el inquilino solo tiene acceso al portal. Incluye un header
 * mínimo con el nombre del sistema y un botón "Salir".
 */
export function PortalLayout() {
  function handleLogout() {
    localStorage.removeItem('token');
    // Full reload para que el beforeLoad redirija a /login
    window.location.href = '/login';
  }

  return (
    <div className="min-h-screen flex flex-col bg-secondary/20">
      <header className="border-b border-border bg-card">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold tracking-tight">Proyecto Modular</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Portal del Inquilino</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            aria-label="Cerrar sesión"
            title="Cerrar sesión"
            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-muted-foreground hover:bg-red-50 hover:text-red-700 transition-colors"
          >
            <LogOut size={16} />
            Salir
          </button>
        </div>
      </header>

      <main className="flex-1">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}