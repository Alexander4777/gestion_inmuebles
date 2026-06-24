import { useParams, Link, useNavigate } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, TrendingUp, Hash } from 'lucide-react';
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
  'honorarios-administrador': 'Honorarios administrador',
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
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function MovimientoDetallePage() {
  const { id } = useParams({ strict: false }) as { id: string };
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: mov, isLoading, error } = useQuery({
    queryKey: ['movimientos', id],
    queryFn: () => movimientosAPI.obtener(id),
  });

  const eliminarMutation = useMutation({
    mutationFn: movimientosAPI.eliminar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movimientos'] });
      navigate({ to: '/contabilidad' });
    },
  });

  if (isLoading) return <p className="text-muted-foreground">Cargando movimiento…</p>;
  if (error || !mov)
    return (
      <div className="text-center py-16">
        <p className="text-lg font-medium text-red-600">Movimiento no encontrado</p>
        <Link to="/contabilidad" className="text-sm text-primary hover:underline mt-2 inline-block">
          Volver a la lista
        </Link>
      </div>
    );

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <Link to="/contabilidad" className="p-2 rounded-lg hover:bg-secondary transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <TrendingUp size={28} className="text-muted-foreground" />
            <h2 className="text-2xl font-bold tracking-tight">Movimiento Contable</h2>
            <span
              className={cn(
                'inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border',
                TIPO_COLORES[mov.tipo],
              )}
            >
              {mov.tipo}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1 font-mono text-xs">{mov.id}</p>
        </div>
      </div>

      {/* Monto destacado */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <p className="text-xs text-muted-foreground uppercase tracking-wide">Monto</p>
        <p
          className={cn(
            'text-4xl font-bold mt-1 font-mono',
            mov.tipo === 'ingreso' ? 'text-emerald-600' : 'text-red-600',
          )}
        >
          {mov.tipo === 'ingreso' ? '+' : '−'}
          {formatearMoneda(mov.monto)}
        </p>
      </div>

      {/* Detalle */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
        <h3 className="text-lg font-semibold">Detalle</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Categoría</p>
            <p className="font-medium">{nombreCategoria(mov.categoria)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Fecha</p>
            <p className="font-medium">{formatearFecha(mov.fecha)}</p>
          </div>
        </div>
        <div>
          <p className="text-muted-foreground text-sm">Descripción</p>
          <p className="text-sm whitespace-pre-wrap mt-1">{mov.descripcion}</p>
        </div>
      </div>

      {/* Referencias */}
      {(mov.propiedadId || mov.contratoId || mov.facturaId) && (
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-3">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Hash size={18} />
            Referencias
          </h3>
          <div className="space-y-2 text-sm">
            {mov.propiedadId && (
              <div>
                <p className="text-xs text-muted-foreground">Propiedad</p>
                <p className="font-mono text-xs">{mov.propiedadId}</p>
              </div>
            )}
            {mov.contratoId && (
              <div>
                <p className="text-xs text-muted-foreground">Contrato</p>
                <p className="font-mono text-xs">{mov.contratoId}</p>
              </div>
            )}
            {mov.facturaId && (
              <div>
                <p className="text-xs text-muted-foreground">Factura</p>
                <p className="font-mono text-xs">{mov.facturaId}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Acciones */}
      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={() => {
            if (confirm('¿Eliminar este movimiento?')) eliminarMutation.mutate(mov.id);
          }}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-red-200 text-red-600 text-sm hover:bg-red-50 transition-colors"
        >
          Eliminar movimiento
        </button>
      </div>
    </div>
  );
}