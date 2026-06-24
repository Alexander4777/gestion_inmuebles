import { useParams, Link, useNavigate } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, FileSpreadsheet, CheckCircle2, Ban, Trash2 } from 'lucide-react';
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

function formatearFecha(fecha: string): string {
  return new Date(fecha).toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatearFechaHora(fecha: string): string {
  return new Date(fecha).toLocaleString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function FacturaDetallePage() {
  const { id } = useParams({ strict: false }) as { id: string };
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: factura, isLoading, error } = useQuery({
    queryKey: ['facturas', id],
    queryFn: () => facturacionAPI.obtener(id),
  });

  const timbrarMutation = useMutation({
    mutationFn: facturacionAPI.timbrar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facturas'] });
    },
    onError: (err: Error) => alert(err.message),
  });

  const cancelarMutation = useMutation({
    mutationFn: ({ id, motivo }: { id: string; motivo: string }) =>
      facturacionAPI.cancelar(id, { motivo }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facturas'] });
    },
    onError: (err: Error) => alert(err.message),
  });

  const eliminarMutation = useMutation({
    mutationFn: facturacionAPI.eliminar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facturas'] });
      navigate({ to: '/facturacion' });
    },
    onError: (err: Error) => alert(err.message),
  });

  if (isLoading) return <p className="text-muted-foreground">Cargando factura…</p>;
  if (error || !factura)
    return (
      <div className="text-center py-16">
        <p className="text-lg font-medium text-red-600">Factura no encontrada</p>
        <Link to="/facturacion" className="text-sm text-primary hover:underline mt-2 inline-block">
          Volver a la lista
        </Link>
      </div>
    );

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <Link to="/facturacion" className="p-2 rounded-lg hover:bg-secondary transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <FileSpreadsheet size={28} className="text-muted-foreground" />
            <h2 className="text-2xl font-bold tracking-tight">CFDI</h2>
            <span
              className={cn(
                'inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border',
                ESTATUS_COLORES[factura.estatus],
              )}
            >
              {factura.estatus}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1 font-mono text-xs">{factura.id}</p>
        </div>
      </div>

      {/* Identificación */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-baseline justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Folio</p>
            <p className="text-3xl font-bold font-mono mt-1">
              {factura.serie}-{factura.folio}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Uso CFDI</p>
            <p className="text-lg font-medium mt-1">{USO_CFDI_LABELS[factura.usoCFDI]}</p>
          </div>
        </div>
      </div>

      {/* UUID / Folio Fiscal — sólo si timbrada */}
      {factura.uuid && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-6 shadow-sm space-y-3">
          <h3 className="text-sm font-semibold text-emerald-900 uppercase tracking-wide">
            Datos SAT
          </h3>
          <div>
            <p className="text-xs text-muted-foreground">UUID</p>
            <p className="font-mono text-sm break-all">{factura.uuid}</p>
          </div>
          {factura.folioFiscal && (
            <div>
              <p className="text-xs text-muted-foreground">Folio Fiscal</p>
              <p className="font-mono text-sm">{factura.folioFiscal}</p>
            </div>
          )}
        </div>
      )}

      {/* Fechas */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide">Fechas</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Creado</p>
            <p className="font-medium">{formatearFecha(factura.creadoEn)}</p>
          </div>
          {factura.timbradoEn && (
            <div>
              <p className="text-xs text-muted-foreground">Timbrado</p>
              <p className="font-medium">{formatearFechaHora(factura.timbradoEn)}</p>
            </div>
          )}
          {factura.canceladoEn && (
            <div>
              <p className="text-xs text-muted-foreground">Cancelado</p>
              <p className="font-medium text-red-600">
                {formatearFechaHora(factura.canceladoEn)}
              </p>
            </div>
          )}
        </div>
        <div>
          <p className="text-xs text-muted-foreground">ID del Recibo</p>
          <p className="font-mono text-xs">{factura.reciboId}</p>
        </div>
      </div>

      {/* Acciones contextuales */}
      <div className="flex items-center gap-3 pt-2 flex-wrap">
        {factura.estatus === 'pendiente' && (
          <>
            <button
              onClick={() => {
                if (confirm('¿Timbrar este CFDI? Esta acción no se puede deshacer.'))
                  timbrarMutation.mutate(factura.id);
              }}
              disabled={timbrarMutation.isPending}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
            >
              <CheckCircle2 size={18} />
              {timbrarMutation.isPending ? 'Timbrando…' : 'Timbrar'}
            </button>
            <button
              onClick={() => {
                if (confirm('¿Eliminar esta factura pendiente?'))
                  eliminarMutation.mutate(factura.id);
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-red-200 text-red-600 text-sm hover:bg-red-50 transition-colors"
            >
              <Trash2 size={18} />
              Eliminar
            </button>
          </>
        )}
        {factura.estatus === 'timbrada' && (
          <button
            onClick={() => {
              const motivo = prompt('Motivo de cancelación:');
              if (motivo && motivo.trim()) {
                cancelarMutation.mutate({ id: factura.id, motivo: motivo.trim() });
              }
            }}
            disabled={cancelarMutation.isPending}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-red-200 text-red-600 text-sm hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            <Ban size={18} />
            {cancelarMutation.isPending ? 'Cancelando…' : 'Cancelar CFDI'}
          </button>
        )}
        {factura.estatus === 'cancelada' && (
          <p className="text-sm text-muted-foreground italic">
            Esta factura está cancelada. No se puede modificar.
          </p>
        )}
      </div>
    </div>
  );
}