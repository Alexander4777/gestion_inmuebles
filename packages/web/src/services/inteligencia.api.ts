import type {
  DashboardIA,
  ModeloInfo,
  PrediccionMorosidad,
  PrediccionVacancia,
  PrediccionMantenimiento,
} from '@proyecto-modular/shared/tipos/inteligencia';

const BASE = '/api/ia';

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
  return res.json();
}

export const inteligenciaAPI = {
  dashboard(): Promise<DashboardIA> {
    return fetchJSON(`${BASE}/dashboard`);
  },

  modelos(): Promise<ModeloInfo[]> {
    return fetchJSON(`${BASE}/modelos`);
  },

  entrenar(nombre: 'morosidad' | 'vacancia' | 'mantenimiento'): Promise<{
    estado: string;
    modelo?: unknown;
    metricas?: unknown;
    mensaje?: string;
  }> {
    return fetchJSON(`${BASE}/modelos/${nombre}/entrenar`, { method: 'POST' });
  },

  morosidadTop(limite = 50, umbral = 0.5): Promise<PrediccionMorosidad[]> {
    return fetchJSON(`${BASE}/morosidad?limite=${limite}&umbral=${umbral}`);
  },

  vacanciaTop(limite = 50, umbral = 0.5): Promise<PrediccionVacancia[]> {
    return fetchJSON(`${BASE}/vacancia?limite=${limite}&umbral=${umbral}`);
  },

  mantenimientoTop(limite = 50): Promise<PrediccionMantenimiento[]> {
    return fetchJSON(`${BASE}/mantenimiento?limite=${limite}`);
  },
};