import type { Contrato, EstatusContrato } from '@proyecto-modular/shared/tipos/contratos';
import type { ContratoEntrada } from '@proyecto-modular/shared/esquemas/contratos';
import { descargarPDF } from './descargas';

const BASE = '/api/contratos';

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

export const contratosAPI = {
  listar(filtros?: { estatus?: EstatusContrato; activo?: boolean }): Promise<Contrato[]> {
    const params = new URLSearchParams();
    if (filtros?.estatus) params.set('estatus', filtros.estatus);
    if (filtros?.activo !== undefined) params.set('activo', String(filtros.activo));
    const qs = params.toString();
    return fetchJSON(`${BASE}${qs ? `?${qs}` : ''}`);
  },

  obtener(id: string): Promise<Contrato> {
    return fetchJSON(`${BASE}/${id}`);
  },

  crear(datos: ContratoEntrada): Promise<Contrato> {
    return fetchJSON(BASE, { method: 'POST', body: JSON.stringify(datos) });
  },

  actualizar(id: string, datos: Partial<ContratoEntrada & { estatus: EstatusContrato; activo: boolean }>): Promise<Contrato> {
    return fetchJSON(`${BASE}/${id}`, { method: 'PATCH', body: JSON.stringify(datos) });
  },

  eliminar(id: string): Promise<void> {
    return fetchJSON(`${BASE}/${id}`, { method: 'DELETE' });
  },

  /** Descarga el PDF del contrato (genera y abre diálogo de descarga). */
  descargarPDF(id: string): Promise<void> {
    return descargarPDF(`${BASE}/${id}/pdf`);
  },
};
