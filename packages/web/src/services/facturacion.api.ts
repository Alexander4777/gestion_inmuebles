import type {
  Factura,
  EstatusFactura,
} from '@proyecto-modular/shared/tipos/facturacion';
import type {
  FacturaEntrada,
  FacturaCancelarEntrada,
} from '@proyecto-modular/shared/esquemas/facturacion';

const BASE = '/api/facturas';

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

export const facturacionAPI = {
  listar(filtros?: { estatus?: EstatusFactura; reciboId?: string }): Promise<Factura[]> {
    const params = new URLSearchParams();
    if (filtros?.estatus) params.set('estatus', filtros.estatus);
    if (filtros?.reciboId) params.set('reciboId', filtros.reciboId);
    const qs = params.toString();
    return fetchJSON(`${BASE}${qs ? `?${qs}` : ''}`);
  },

  obtener(id: string): Promise<Factura> {
    return fetchJSON(`${BASE}/${id}`);
  },

  crear(datos: FacturaEntrada): Promise<Factura> {
    return fetchJSON(BASE, { method: 'POST', body: JSON.stringify(datos) });
  },

  timbrar(id: string): Promise<Factura> {
    return fetchJSON(`${BASE}/${id}/timbrar`, { method: 'POST' });
  },

  cancelar(id: string, datos: FacturaCancelarEntrada): Promise<Factura> {
    return fetchJSON(`${BASE}/${id}/cancelar`, {
      method: 'POST',
      body: JSON.stringify(datos),
    });
  },

  eliminar(id: string): Promise<void> {
    return fetchJSON(`${BASE}/${id}`, { method: 'DELETE' });
  },
};