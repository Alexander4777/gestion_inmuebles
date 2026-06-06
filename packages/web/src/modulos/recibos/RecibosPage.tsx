import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { Plus, Search, Filter, Eye, Trash2 } from 'lucide-react';
import { recibosAPI } from '@/services/recibos.api';
import { cn } from '@/core/ui/cn';

const ESTATUS_COLORES: Record<string, string> = {
  pendiente: 'bg-amber-100 text-amber-800 border-amber-200',
  pagado: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  vencido: 'bg-red-100 text-red-800 border-red-200',
  cancelado: 'bg-slate-100 text-slate-600 border-slate-200',
};

function formatearMoneda(monto: number | string): string {
  const n = typeof monto === 'string' ? Number(monto) : monto;
  return n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
}

export function RecibosPage() {
  const queryClient = useQueryClient();
  const [filtroEstatus, setFiltroEstatus] = useState<string>('');
  const [busqueda, setBusqueda] = useState('');

  const { data: recibos = [], isLoading } = useQuery({
    queryKey: ['recibos', filtroEstatus],
    queryFn: () => recibosAPI.listar(filtroEstatus ? { estatus: filtroEstatus } : undefined),
  });

  const eliminarMutation = useMutation({
    mutationFn: recibosAPI.eliminar,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['recibos'] }),
  });

  const filtrados = useMemo(() => {
    if (!busqueda) return recibos;
    const q = busqueda.toLowerCase();
    return recibos.filter(
      (r) =>
        r.id.toLowerCase().includes(q) ||
        r.numeroRecibo.toLowerCase().includes(q) ||
        r.contratoId.toLowerCase().includes(q),
    );
  }, [recibos, busqueda]);

  if (isLoading) return <p className="text-muted-foreground">Cargando recibos…</p>;

  return (
    <div className="space-y-6">
      {/* ── Encabezado ────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Recibos</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {recibos.length} recibo{recibos.length !== 1 && 's'} registrado{recibos.length !== 1 && 's'}
          </p>
        </div>
        <Link
          to="/recibos/crear"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus size={18} />
          Nuevo Recibo
        </Link>
      </div>

      {/* ── Filtros ───────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por número o ID…"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <select
          value={filtroEstatus}
          onChange={(e) => setFiltroEstatus(e.target.value)}
          className="px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="">Todos los estatus</option>
          <option value="pendiente">Pendientes</option>
          <option value="pagado">Pagados</option>
          <option value="vencido">Vencidos</option>
          <option value="cancelado">Cancelados</option>
        </select>
        <Filter size={18} className="text-muted-foreground" />
      </div>

      {/* ── Tabla ─────────────────────────────────────────────────────────────── */}
      {filtrados.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Receipt size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">No hay recibos</p>
          <p className="text-sm mt-1">
            {busqueda || filtroEstatus ? 'Cambia los filtros o ' : ''}
            crea tu primer recibo para empezar.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Número</th>
                <th className="text-left px-4 py-3 font-medium">Periodo</th>
                <th className="text-right px-4 py-3 font-medium">Total</th>
                <th className="text-center px-4 py-3 font-medium">Estatus</th>
                <th className="text-center px-4 py-3 font-medium w-20">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtrados.map((recibo) => (
                <tr key={recibo.id} className="hover:bg-secondary/20 transition-colors">
                  <td className="px-4 py-3 font-medium">{recibo.numeroRecibo}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {recibo.periodoInicio} → {recibo.periodoFin}
                  </td>
                  <td className="px-4 py-3 text-right font-mono">
                    {formatearMoneda(recibo.total)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={cn(
                        'inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border',
                        ESTATUS_COLORES[recibo.estatus] ?? 'bg-slate-100 text-slate-600',
                      )}
                    >
                      {recibo.estatus}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <Link
                        to={`/recibos/$id`}
                        params={{ id: recibo.id }}
                        className="p-1.5 rounded-md hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
                        title="Ver detalle"
                      >
                        <Eye size={15} />
                      </Link>
                      <button
                        onClick={() => {
                          if (confirm('¿Eliminar este recibo?')) eliminarMutation.mutate(recibo.id);
                        }}
                        className="p-1.5 rounded-md hover:bg-red-50 transition-colors text-muted-foreground hover:text-red-600"
                        title="Eliminar"
                      >
                        <Trash2 size={15} />
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

// Icono placeholder para estado vacío
function Receipt({ size, className }: { size: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" />
      <path d="M8 7h8" />
      <path d="M8 11h8" />
      <path d="M8 15h5" />
    </svg>
  );
}
