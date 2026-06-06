import { Outlet } from '@tanstack/react-router';
import { BarraLateral } from './BarraLateral';

export function AppLayout() {
  return (
    <div className="flex h-screen">
      <BarraLateral />
      <main className="flex-1 overflow-y-auto p-8">
        <Outlet />
      </main>
    </div>
  );
}
