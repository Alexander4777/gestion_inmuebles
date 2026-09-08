import type { FotoPropiedad, Propiedad, PropiedadTipo } from '@proyecto-modular/shared/tipos/propiedades';
import type { DireccionEntrada } from '@proyecto-modular/shared/esquemas/propiedades';

const BASE = '/api/propiedades';

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

async function fetchAuth(url: string, init?: RequestInit): Promise<Response> {
  const token = localStorage.getItem('token');
  return fetch(url, {
    ...init,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers as Record<string, string> | undefined),
    },
  });
}

async function fetchJSONAuth<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetchAuth(url, init);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? 'Error desconocido');
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export interface PropiedadEntrada extends DireccionEntrada {
  nombre: string;
  tipo: PropiedadTipo;
}

export const propiedadesAPI = {
  listar(filtros?: { activa?: boolean; busqueda?: string }): Promise<Propiedad[]> {
    const params = new URLSearchParams();
    if (filtros?.activa !== undefined) params.set('activa', String(filtros.activa));
    if (filtros?.busqueda) params.set('busqueda', filtros.busqueda);
    const qs = params.toString();
    return fetchJSON(`${BASE}${qs ? `?${qs}` : ''}`);
  },

  obtener(id: string): Promise<Propiedad> {
    return fetchJSON(`${BASE}/${id}`);
  },

  crear(datos: PropiedadEntrada): Promise<Propiedad> {
    return fetchJSON(BASE, { method: 'POST', body: JSON.stringify(datos) });
  },

  actualizar(id: string, datos: Partial<PropiedadEntrada & { activa: boolean }>): Promise<Propiedad> {
    return fetchJSON(`${BASE}/${id}`, { method: 'PATCH', body: JSON.stringify(datos) });
  },

  eliminar(id: string): Promise<void> {
    return fetchJSON(`${BASE}/${id}`, { method: 'DELETE' });
  },

  // ── Fotos ───────────────────────────────────────────────────────────────────

  /** Lista las fotos de una propiedad. */
  listarFotos(propiedadId: string): Promise<FotoPropiedad[]> {
    return fetchJSON(`${BASE}/${propiedadId}/fotos`);
  },

  /**
   * Sube 1..N fotos a una propiedad. Devuelve las fotos creadas (incluyendo
   * el `id`, `url` y `esPortada` ya calculados por el backend).
   */
  async subirFotos(propiedadId: string, archivos: File[]): Promise<FotoPropiedad[]> {
    const form = new FormData();
    for (const f of archivos) form.append('fotos', f);
    const res = await fetchAuth(`${BASE}/${propiedadId}/fotos`, {
      method: 'POST',
      body: form,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error ?? 'Error al subir las fotos');
    }
    return res.json();
  },

  /** Elimina una foto individual. */
  eliminarFoto(fotoId: string): Promise<void> {
    return fetchJSONAuth(`${BASE}/fotos/${fotoId}`, { method: 'DELETE' });
  },

  /** Marca una foto como portada. */
  marcarPortada(fotoId: string): Promise<FotoPropiedad> {
    return fetchJSON(`${BASE}/fotos/${fotoId}/portada`, { method: 'PATCH' });
  },

  /** Reordena las fotos de una propiedad según el orden del array de ids. */
  reordenarFotos(propiedadId: string, ids: string[]): Promise<FotoPropiedad[]> {
    return fetchJSON(`${BASE}/${propiedadId}/fotos/orden`, {
      method: 'PATCH',
      body: JSON.stringify({ ids }),
    });
  },
};
