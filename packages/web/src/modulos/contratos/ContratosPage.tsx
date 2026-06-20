import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { Plus, Search, Filter, Eye, Trash2 } from 'lucide-react';
import { contratosAPI } from '@/services/contratos.api';
import { cn } from '@/core/ui/cn';
import type { EstatusContrato } from '@proyecto-modular/shared/tipos/contratos';

const ESTATUS_COLORES: Record<EstatusContrato, string> = {
  vigente: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  'proximo-a-vencer': 'bg-amber-100 text-amber-800 border-amber-200',
  vencido: 'bg-red-100 text-red-800 border-red-200',
  terminado: 'bg-slate-100 text-slate-600 border-slate-200',
  cancelado: 'bg-slate-100 text-slate-600 border-slate-200',
};

function formatearMoneda(monto: number | string): string {
  const n = typeof monto === 'string' ? Number(monto) : monto;
  return n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
}

function formatearFecha(fecha: string): string {
  return new Date(fecha + 'T00:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function ContratosPage() {
  const queryClient = useQueryClient();
  const [filtroEstatus, setFiltroEstatus] = useState<EstatusContrato | ''>('');
  const [busqueda, setBusqueda] = useState('');

  const { data: contratos = [], isLoading } = useQuery({
    queryKey: ['contratos', filtroEstatus],
    queryFn: () => contratosAPI.listar(filtroEstatus ? { estatus: filtroEstatus } : undefined),
  });

  const eliminarMutation = useMutation({
    mutationFn: contratosAPI.eliminar,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['contratos'] }),
  });

  const filtrados = useMemo(() => {
    if (!busqueda) return contratos;
    const q = busqueda.toLowerCase();
    return contratos.filter((c) => {
      const nombreCompleto = c.inquilino
        ? `${c.inquilino.nombre} ${c.inquilino.apellidoPaterno} ${c.inquilino.apellidoMaterno}`.toLowerCase()
        : '';
      return (
        c.id.toLowerCase().includes(q) ||
        c.inquilinoId.toLowerCase().includes(q) ||
        c.propiedadId.toLowerCase().includes(q) ||
        nombreCompleto.includes(q)
      );
    });
  }, [contratos, busqueda]);

  if (isLoading) return <p className="text-muted-foreground">Cargando contratos…</p>;

  return (
    <div className="space-y-6">
      {/* ── Encabezado ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Contratos</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {contratos.length} contrato{contratos.length !== 1 && 's'} registrado{contratos.length !== 1 && 's'}
          </p>
        </div>
        <Link
          to="/contratos/crear"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus size={18} />
          Nuevo Contrato
        </Link>
      </div>

      {/* ── Filtros ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por inquilino, propiedad…"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <select
          value={filtroEstatus}
          onChange={(e) => setFiltroEstatus(e.target.value as EstatusContrato | '')}
          className="px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="">Todos los estatus</option>
          <option value="vigente">Vigentes</option>
          <option value="proximo-a-vencer">Próximos a vencer</option>
          <option value="vencido">Vencidos</option>
          <option value="terminado">Terminados</option>
          <option value="cancelado">Cancelados</option>
        </select>
        <Filter size={18} className="text-muted-foreground" />
      </div>

      {/* ── Tabla ───────────────────────────────────────────────────────────── */}
      {filtrados.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <FileTextIcon />
          <p className="text-lg font-medium">No hay contratos</p>
          <p className="text-sm mt-1">Crea tu primer contrato para empezar.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Inquilino</th>
                <th className="text-left px-4 py-3 font-medium">Propiedad</th>
                <th className="text-left px-4 py-3 font-medium">Periodo</th>
                <th className="text-right px-4 py-3 font-medium">Renta</th>
                <th className="text-center px-4 py-3 font-medium">Estatus</th>
                <th className="text-center px-4 py-3 font-medium w-20">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtrados.map((contrato) => {
                const inquilino = contrato.inquilino
                  ? `${contrato.inquilino.nombre} ${contrato.inquilino.apellidoPaterno}`
                  : '—';
                const propiedad = contrato.propiedad?.nombre ?? '—';
                return (
                  <tr key={contrato.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="px-4 py-3 font-medium">{inquilino}</td>
                    <td className="px-4 py-3 text-muted-foreground">{propiedad}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {formatearFecha(contrato.fechaInicio)} → {formatearFecha(contrato.fechaFin)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      {formatearMoneda(contrato.rentaMensual)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={cn(
                          'inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border',
                          ESTATUS_COLORES[contrato.estatus],
                        )}
                      >
                        {contrato.estatus}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <Link
                          to={`/contratos/$id`}
                          params={{ id: contrato.id }}
                          className="p-1.5 rounded-md hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
                          title="Ver detalle"
                        >
                          <Eye size={15} />
                        </Link>
                        <button
                          onClick={() => {
                            if (confirm('¿Desactivar este contrato?')) eliminarMutation.mutate(contrato.id);
                          }}
                          className="p-1.5 rounded-md hover:bg-red-50 transition-colors text-muted-foreground hover:text-red-600"
                          title="Desactivar"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function FileTextIcon() {
  return (
    <svg width={48} height={48} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="mx-auto mb-4 opacity-30">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M16 13H8" />
      <path d="M16 17H8" />
      <path d="M10 9H8" />
    </svg>
  );
}
