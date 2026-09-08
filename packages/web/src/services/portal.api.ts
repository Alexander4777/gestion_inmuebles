/**
 * Cliente del módulo portal (inquilino).
 *
 * Mismo patrón de fetchJSON que los demás *.api.ts del repo (smell conocido
 * — refactor pendiente a core/api/fetchJSON).
 */

import type { Contrato } from '@proyecto-modular/shared/tipos/contratos';
import type { Inquilino } from '@proyecto-modular/shared/tipos/inquilinos';

const BASE = '/api/portal';

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

/** Contrato con el inquilino embebido (para saludo). */
export interface ContratoPortal extends Contrato {
  inquilino?: Inquilino;
}

export const portalAPI = {
  obtenerMiContrato(): Promise<ContratoPortal> {
    return fetchJSON(`${BASE}/mi-contrato`);
  },

  obtenerMiPerfil(): Promise<Inquilino> {
    return fetchJSON(`${BASE}/mi-perfil`);
  },
};