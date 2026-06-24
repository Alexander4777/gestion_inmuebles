import { useParams, Link } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Wrench, CheckCircle2, Play, Ban } from 'lucide-react';
import { mantenimientosAPI } from '@/services/mantenimientos.api';
import { cn } from '@/core/ui/cn';
import type {
  CategoriaMantenimiento,
  EstatusMantenimiento,
} from '@proyecto-modular/shared/tipos/mantenimiento';

const CATEGORIA_LABELS: Record<CategoriaMantenimiento, string> = {
  electricidad: 'Electricidad',
  fontaneria: 'Fontanería',
  carpinteria: 'Carpintería',
  albañileria: 'Albañilería',
  materiales: 'Materiales',
  otro: 'Otro',
};

const CATEGORIA_COLORES: Record<CategoriaMantenimiento, string> = {
  electricidad: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  fontaneria: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  carpinteria: 'bg-amber-100 text-amber-800 border-amber-200',
  albañileria: 'bg-orange-100 text-orange-800 border-orange-200',
  materiales: 'bg-stone-100 text-stone-800 border-stone-200',
  otro: 'bg-slate-100 text-slate-600 border-slate-200',
};

const ESTATUS_COLORES: Record<EstatusMantenimiento, string> = {
  pendiente: 'bg-amber-100 text-amber-800 border-amber-200',
  'en-progreso': 'bg-blue-100 text-blue-800 border-blue-200',
  completado: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  cancelado: 'bg-slate-100 text-slate-600 border-slate-200',
};

function formatearMoneda(monto: number | string): string {
  const n = typeof monto === 'string' ? Number(monto) : monto;
  return n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
}

function formatearFecha(fecha: string): string {
  return new Date(fecha).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
}

export function MantenimientoDetallePage() {
  const { id } = useParams({ strict: false }) as { id: string };
  const queryClient = useQueryClient();

  const { data: mantenimiento, isLoading, error } = useQuery({
    queryKey: ['mantenimientos', id],
    queryFn: () => mantenimientosAPI.obtener(id),
  });

  const cambiarEstatus = useMutation({
    mutationFn: (estatus: EstatusMantenimiento) =>
      mantenimientosAPI.actualizar(id, { estatus }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['mantenimientos'] }),
  });

  if (isLoading) return <p className="text-muted-foreground">Cargando mantenimiento…</p>;
  if (error || !mantenimiento)
    return (
      <div className="text-center py-16">
        <p className="text-lg font-medium text-red-600">Mantenimiento no encontrado</p>
        <Link to="/mantenimientos" className="text-sm text-primary hover:underline mt-2 inline-block">
          Volver a la lista
        </Link>
      </div>
    );

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <Link to="/mantenimientos" className="p-2 rounded-lg hover:bg-secondary transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <Wrench size={28} className="text-muted-foreground" />
            <h2 className="text-2xl font-bold tracking-tight">Solicitud de Mantenimiento</h2>
            <span
              className={cn(
                'inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border',
                ESTATUS_COLORES[mantenimiento.estatus],
              )}
            >
              {mantenimiento.estatus}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1 font-mono text-xs">{mantenimiento.id}</p>
        </div>
      </div>

      {/* ── Categoría y costo ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Categoría</p>
          <span
            className={cn(
              'inline-flex mt-2 px-2.5 py-0.5 rounded-full text-xs font-medium border',
              CATEGORIA_COLORES[mantenimiento.categoria],
            )}
          >
            {CATEGORIA_LABELS[mantenimiento.categoria]}
          </span>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Costo</p>
          <p className="text-2xl font-bold mt-1 font-mono">{formatearMoneda(mantenimiento.costo)}</p>
        </div>
      </div>

      {/* ── Detalle ──────────────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
        <h3 className="text-lg font-semibold">Descripción</h3>
        <p className="text-sm whitespace-pre-wrap">{mantenimiento.descripcion}</p>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
        <h3 className="text-lg font-semibold">Información</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Reportado por</p>
            <p className="font-medium">{mantenimiento.reportadoPor || '—'}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Creado</p>
            <p className="font-medium">{formatearFecha(mantenimiento.creadoEn)}</p>
          </div>
          {mantenimiento.completadoEn && (
            <div>
              <p className="text-muted-foreground">Completado</p>
              <p className="font-medium">{formatearFecha(mantenimiento.completadoEn)}</p>
            </div>
          )}
          <div>
            <p className="text-muted-foreground">ID Propiedad</p>
            <p className="font-medium font-mono text-xs">{mantenimiento.propiedadId}</p>
          </div>
        </div>
      </div>

      {/* ── Acciones ─────────────────────────────────────────────────────────── */}
      {mantenimiento.estatus !== 'completado' && mantenimiento.estatus !== 'cancelado' && (
        <div className="flex items-center gap-3 pt-2">
          {mantenimiento.estatus === 'pendiente' && (
            <button
              onClick={() => cambiarEstatus.mutate('en-progreso')}
              disabled={cambiarEstatus.isPending}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <Play size={18} />
              Iniciar
            </button>
          )}
          {mantenimiento.estatus === 'en-progreso' && (
            <button
              onClick={() => {
                if (confirm('¿Marcar como completado?')) cambiarEstatus.mutate('completado');
              }}
              disabled={cambiarEstatus.isPending}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
            >
              <CheckCircle2 size={18} />
              Completar
            </button>
          )}
          <button
            onClick={() => {
              if (confirm('¿Cancelar esta solicitud?')) cambiarEstatus.mutate('cancelado');
            }}
            disabled={cambiarEstatus.isPending}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-border text-sm hover:bg-secondary transition-colors disabled:opacity-50"
          >
            <Ban size={18} />
            Cancelar
          </button>
        </div>
      )}
    </div>
  );
}
