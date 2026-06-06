export type TipoMovimiento = 'ingreso' | 'gasto';

export type CategoriaIngreso = 'renta' | 'deposito' | 'otro-ingreso';

export type CategoriaGasto =
  | 'luz'
  | 'internet'
  | 'predial'
  | 'honorarios-administrador'
  | 'mantenimiento'
  | 'sat'
  | 'otro-gasto';

export interface MovimientoContable {
  id: string;
  tipo: TipoMovimiento;
  categoria: CategoriaIngreso | CategoriaGasto;
  monto: number;
  descripcion: string;
  fecha: string;
  propiedadId?: string;
  contratoId?: string;
  facturaId?: string;
  creadoEn: string;
  actualizadoEn: string;
}

/** Estado de resultados mensual */
export interface EstadoResultados {
  mes: number;
  año: number;
  ingresos: {
    renta: number;
    deposito: number;
    otro: number;
    total: number;
  };
  gastos: {
    luz: number;
    internet: number;
    predial: number;
    honorariosAdministrador: number;
    mantenimiento: number;
    sat: number;
    otro: number;
    total: number;
  };
  utilidadNeta: number;
}
