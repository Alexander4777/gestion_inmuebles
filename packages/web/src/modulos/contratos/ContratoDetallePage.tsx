import { useParams, Link } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle2, Ban } from 'lucide-react';
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
  return new Date(fecha + 'T00:00:00').toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
}

export function ContratoDetallePage() {
  const { id } = useParams({ strict: false }) as { id: string };
  const queryClient = useQueryClient();

  const { data: contrato, isLoading, error } = useQuery({
    queryKey: ['contratos', id],
    queryFn: () => contratosAPI.obtener(id),
  });

  const terminar = useMutation({
    mutationFn: () => contratosAPI.actualizar(id, { estatus: 'terminado' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['contratos'] }),
  });

  const cancelar = useMutation({
    mutationFn: () => contratosAPI.actualizar(id, { estatus: 'cancelado' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['contratos'] }),
  });

  if (isLoading) return <p className="text-muted-foreground">Cargando contrato…</p>;
  if (error || !contrato)
    return (
      <div className="text-center py-16">
        <p className="text-lg font-medium text-red-600">Contrato no encontrado</p>
        <Link to="/contratos" className="text-sm text-primary hover:underline mt-2 inline-block">
          Volver a la lista
        </Link>
      </div>
    );

  const esModificable = contrato.estatus !== 'terminado' && contrato.estatus !== 'cancelado';
  const nombreInquilino = contrato.inquilino
    ? `${contrato.inquilino.nombre} ${contrato.inquilino.apellidoPaterno} ${contrato.inquilino.apellidoMaterno}`
    : '—';

  return (
    <div className="space-y-6 max-w-3xl">
      {/* ── Encabezado ──────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-4">
        <Link to="/contratos" className="p-2 rounded-lg hover:bg-secondary transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold tracking-tight">Contrato</h2>
            <span
              className={cn(
                'inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border',
                ESTATUS_COLORES[contrato.estatus],
              )}
            >
              {contrato.estatus}
            </span>
            {!contrato.activo && (
              <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border bg-slate-50 text-slate-500 border-slate-200">
                inactivo
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1 font-mono text-xs">{contrato.id}</p>
        </div>
      </div>

      {/* ── Resumen financiero ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Renta Mensual</p>
          <p className="text-2xl font-bold mt-1 font-mono">{formatearMoneda(contrato.rentaMensual)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Depósito</p>
          <p className="text-2xl font-bold mt-1 font-mono">{formatearMoneda(contrato.deposito)}</p>
        </div>
      </div>

      {/* ── Datos del contrato ───────────────────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
        <h3 className="text-lg font-semibold">Información del contrato</h3>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Fecha de Inicio</p>
            <p className="font-medium">{formatearFecha(contrato.fechaInicio)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Fecha de Fin</p>
            <p className="font-medium">{formatearFecha(contrato.fechaFin)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Periodicidad</p>
            <p className="font-medium capitalize">{contrato.periodicidadPago}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Estatus</p>
            <p className="font-medium capitalize">{contrato.estatus}</p>
          </div>
        </div>
      </div>

      {/* ── Partes vinculadas ────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
        <h3 className="text-lg font-semibold">Partes</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Inquilino</p>
            <p className="font-medium">{nombreInquilino}</p>
            {contrato.inquilino?.telefono && (
              <p className="text-xs text-muted-foreground mt-0.5">{contrato.inquilino.telefono}</p>
            )}
            {contrato.inquilino?.correo && (
              <p className="text-xs text-muted-foreground">{contrato.inquilino.correo}</p>
            )}
          </div>
          <div>
            <p className="text-muted-foreground">Propiedad</p>
            <p className="font-medium">{contrato.propiedad?.nombre ?? '—'}</p>
            {contrato.propiedad?.direccion && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {contrato.propiedad.direccion.calle} {contrato.propiedad.direccion.numero},{' '}
                {contrato.propiedad.direccion.colonia}
              </p>
            )}
            {contrato.propiedad?.direccion && (
              <p className="text-xs text-muted-foreground">
                {contrato.propiedad.direccion.ciudad}, {contrato.propiedad.direccion.estado}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Acciones ─────────────────────────────────────────────────────────── */}
      {esModificable && contrato.activo && (
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={() => {
              if (confirm('¿Marcar este contrato como terminado?')) terminar.mutate();
            }}
            disabled={terminar.isPending}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
          >
            <CheckCircle2 size={18} />
            {terminar.isPending ? 'Procesando…' : 'Terminar Contrato'}
          </button>
          <button
            onClick={() => {
              if (confirm('¿Cancelar este contrato?')) cancelar.mutate();
            }}
            disabled={cancelar.isPending}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-border text-sm hover:bg-secondary transition-colors disabled:opacity-50"
          >
            <Ban size={18} />
            Cancelar Contrato
          </button>
        </div>
      )}
    </div>
  );
}
