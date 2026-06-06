import { RootRoute, Route } from '@tanstack/react-router';
import { AppLayout } from '@/core/layout/AppLayout';
import { DashboardPage } from '@/modulos/dashboard/DashboardPage';

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

const recibosRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/recibos',
  component: () => <div>Recibos</div>,
});

// ── Árbol ──────────────────────────────────────────────────────────────────────
export const routeTree = rootRoute.addChildren([
  indexRoute,
  propiedadesRoute,
  inquilinosRoute,
  contratosRoute,
  recibosRoute,
]);
