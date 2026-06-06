import { RootRoute, Route } from '@tanstack/react-router';
import { AppLayout } from '@/core/layout/AppLayout';
import { DashboardPage } from '@/modulos/dashboard/DashboardPage';
import { RecibosPage } from '@/modulos/recibos/RecibosPage';
import { ReciboCrearPage } from '@/modulos/recibos/ReciboCrearPage';
import { ReciboDetallePage } from '@/modulos/recibos/ReciboDetallePage';

// ── Raíz ───────────────────────────────────────────────────────────────────────
const rootRoute = new RootRoute({
  component: AppLayout,
});

// ── Rutas ──────────────────────────────────────────────────────────────────────
const indexRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/',
  component: DashboardPage,
});

// Placeholders para módulos — se implementarán por fase
const propiedadesRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/propiedades',
  component: () => <div>Propiedades</div>,
});

const inquilinosRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/inquilinos',
  component: () => <div>Inquilinos</div>,
});

const contratosRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/contratos',
  component: () => <div>Contratos</div>,
});

// ── Recibos ────────────────────────────────────────────────────────────────────
const recibosRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/recibos',
  component: RecibosPage,
});

const reciboCrearRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/recibos/crear',
  component: ReciboCrearPage,
});

const reciboDetalleRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/recibos/$id',
  component: ReciboDetallePage,
});

// ── Árbol ──────────────────────────────────────────────────────────────────────
export const routeTree = rootRoute.addChildren([
  indexRoute,
  propiedadesRoute,
  inquilinosRoute,
  contratosRoute,
  recibosRoute,
  reciboCrearRoute,
  reciboDetalleRoute,
]);
