import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { Plus, Eye, Wrench, Filter } from 'lucide-react';
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
  return new Date(fecha + 'T00:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function MantenimientosPage() {
  const queryClient = useQueryClient();
  const [filtroEstatus, setFiltroEstatus] = useState<EstatusMantenimiento | ''>('');
  const [filtroCategoria, setFiltroCategoria] = useState<CategoriaMantenimiento | ''>('');

  const { data: mantenimientos = [], isLoading } = useQuery({
    queryKey: ['mantenimientos', filtroEstatus, filtroCategoria],
    queryFn: () =>
      mantenimientosAPI.listar({
        estatus: filtroEstatus || undefined,
        categoria: filtroCategoria || undefined,
      }),
  });

  const eliminarMutation = useMutation({
    mutationFn: mantenimientosAPI.eliminar,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['mantenimientos'] }),
  });

  if (isLoading) return <p className="text-muted-foreground">Cargando mantenimientos…</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Mantenimiento</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {mantenimientos.length} solicitud{mantenimientos.length !== 1 && 'es'} registrada{mantenimientos.length !== 1 && 's'}
          </p>
        </div>
        <Link
          to="/mantenimientos/crear"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus size={18} />
          Nueva Solicitud
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <select
          value={filtroEstatus}
          onChange={(e) => setFiltroEstatus(e.target.value as EstatusMantenimiento | '')}
          className="px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="">Todos los estatus</option>
          <option value="pendiente">Pendientes</option>
          <option value="en-progreso">En progreso</option>
          <option value="completado">Completados</option>
          <option value="cancelado">Cancelados</option>
        </select>
        <select
          value={filtroCategoria}
          onChange={(e) => setFiltroCategoria(e.target.value as CategoriaMantenimiento | '')}
          className="px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="">Todas las categorías</option>
          {(Object.keys(CATEGORIA_LABELS) as CategoriaMantenimiento[]).map((c) => (
            <option key={c} value={c}>
              {CATEGORIA_LABELS[c]}
            </option>
          ))}
        </select>
        <Filter size={18} className="text-muted-foreground" />
      </div>

      {mantenimientos.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Wrench size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">No hay solicitudes</p>
          <p className="text-sm mt-1">Registra la primera solicitud de mantenimiento.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Categoría</th>
                <th className="text-left px-4 py-3 font-medium">Descripción</th>
                <th className="text-right px-4 py-3 font-medium">Costo</th>
                <th className="text-left px-4 py-3 font-medium">Reportado</th>
                <th className="text-center px-4 py-3 font-medium">Estatus</th>
                <th className="text-center px-4 py-3 font-medium w-20">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {mantenimientos.map((m) => (
                <tr key={m.id} className="hover:bg-secondary/20 transition-colors">
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        'inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border',
                        CATEGORIA_COLORES[m.categoria],
                      )}
                    >
                      {CATEGORIA_LABELS[m.categoria]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground max-w-md truncate" title={m.descripcion}>
                    {m.descripcion}
                  </td>
                  <td className="px-4 py-3 text-right font-mono">
                    {formatearMoneda(m.costo)}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {m.completadoEn ? formatearFecha(m.completadoEn) : formatearFecha(m.creadoEn)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={cn(
                        'inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border',
                        ESTATUS_COLORES[m.estatus],
                      )}
                    >
                      {m.estatus}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <Link
                        to={`/mantenimientos/$id`}
                        params={{ id: m.id }}
                        className="p-1.5 rounded-md hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
                        title="Ver detalle"
                      >
                        <Eye size={15} />
                      </Link>
                      <button
                        onClick={() => {
                          if (confirm('¿Eliminar esta solicitud?')) eliminarMutation.mutate(m.id);
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
