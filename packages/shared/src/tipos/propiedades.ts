/** Dirección de una propiedad */
export interface Direccion {
  calle: string;
  numero: string;
  colonia: string;
  codigoPostal: string;
  ciudad: string;
  estado: string;
}

export type PropiedadTipo = 'casa' | 'departamento' | 'local-comercial' | 'bodega' | 'otro';

/**
 * Foto asociada a una propiedad.
 * `url` ya viene compuesta por el backend (ej: `/uploads/propiedades/<id>/<uuid>.jpg`)
 * y se usa directo en `<img src>`.
 */
export interface FotoPropiedad {
  id: string;
  nombreOriginal: string;
  mimeType: string;
  tamanoBytes: number;
  orden: number;
  esPortada: boolean;
  url: string;
  subidaEn: string;
}

/** Unidad rentable (casa, departamento, local comercial) */
export interface Propiedad {
  id: string;
  nombre: string;
  direccion: Direccion;
  tipo: PropiedadTipo;
  activa: boolean;
  creadaEn: string;
  actualizadaEn: string;
  /** Opcional: el listado no lo incluye para no inflar la respuesta. */
  fotos?: FotoPropiedad[];
}
