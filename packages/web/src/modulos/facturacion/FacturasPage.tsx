import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { Plus, Eye, FileSpreadsheet, Filter } from 'lucide-react';
import { facturacionAPI } from '@/services/facturacion.api';
import { cn } from '@/core/ui/cn';
import type {
  EstatusFactura,
  UsoCFDI,
} from '@proyecto-modular/shared/tipos/facturacion';

const ESTATUS_COLORES: Record<EstatusFactura, string> = {
  pendiente: 'bg-amber-100 text-amber-800 border-amber-200',
  timbrada: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  cancelada: 'bg-slate-100 text-slate-600 border-slate-200',
  error: 'bg-red-100 text-red-800 border-red-200',
};

const USO_CFDI_LABELS: Record<UsoCFDI, string> = {
  G03: 'G03 — Gastos en general',
  D01: 'D01 — Honorarios médicos',
  D10: 'D10 — Arrendamiento',
};

const USO_CFDI_COLORES: Record<UsoCFDI, string> = {
  G03: 'bg-purple-100 text-purple-800 border-purple-200',
  D01: 'bg-pink-100 text-pink-800 border-pink-200',
  D10: 'bg-blue-100 text-blue-800 border-blue-200',
};

function formatearFecha(fecha: string): string {
  return new Date(fecha).toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function FacturasPage() {
  const queryClient = useQueryClient();
  const [filtroEstatus, setFiltroEstatus] = useState<EstatusFactura | ''>('');

  const { data: facturas = [], isLoading } = useQuery({
    queryKey: ['facturas', filtroEstatus],
    queryFn: () => facturacionAPI.listar({ estatus: filtroEstatus || undefined }),
  });

  const eliminarMutation = useMutation({
    mutationFn: facturacionAPI.eliminar,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['facturas'] }),
  });

  if (isLoading) return <p className="text-muted-foreground">Cargando facturas…</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Facturación</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {facturas.length} CFDI registrado{facturas.length !== 1 && 's'}
          </p>
        </div>
        <Link
          to="/facturacion/crear"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus size={18} />
          Nueva Factura
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <select
          value={filtroEstatus}
          onChange={(e) => setFiltroEstatus(e.target.value as EstatusFactura | '')}
          className="px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="">Todos los estatus</option>
          <option value="pendiente">Pendientes</option>
          <option value="timbrada">Timbradas</option>
          <option value="cancelada">Canceladas</option>
          <option value="error">Con error</option>
        </select>
        <Filter size={18} className="text-muted-foreground" />
      </div>

      {facturas.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <FileSpreadsheet size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">No hay facturas</p>
          <p className="text-sm mt-1">Crea la primera factura a partir de un recibo pagado.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Serie-Folio</th>
                <th className="text-left px-4 py-3 font-medium">UUID</th>
                <th className="text-left px-4 py-3 font-medium">Uso CFDI</th>
                <th className="text-left px-4 py-3 font-medium">Timbrado</th>
                <th className="text-center px-4 py-3 font-medium">Estatus</th>
                <th className="text-center px-4 py-3 font-medium w-20">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {facturas.map((f) => (
                <tr key={f.id} className="hover:bg-secondary/20 transition-colors">
                  <td className="px-4 py-3 font-mono font-medium">
                    {f.serie}-{f.folio}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground max-w-xs truncate">
                    {f.uuid ?? <span className="italic">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        'inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border',
                        USO_CFDI_COLORES[f.usoCFDI],
                      )}
                      title={USO_CFDI_LABELS[f.usoCFDI]}
                    >
                      {f.usoCFDI}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {f.timbradoEn ? formatearFecha(f.timbradoEn) : '—'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={cn(
                        'inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border',
                        ESTATUS_COLORES[f.estatus],
                      )}
                    >
                      {f.estatus}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <Link
                        to={`/facturacion/$id`}
                        params={{ id: f.id }}
                        className="p-1.5 rounded-md hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
                        title="Ver detalle"
                      >
                        <Eye size={15} />
                      </Link>
                      {f.estatus === 'pendiente' && (
                        <button
                          onClick={() => {
                            if (confirm('¿Eliminar esta factura?'))
                              eliminarMutation.mutate(f.id);
                          }}
                          className="p-1.5 rounded-md hover:bg-red-50 transition-colors text-muted-foreground hover:text-red-600"
                          title="Eliminar"
                        >
                          ×
                        </button>
                      )}
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