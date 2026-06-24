import { RootRoute, Route } from '@tanstack/react-router';
import { AppLayout } from '@/core/layout/AppLayout';
import { DashboardPage } from '@/modulos/dashboard/DashboardPage';
import { PropiedadesPage } from '@/modulos/propiedades/PropiedadesPage';
import { PropiedadCrearPage } from '@/modulos/propiedades/PropiedadCrearPage';
import { PropiedadDetallePage } from '@/modulos/propiedades/PropiedadDetallePage';
import { InquilinosPage } from '@/modulos/inquilinos/InquilinosPage';
import { InquilinoCrearPage } from '@/modulos/inquilinos/InquilinoCrearPage';
import { InquilinoDetallePage } from '@/modulos/inquilinos/InquilinoDetallePage';
import { RecibosPage } from '@/modulos/recibos/RecibosPage';
import { ReciboCrearPage } from '@/modulos/recibos/ReciboCrearPage';
import { ReciboDetallePage } from '@/modulos/recibos/ReciboDetallePage';
import { ContratosPage } from '@/modulos/contratos/ContratosPage';
import { ContratoCrearPage } from '@/modulos/contratos/ContratoCrearPage';
import { ContratoDetallePage } from '@/modulos/contratos/ContratoDetallePage';
import { LoginPage } from '@/modulos/auth/LoginPage';

// ── Raíz ───────────────────────────────────────────────────────────────────────
const rootRoute = new RootRoute({
  beforeLoad: () => {
    const path = window.location.pathname;
    if (path === '/login') return;
    if (!localStorage.getItem('token')) {
      window.location.href = '/login';
    }
  },
  component: AppLayout,
});

// Login fuera del layout (público)
const loginRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginPage,
});

// ── Rutas protegidas ────────────────────────────────────────────────────────────
const indexRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/',
  component: DashboardPage,
});

// Placeholders para módulos — se implementarán por fase
const propiedadesRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/propiedades',
  component: PropiedadesPage,
});

const propiedadCrearRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/propiedades/crear',
  component: PropiedadCrearPage,
});

const propiedadDetalleRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/propiedades/$id',
  component: PropiedadDetallePage,
});

const inquilinosRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/inquilinos',
  component: InquilinosPage,
});

const inquilinoCrearRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/inquilinos/crear',
  component: InquilinoCrearPage,
});

const inquilinoDetalleRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/inquilinos/$id',
  component: InquilinoDetallePage,
});

const contratosRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/contratos',
  component: ContratosPage,
});

const contratoCrearRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/contratos/crear',
  component: ContratoCrearPage,
});

const contratoDetalleRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/contratos/$id',
  component: ContratoDetallePage,
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
  loginRoute,
  indexRoute,
  propiedadesRoute,
  propiedadCrearRoute,
  propiedadDetalleRoute,
  inquilinosRoute,
  inquilinoCrearRoute,
  inquilinoDetalleRoute,
  contratosRoute,
  contratoCrearRoute,
  contratoDetalleRoute,
  recibosRoute,
  reciboCrearRoute,
  reciboDetalleRoute,
]);
