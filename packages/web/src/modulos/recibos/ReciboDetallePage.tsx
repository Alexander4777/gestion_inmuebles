import { useParams, Link } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle2, XCircle } from 'lucide-react';
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

function formatearFecha(fecha: string): string {
  return new Date(fecha + 'T00:00:00').toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function ReciboDetallePage() {
  const { id } = useParams({ strict: false }) as { id: string };
  const queryClient = useQueryClient();

  const { data: recibo, isLoading, error } = useQuery({
    queryKey: ['recibos', id],
    queryFn: () => recibosAPI.obtener(id),
  });

  const marcarPagado = useMutation({
    mutationFn: () => recibosAPI.actualizar(id, { estatus: 'pagado' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['recibos'] }),
  });

  const cancelar = useMutation({
    mutationFn: () => recibosAPI.actualizar(id, { estatus: 'cancelado' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['recibos'] }),
  });

  if (isLoading) return <p className="text-muted-foreground">Cargando recibo…</p>;
  if (error || !recibo)
    return (
      <div className="text-center py-16">
        <p className="text-lg font-medium text-red-600">Recibo no encontrado</p>
        <Link to="/recibos" className="text-sm text-primary hover:underline mt-2 inline-block">
          Volver a la lista
        </Link>
      </div>
    );

  const esPendiente = recibo.estatus === 'pendiente';

  return (
    <div className="space-y-6 max-w-3xl">
      {/* ── Encabezado ────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-4">
        <Link to="/recibos" className="p-2 rounded-lg hover:bg-secondary transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-bold tracking-tight">{recibo.numeroRecibo}</h2>
            <span
              className={cn(
                'inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border',
                ESTATUS_COLORES[recibo.estatus] ?? 'bg-slate-100 text-slate-600',
              )}
            >
              {recibo.estatus}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">Detalle del recibo</p>
        </div>
      </div>

      {/* ── Resumen financiero ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Renta</p>
          <p className="text-2xl font-bold mt-1 font-mono">{formatearMoneda(recibo.renta)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Otros Cobros</p>
          <p className="text-2xl font-bold mt-1 font-mono">{formatearMoneda(recibo.otrosCobros)}</p>
        </div>
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-5 shadow-sm">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Total</p>
          <p className="text-2xl font-bold mt-1 font-mono text-primary">{formatearMoneda(recibo.total)}</p>
        </div>
      </div>

      {/* ── Detalles ──────────────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
        <h3 className="text-lg font-semibold">Información del recibo</h3>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Periodo</p>
            <p className="font-medium">
              {formatearFecha(recibo.periodoInicio)} → {formatearFecha(recibo.periodoFin)}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Fecha límite de pago</p>
            <p className="font-medium">{formatearFecha(recibo.fechaLimitePago)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">ID Contrato</p>
            <p className="font-medium font-mono text-xs">{recibo.contratoId}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Factura</p>
            <p className="font-medium">{recibo.facturaId ? recibo.facturaId : 'Sin factura'}</p>
          </div>
          {recibo.pagadoEn && (
            <div>
              <p className="text-muted-foreground">Pagado el</p>
              <p className="font-medium">{new Date(recibo.pagadoEn).toLocaleDateString('es-MX')}</p>
            </div>
          )}
        </div>

        {/* ── Desglose ──────────────────────────────────────────────────────── */}
        {'desglose' in recibo && (recibo as any).desglose?.length > 0 && (
          <div className="pt-3 border-t border-border">
            <h4 className="text-sm font-semibold mb-2">Desglose de cobros</h4>
            <div className="space-y-1.5">
              {(recibo as any).desglose.map((item: { descripcion: string; monto: number }, i: number) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{item.descripcion}</span>
                  <span className="font-mono">{formatearMoneda(item.monto)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Datos del contrato e inquilino (si vienen del join) ────────────────── */}
      {('contrato' in recibo || 'inquilino' in recibo || 'propiedad' in recibo) && (
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
          <h3 className="text-lg font-semibold">Vinculado a</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            {(recibo as any).propiedad && (
              <div>
                <p className="text-muted-foreground">Propiedad</p>
                <p className="font-medium">{(recibo as any).propiedad.nombre}</p>
              </div>
            )}
            {(recibo as any).inquilino && (
              <div>
                <p className="text-muted-foreground">Inquilino</p>
                <p className="font-medium">
                  {(recibo as any).inquilino.nombre} {(recibo as any).inquilino.apellidoPaterno}
                </p>
              </div>
            )}
            {(recibo as any).contrato && (
              <div>
                <p className="text-muted-foreground">Contrato</p>
                <p className="font-medium">Renta: {formatearMoneda((recibo as any).contrato.rentaMensual)} / mes</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Acciones ──────────────────────────────────────────────────────────── */}
      {esPendiente && (
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={() => {
              if (confirm('¿Marcar como pagado?')) marcarPagado.mutate();
            }}
            disabled={marcarPagado.isPending}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
          >
            <CheckCircle2 size={18} />
            {marcarPagado.isPending ? 'Procesando…' : 'Marcar como Pagado'}
          </button>
          <button
            onClick={() => {
              if (confirm('¿Cancelar este recibo?')) cancelar.mutate();
            }}
            disabled={cancelar.isPending}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-border text-sm hover:bg-secondary transition-colors disabled:opacity-50"
          >
            <XCircle size={18} />
            Cancelar Recibo
          </button>
        </div>
      )}
    </div>
  );
}
