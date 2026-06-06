export type CategoriaMantenimiento =
  | 'electricidad'
  | 'fontaneria'
  | 'carpinteria'
  | 'albañileria'
  | 'materiales'
  | 'otro';

export type EstatusMantenimiento = 'pendiente' | 'en-progreso' | 'completado' | 'cancelado';

export interface SolicitudMantenimiento {
  id: string;
  propiedadId: string;
  categoria: CategoriaMantenimiento;
  descripcion: string;
  costo: number;
  estatus: EstatusMantenimiento;
  reportadoPor?: string;
  completadoEn?: string;
  creadoEn: string;
  actualizadoEn: string;
}
