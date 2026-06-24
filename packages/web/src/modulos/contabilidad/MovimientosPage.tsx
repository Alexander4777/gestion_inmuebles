import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { Plus, Eye, TrendingUp, Calculator, Filter } from 'lucide-react';
import { movimientosAPI } from '@/services/movimientos.api';
import { cn } from '@/core/ui/cn';
import type {
  TipoMovimiento,
  CategoriaIngreso,
  CategoriaGasto,
} from '@proyecto-modular/shared/tipos/contabilidad';

const CATEGORIAS_INGRESO: Record<CategoriaIngreso, string> = {
  renta: 'Renta',
  deposito: 'Depósito',
  'otro-ingreso': 'Otro ingreso',
};

const CATEGORIAS_GASTO: Record<CategoriaGasto, string> = {
  luz: 'Luz',
  internet: 'Internet',
  predial: 'Predial',
  'honorarios-administrador': 'Honorarios admin.',
  mantenimiento: 'Mantenimiento',
  sat: 'SAT',
  'otro-gasto': 'Otro gasto',
};

function nombreCategoria(cat: string): string {
  return (
    (CATEGORIAS_INGRESO as Record<string, string>)[cat] ??
    (CATEGORIAS_GASTO as Record<string, string>)[cat] ??
    cat
  );
}

const TIPO_COLORES: Record<TipoMovimiento, string> = {
  ingreso: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  gasto: 'bg-red-100 text-red-800 border-red-200',
};

function formatearMoneda(monto: number | string): string {
  const n = typeof monto === 'string' ? Number(monto) : monto;
  return n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
}

function formatearFecha(fecha: string): string {
  return new Date(fecha + 'T00:00:00').toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function hoyISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function primerDiaMesISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

export function MovimientosPage() {
  const queryClient = useQueryClient();
  const [filtroTipo, setFiltroTipo] = useState<TipoMovimiento | ''>('');
  const [fechaDesde, setFechaDesde] = useState(primerDiaMesISO());
  const [fechaHasta, setFechaHasta] = useState(hoyISO());

  const { data: movimientos = [], isLoading } = useQuery({
    queryKey: ['movimientos', filtroTipo, fechaDesde, fechaHasta],
    queryFn: () =>
      movimientosAPI.listar({
        tipo: filtroTipo || undefined,
        fechaDesde,
        fechaHasta,
      }),
  });

  const eliminarMutation = useMutation({
    mutationFn: movimientosAPI.eliminar,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['movimientos'] }),
  });

  const totalIngresos = movimientos
    .filter((m) => m.tipo === 'ingreso')
    .reduce((acc, m) => acc + m.monto, 0);
  const totalGastos = movimientos
    .filter((m) => m.tipo === 'gasto')
    .reduce((acc, m) => acc + m.monto, 0);
  const balance = totalIngresos - totalGastos;

  if (isLoading) return <p className="text-muted-foreground">Cargando movimientos…</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Contabilidad</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {movimientos.length} movimiento{movimientos.length !== 1 && 's'} en el período
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/contabilidad/estado-resultados"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-secondary transition-colors"
          >
            <Calculator size={18} />
            Estado de Resultados
          </Link>
          <Link
            to="/contabilidad/movimientos/crear"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus size={18} />
            Nuevo Movimiento
          </Link>
        </div>
      </div>

      {/* Resumen rápido */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Ingresos</p>
          <p className="text-2xl font-bold mt-1 font-mono text-emerald-600">
            {formatearMoneda(totalIngresos)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Gastos</p>
          <p className="text-2xl font-bold mt-1 font-mono text-red-600">
            {formatearMoneda(totalGastos)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Balance</p>
          <p
            className={cn(
              'text-2xl font-bold mt-1 font-mono',
              balance >= 0 ? 'text-emerald-600' : 'text-red-600',
            )}
          >
            {formatearMoneda(balance)}
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-3 flex-wrap">
        <select
          value={filtroTipo}
          onChange={(e) => setFiltroTipo(e.target.value as TipoMovimiento | '')}
          className="px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="">Todos los tipos</option>
          <option value="ingreso">Ingresos</option>
          <option value="gasto">Gastos</option>
        </select>
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground">Desde:</label>
          <input
            type="date"
            value={fechaDesde}
            onChange={(e) => setFechaDesde(e.target.value)}
            className="px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground">Hasta:</label>
          <input
            type="date"
            value={fechaHasta}
            onChange={(e) => setFechaHasta(e.target.value)}
            className="px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <Filter size={18} className="text-muted-foreground" />
      </div>

      {/* Tabla */}
      {movimientos.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <TrendingUp size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">No hay movimientos</p>
          <p className="text-sm mt-1">Registra el primer ingreso o gasto del período.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Fecha</th>
                <th className="text-left px-4 py-3 font-medium">Tipo</th>
                <th className="text-left px-4 py-3 font-medium">Categoría</th>
                <th className="text-left px-4 py-3 font-medium">Descripción</th>
                <th className="text-right px-4 py-3 font-medium">Monto</th>
                <th className="text-center px-4 py-3 font-medium w-20">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {movimientos.map((m) => (
                <tr key={m.id} className="hover:bg-secondary/20 transition-colors">
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {formatearFecha(m.fecha)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        'inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border',
                        TIPO_COLORES[m.tipo],
                      )}
                    >
                      {m.tipo}
                    </span>
                  </td>
                  <td className="px-4 py-3">{nombreCategoria(m.categoria)}</td>
                  <td className="px-4 py-3 text-muted-foreground max-w-md truncate" title={m.descripcion}>
                    {m.descripcion}
                  </td>
                  <td
                    className={cn(
                      'px-4 py-3 text-right font-mono font-semibold',
                      m.tipo === 'ingreso' ? 'text-emerald-600' : 'text-red-600',
                    )}
                  >
                    {m.tipo === 'ingreso' ? '+' : '−'}
                    {formatearMoneda(m.monto)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <Link
                        to={`/contabilidad/movimientos/$id`}
                        params={{ id: m.id }}
                        className="p-1.5 rounded-md hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
                        title="Ver detalle"
                      >
                        <Eye size={15} />
                      </Link>
                      <button
                        onClick={() => {
                          if (confirm('¿Eliminar este movimiento?')) eliminarMutation.mutate(m.id);
                        }}
                        className="p-1.5 rounded-md hover:bg-red-50 transition-colors text-muted-foreground hover:text-red-600"
                        title="Eliminar"
                      >
                        ×
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}