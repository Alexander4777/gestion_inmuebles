/** Dirección de una propiedad */
export interface Direccion {
  calle: string;
  numero: string;
  colonia: string;
  codigoPostal: string;
  ciudad: string;
  estado: string;
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
}

export type PropiedadTipo = 'casa' | 'departamento' | 'local-comercial' | 'bodega' | 'otro';
