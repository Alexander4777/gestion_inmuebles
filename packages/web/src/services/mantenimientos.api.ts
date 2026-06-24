import type {
  SolicitudMantenimiento,
  CategoriaMantenimiento,
  EstatusMantenimiento,
} from '@proyecto-modular/shared/tipos/mantenimiento';
import type { MantenimientoEntrada } from '@proyecto-modular/shared/esquemas/mantenimiento';

const BASE = '/api/mantenimientos';

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

export const mantenimientosAPI = {
  listar(filtros?: { estatus?: EstatusMantenimiento; categoria?: CategoriaMantenimiento; propiedadId?: string }): Promise<SolicitudMantenimiento[]> {
    const params = new URLSearchParams();
    if (filtros?.estatus) params.set('estatus', filtros.estatus);
    if (filtros?.categoria) params.set('categoria', filtros.categoria);
    if (filtros?.propiedadId) params.set('propiedadId', filtros.propiedadId);
    const qs = params.toString();
    return fetchJSON(`${BASE}${qs ? `?${qs}` : ''}`);
  },

  obtener(id: string): Promise<SolicitudMantenimiento> {
    return fetchJSON(`${BASE}/${id}`);
  },

  crear(datos: MantenimientoEntrada): Promise<SolicitudMantenimiento> {
    return fetchJSON(BASE, { method: 'POST', body: JSON.stringify(datos) });
  },

  actualizar(id: string, datos: Partial<MantenimientoEntrada & { estatus: EstatusMantenimiento }>): Promise<SolicitudMantenimiento> {
    return fetchJSON(`${BASE}/${id}`, { method: 'PATCH', body: JSON.stringify(datos) });
  },

  eliminar(id: string): Promise<void> {
    return fetchJSON(`${BASE}/${id}`, { method: 'DELETE' });
  },
};
