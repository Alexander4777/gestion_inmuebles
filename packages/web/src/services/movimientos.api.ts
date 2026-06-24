import type {
  MovimientoContable,
  TipoMovimiento,
} from '@proyecto-modular/shared/tipos/contabilidad';
import type { MovimientoEntrada } from '@proyecto-modular/shared/esquemas/contabilidad';
import type { EstadoResultados } from '@proyecto-modular/shared/tipos/contabilidad';

const BASE = '/api/movimientos';

async function fetchJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const token = localStorage.getItem('token');
  const res = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers as Record<string, string> | undefined),
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? 'Error desconocido');
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const movimientosAPI = {
  listar(filtros?: {
    tipo?: TipoMovimiento;
    fechaDesde?: string;
    fechaHasta?: string;
    propiedadId?: string;
  }): Promise<MovimientoContable[]> {
    const params = new URLSearchParams();
    if (filtros?.tipo) params.set('tipo', filtros.tipo);
    if (filtros?.fechaDesde) params.set('fechaDesde', filtros.fechaDesde);
    if (filtros?.fechaHasta) params.set('fechaHasta', filtros.fechaHasta);
    if (filtros?.propiedadId) params.set('propiedadId', filtros.propiedadId);
    const qs = params.toString();
    return fetchJSON(`${BASE}${qs ? `?${qs}` : ''}`);
  },

  obtener(id: string): Promise<MovimientoContable> {
    return fetchJSON(`${BASE}/${id}`);
  },

  crear(datos: MovimientoEntrada): Promise<MovimientoContable> {
    return fetchJSON(BASE, { method: 'POST', body: JSON.stringify(datos) });
  },

  actualizar(id: string, datos: Partial<MovimientoEntrada>): Promise<MovimientoContable> {
    return fetchJSON(`${BASE}/${id}`, { method: 'PATCH', body: JSON.stringify(datos) });
  },

  eliminar(id: string): Promise<void> {
    return fetchJSON(`${BASE}/${id}`, { method: 'DELETE' });
  },

  estadoResultados(mes: number, año: number): Promise<EstadoResultados> {
    const params = new URLSearchParams({ mes: String(mes), año: String(año) });
    return fetchJSON(`${BASE}/estado-resultados?${params}`);
  },
};