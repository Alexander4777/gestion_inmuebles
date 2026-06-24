import type { Inquilino } from '@proyecto-modular/shared/tipos/inquilinos';
import type { InquilinoEntrada } from '@proyecto-modular/shared/esquemas/inquilinos';

const BASE = '/api/inquilinos';

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

export const inquilinosAPI = {
  listar(filtros?: { activo?: boolean; busqueda?: string }): Promise<Inquilino[]> {
    const params = new URLSearchParams();
    if (filtros?.activo !== undefined) params.set('activo', String(filtros.activo));
    if (filtros?.busqueda) params.set('busqueda', filtros.busqueda);
    const qs = params.toString();
    return fetchJSON(`${BASE}${qs ? `?${qs}` : ''}`);
  },

  obtener(id: string): Promise<Inquilino> {
    return fetchJSON(`${BASE}/${id}`);
  },

  crear(datos: InquilinoEntrada): Promise<Inquilino> {
    return fetchJSON(BASE, { method: 'POST', body: JSON.stringify(datos) });
  },

  actualizar(id: string, datos: Partial<InquilinoEntrada & { activo: boolean }>): Promise<Inquilino> {
    return fetchJSON(`${BASE}/${id}`, { method: 'PATCH', body: JSON.stringify(datos) });
  },

  eliminar(id: string): Promise<void> {
    return fetchJSON(`${BASE}/${id}`, { method: 'DELETE' });
  },
};
