import type { Recibo, DetalleRecibo } from '@proyecto-modular/shared/tipos/recibos';
import type { ReciboEntrada } from '@proyecto-modular/shared/esquemas/recibos';
import { descargarPDF } from './descargas';

const BASE = '/api/recibos';

async function fetchJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const res = await fetch(url, { ...init, headers: { ...headers, ...(init?.headers as Record<string, string>) } });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(error.error ?? 'Error desconocido');
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export const recibosAPI = {
  listar(filtros?: { estatus?: string; contratoId?: string }): Promise<Recibo[]> {
    const params = new URLSearchParams();
    if (filtros?.estatus) params.set('estatus', filtros.estatus);
    if (filtros?.contratoId) params.set('contratoId', filtros.contratoId);
    const qs = params.toString();
    return fetchJSON(`${BASE}${qs ? `?${qs}` : ''}`);
  },

  obtener(id: string): Promise<DetalleRecibo> {
    return fetchJSON(`${BASE}/${id}`);
  },

  crear(datos: ReciboEntrada): Promise<Recibo> {
    return fetchJSON(BASE, {
      method: 'POST',
      body: JSON.stringify(datos),
    });
  },

  actualizar(id: string, datos: Partial<ReciboEntrada & { estatus: Recibo['estatus'] }>): Promise<Recibo> {
    return fetchJSON(`${BASE}/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(datos),
    });
  },

  eliminar(id: string): Promise<void> {
    return fetchJSON(`${BASE}/${id}`, { method: 'DELETE' });
  },

  /** Descarga el PDF del recibo (genera y abre diálogo de descarga). */
  descargarPDF(id: string): Promise<void> {
    return descargarPDF(`${BASE}/${id}/pdf`);
  },
};
