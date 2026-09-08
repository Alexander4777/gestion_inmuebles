import { useQuery } from '@tanstack/react-query';
import { Building2, Home } from 'lucide-react';
import { portalAPI } from '@/services/portal.api';
import { cn } from '@/core/ui/cn';
import type { EstatusContrato } from '@proyecto-modular/shared/tipos/contratos';

const ESTATUS_COLORES: Record<EstatusContrato, string> = {
  vigente: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  'proximo-a-vencer': 'bg-amber-100 text-amber-800 border-amber-200',
  vencido: 'bg-red-100 text-red-800 border-red-200',
  terminado: 'bg-slate-100 text-slate-600 border-slate-200',
  cancelado: 'bg-slate-100 text-slate-600 border-slate-200',
};

const ESTATUS_ETIQUETA: Record<EstatusContrato, string> = {
  vigente: 'Vigente',
  'proximo-a-vencer': 'Próximo a vencer',
  vencido: 'Vencido',
  terminado: 'Terminado',
  cancelado: 'Cancelado',
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

export function MiContratoPage() {
  const { data: contrato, isLoading, error } = useQuery({
    queryKey: ['portal', 'mi-contrato'],
    queryFn: () => portalAPI.obtenerMiContrato(),
  });

  if (isLoading) {
    return <p className="text-muted-foreground">Cargando tu contrato…</p>;
  }

  if (error || !contrato) {
    return (
      <div className="text-center py-16">
        <p className="text-lg font-medium text-red-600">No se pudo cargar tu contrato</p>
        <p className="text-sm text-muted-foreground mt-2">
          {(error as Error | undefined)?.message ?? 'Intenta de nuevo más tarde.'}
        </p>
      </div>
    );
  }

  const nombreInquilino = contrato.inquilino
    ? `${contrato.inquilino.nombre} ${contrato.inquilino.apellidoPaterno} ${contrato.inquilino.apellidoMaterno}`
    : '';

  return (
    <div className="space-y-6">
      {/* ── Saludo ───────────────────────────────────────────────────────────── */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Mi Contrato</h2>
        {nombreInquilino && (
          <p className="text-sm text-muted-foreground mt-1">Hola, {nombreInquilino}.</p>
        )}
      </div>

      {/* ── Estado del contrato ─────────────────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">Estado del contrato</p>
          <span
            className={cn(
              'inline-flex px-3 py-1 rounded-full text-xs font-medium border',
              ESTATUS_COLORES[contrato.estatus],
            )}
          >
            {ESTATUS_ETIQUETA[contrato.estatus]}
          </span>
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

      {/* ── Datos del contrato ──────────────────────────────────────────────── */}
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
            <p className="text-muted-foreground">Periodicidad de Pago</p>
            <p className="font-medium capitalize">{contrato.periodicidadPago}</p>
          </div>
        </div>
      </div>

      {/* ── Propiedad arrendada ────────────────────────────────────────────── */}
      {contrato.propiedad && (
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Building2 size={18} />
            Propiedad arrendada
          </h3>
          <div className="space-y-2">
            <p className="text-xl font-semibold">{contrato.propiedad.nombre}</p>
            <div className="text-sm text-muted-foreground space-y-0.5">
              <p>
                <Home size={12} className="inline mr-1" />
                {contrato.propiedad.direccion.calle} {contrato.propiedad.direccion.numero},{' '}
                {contrato.propiedad.direccion.colonia}
              </p>
              <p>
                C.P. {contrato.propiedad.direccion.codigoPostal} —{' '}
                {contrato.propiedad.direccion.ciudad}, {contrato.propiedad.direccion.estado}
              </p>
              <p className="capitalize pt-1">Tipo: {contrato.propiedad.tipo}</p>
            </div>
          </div>
        </div>
      )}

      <p className="text-xs text-muted-foreground text-center pt-4">
        Esta es una vista de solo lectura. Para cualquier modificación contacta a tu arrendador.
      </p>
    </div>
  );
}