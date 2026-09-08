import { RootRoute, Route } from '@tanstack/react-router';
import { AppLayout } from '@/core/layout/AppLayout';
import { PortalLayout } from '@/core/layout/PortalLayout';
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
import { MantenimientosPage } from '@/modulos/mantenimientos/MantenimientosPage';
import { MantenimientoCrearPage } from '@/modulos/mantenimientos/MantenimientoCrearPage';
import { MantenimientoDetallePage } from '@/modulos/mantenimientos/MantenimientoDetallePage';
import { MovimientosPage } from '@/modulos/contabilidad/MovimientosPage';
import { MovimientoCrearPage } from '@/modulos/contabilidad/MovimientoCrearPage';
import { MovimientoDetallePage } from '@/modulos/contabilidad/MovimientoDetallePage';
import { EstadoResultadosPage } from '@/modulos/contabilidad/EstadoResultadosPage';
import { FacturasPage } from '@/modulos/facturacion/FacturasPage';
import { FacturaCrearPage } from '@/modulos/facturacion/FacturaCrearPage';
import { FacturaDetallePage } from '@/modulos/facturacion/FacturaDetallePage';
import { LoginPage } from '@/modulos/auth/LoginPage';
import { InteligenciaPage } from '@/modulos/inteligencia/InteligenciaPage';
import { MiContratoPage } from '@/modulos/portal/MiContratoPage';

/**
 * Decodifica el payload (sin verificar firma — el server lo hace) del JWT
 * guardado en localStorage. Devuelve null si no hay token o está mal formado.
 */
function leerSesion(): { rol?: string } | null {
  const token = localStorage.getItem('token');
  if (!token) return null;
  const partes = token.split('.');
  if (partes.length !== 3) return null;
  try {
    return JSON.parse(atob(partes[1]!));
  } catch {
    return null;
  }
}

// ── Raíz ───────────────────────────────────────────────────────────────────────
const rootRoute = new RootRoute({
  beforeLoad: () => {
    const path = window.location.pathname;
    // Rutas públicas: login (admin/operador) y login del portal
    if (path === '/login' || path === '/portal/login') return;
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

// ── Mantenimiento ──────────────────────────────────────────────────────────────
const mantenimientosRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/mantenimientos',
  component: MantenimientosPage,
});

const mantenimientoCrearRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/mantenimientos/crear',
  component: MantenimientoCrearPage,
});

const mantenimientoDetalleRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/mantenimientos/$id',
  component: MantenimientoDetallePage,
});

// ── Contabilidad ───────────────────────────────────────────────────────────────
const contabilidadRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/contabilidad',
  component: MovimientosPage,
});

const contabilidadCrearRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/contabilidad/movimientos/crear',
  component: MovimientoCrearPage,
});

const contabilidadDetalleRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/contabilidad/movimientos/$id',
  component: MovimientoDetallePage,
});

const estadoResultadosRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/contabilidad/estado-resultados',
  component: EstadoResultadosPage,
});

// ── Facturación ────────────────────────────────────────────────────────────────
const facturacionRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/facturacion',
  component: FacturasPage,
});

const facturacionCrearRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/facturacion/crear',
  component: FacturaCrearPage,
});

const facturacionDetalleRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/facturacion/$id',
  component: FacturaDetallePage,
});

// ── Inteligencia IA ───────────────────────────────────────────────────────────
const inteligenciaRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/inteligencia',
  component: InteligenciaPage,
});

// ── Portal del Inquilino ──────────────────────────────────────────────────────
//
// Grupo de rutas con su propio layout (sin sidebar admin). El beforeLoad del
// layout rechaza a cualquier usuario cuyo JWT no sea rol='inquilino'.
//
// Login del portal: hijo de rootRoute (NO del portalLayoutRoute) para que sea
// accesible sin estar dentro del layout del portal — igual que /login.

const portalLoginRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/portal/login',
  component: LoginPage,
});

const portalLayoutRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/portal',
  component: PortalLayout,
  beforeLoad: () => {
    const sesion = leerSesion();
    if (sesion?.rol !== 'inquilino') {
      window.location.href = '/login';
    }
  },
});

const miContratoPortalRoute = new Route({
  getParentRoute: () => portalLayoutRoute,
  path: '/mi-contrato',
  component: MiContratoPage,
});

const portalLayoutRouteWithChildren = portalLayoutRoute.addChildren([
  miContratoPortalRoute,
]);

// ── Árbol ──────────────────────────────────────────────────────────────────────
export const routeTree = rootRoute.addChildren([
  loginRoute,
  portalLoginRoute,
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
  mantenimientosRoute,
  mantenimientoCrearRoute,
  mantenimientoDetalleRoute,
  contabilidadRoute,
  contabilidadCrearRoute,
  contabilidadDetalleRoute,
  estadoResultadosRoute,
  facturacionRoute,
  facturacionCrearRoute,
  facturacionDetalleRoute,
  inteligenciaRoute,
  portalLayoutRouteWithChildren,
]);
