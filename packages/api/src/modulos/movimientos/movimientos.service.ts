import { db } from '../../core/db';
import { movimientosContables } from '../../core/db/esquema';
import { eq, and, gte, lte, desc, sql } from 'drizzle-orm';
import type { MovimientoEntrada } from '@proyecto-modular/shared/esquemas/contabilidad';
import type {
  MovimientoContable,
  TipoMovimiento,
  CategoriaIngreso,
  CategoriaGasto,
  EstadoResultados,
} from '@proyecto-modular/shared/tipos/contabilidad';

type MovimientoRow = typeof movimientosContables.$inferSelect;

const CATEGORIAS_INGRESO: readonly string[] = ['renta', 'deposito', 'otro-ingreso'];
const CATEGORIAS_GASTO: readonly string[] = [
  'luz',
  'internet',
  'predial',
  'honorarios-administrador',
  'mantenimiento',
  'sat',
  'otro-gasto',
];

// ── Validación tipo↔categoría ──────────────────────────────────────────────────

function categoriaValida(tipo: TipoMovimiento, categoria: string): boolean {
  return tipo === 'ingreso'
    ? CATEGORIAS_INGRESO.includes(categoria)
    : CATEGORIAS_GASTO.includes(categoria);
}

// ── Mapeo DB ↔ Dominio ──────────────────────────────────────────────────────────

function mapearMovimiento(row: MovimientoRow): MovimientoContable {
  return {
    id: row.id,
    tipo: row.tipo as TipoMovimiento,
    categoria: row.categoria as CategoriaIngreso | CategoriaGasto,
    monto: Number(row.monto),
    descripcion: row.descripcion,
    fecha: row.fecha,
    propiedadId: row.propiedadId ?? undefined,
    contratoId: row.contratoId ?? undefined,
    facturaId: row.facturaId ?? undefined,
    creadoEn: row.creadoEn.toISOString(),
    actualizadoEn: row.actualizadoEn.toISOString(),
  };
}

// ── Servicio ───────────────────────────────────────────────────────────────────

export const movimientosService = {
  async listar(filtros?: {
    tipo?: TipoMovimiento;
    fechaDesde?: string;
    fechaHasta?: string;
    propiedadId?: string;
  }): Promise<MovimientoContable[]> {
    const condiciones: ReturnType<typeof eq>[] = [];

    if (filtros?.tipo) {
      condiciones.push(eq(movimientosContables.tipo, filtros.tipo));
    }
    if (filtros?.fechaDesde) {
      condiciones.push(gte(movimientosContables.fecha, filtros.fechaDesde));
    }
    if (filtros?.fechaHasta) {
      condiciones.push(lte(movimientosContables.fecha, filtros.fechaHasta));
    }
    if (filtros?.propiedadId) {
      condiciones.push(eq(movimientosContables.propiedadId, filtros.propiedadId));
    }

    const filas = await db
      .select()
      .from(movimientosContables)
      .where(condiciones.length > 0 ? and(...condiciones) : undefined)
      .orderBy(desc(movimientosContables.fecha));

    return filas.map(mapearMovimiento);
  },

  async obtenerPorId(id: string): Promise<MovimientoContable | null> {
    const filas = await db
      .select()
      .from(movimientosContables)
      .where(eq(movimientosContables.id, id))
      .limit(1);

    return filas[0] ? mapearMovimiento(filas[0]) : null;
  },

  async crear(datos: MovimientoEntrada): Promise<MovimientoContable> {
    if (!categoriaValida(datos.tipo, datos.categoria)) {
      throw new Error(
        `Categoría "${datos.categoria}" no válida para movimientos de tipo "${datos.tipo}"`,
      );
    }

    const [fila] = await db
      .insert(movimientosContables)
      .values({
        tipo: datos.tipo,
        categoria: datos.categoria,
        monto: String(datos.monto),
        descripcion: datos.descripcion,
        fecha: datos.fecha,
        propiedadId: datos.propiedadId ?? null,
        contratoId: datos.contratoId ?? null,
        facturaId: datos.facturaId ?? null,
      })
      .returning();

    if (!fila) throw new Error('No se pudo crear el movimiento');
    return mapearMovimiento(fila);
  },

  async actualizar(
    id: string,
    datos: Partial<MovimientoEntrada>,
  ): Promise<MovimientoContable | null> {
    // Si cambia tipo o categoría, validar coherencia usando el dato nuevo o el actual
    if (datos.tipo || datos.categoria) {
      const actual = await this.obtenerPorId(id);
      if (!actual) return null;
      const tipoFinal = datos.tipo ?? actual.tipo;
      const categoriaFinal = datos.categoria ?? actual.categoria;
      if (!categoriaValida(tipoFinal, categoriaFinal)) {
        throw new Error(
          `Categoría "${categoriaFinal}" no válida para movimientos de tipo "${tipoFinal}"`,
        );
      }
    }

    const valores: Record<string, unknown> = {};
    if (datos.tipo) valores.tipo = datos.tipo;
    if (datos.categoria) valores.categoria = datos.categoria;
    if (datos.monto !== undefined) valores.monto = String(datos.monto);
    if (datos.descripcion) valores.descripcion = datos.descripcion;
    if (datos.fecha) valores.fecha = datos.fecha;
    if (datos.propiedadId !== undefined) valores.propiedadId = datos.propiedadId || null;
    if (datos.contratoId !== undefined) valores.contratoId = datos.contratoId || null;
    if (datos.facturaId !== undefined) valores.facturaId = datos.facturaId || null;

    const [fila] = await db
      .update(movimientosContables)
      .set(valores)
      .where(eq(movimientosContables.id, id))
      .returning();

    return fila ? mapearMovimiento(fila) : null;
  },

  async eliminar(id: string): Promise<boolean> {
    const resultado = await db
      .delete(movimientosContables)
      .where(eq(movimientosContables.id, id));
    return (resultado.rowCount ?? 0) > 0;
  },

  async calcularEstadoResultados(mes: number, año: number): Promise<EstadoResultados> {
    // Primer y último día del mes (formato YYYY-MM-DD)
    const fechaDesde = `${año}-${String(mes).padStart(2, '0')}-01`;
    const ultimoDia = new Date(año, mes, 0).getDate();
    const fechaHasta = `${año}-${String(mes).padStart(2, '0')}-${String(ultimoDia).padStart(2, '0')}`;

    const filas = await db
      .select({
        tipo: movimientosContables.tipo,
        categoria: movimientosContables.categoria,
        total: sql<string>`SUM(${movimientosContables.monto})`,
      })
      .from(movimientosContables)
      .where(
        and(
          gte(movimientosContables.fecha, fechaDesde),
          lte(movimientosContables.fecha, fechaHasta),
        ),
      )
      .groupBy(movimientosContables.tipo, movimientosContables.categoria);

    // Hidratar con ceros
    const ingresos = { renta: 0, deposito: 0, otro: 0, total: 0 };
    const gastos = {
      luz: 0,
      internet: 0,
      predial: 0,
      honorariosAdministrador: 0,
      mantenimiento: 0,
      sat: 0,
      otro: 0,
      total: 0,
    };

    for (const fila of filas) {
      const monto = Number(fila.total);
      if (fila.tipo === 'ingreso') {
        if (fila.categoria === 'renta') ingresos.renta += monto;
        else if (fila.categoria === 'deposito') ingresos.deposito += monto;
        else ingresos.otro += monto;
      } else {
        if (fila.categoria === 'luz') gastos.luz += monto;
        else if (fila.categoria === 'internet') gastos.internet += monto;
        else if (fila.categoria === 'predial') gastos.predial += monto;
        else if (fila.categoria === 'honorarios-administrador') gastos.honorariosAdministrador += monto;
        else if (fila.categoria === 'mantenimiento') gastos.mantenimiento += monto;
        else if (fila.categoria === 'sat') gastos.sat += monto;
        else gastos.otro += monto;
      }
    }

    ingresos.total = ingresos.renta + ingresos.deposito + ingresos.otro;
    gastos.total =
      gastos.luz +
      gastos.internet +
      gastos.predial +
      gastos.honorariosAdministrador +
      gastos.mantenimiento +
      gastos.sat +
      gastos.otro;

    return {
      mes,
      año,
      ingresos,
      gastos,
      utilidadNeta: ingresos.total - gastos.total,
    };
  },
};
