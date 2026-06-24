import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { ArrowLeft, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { movimientosAPI } from '@/services/movimientos.api';
import { cn } from '@/core/ui/cn';

const MESES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

function formatearMoneda(monto: number | string): string {
  const n = typeof monto === 'string' ? Number(monto) : monto;
  return n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
}

export function EstadoResultadosPage() {
  const hoy = new Date();
  const [mes, setMes] = useState(hoy.getMonth() + 1);
  const [año, setAño] = useState(hoy.getFullYear());

  const { data: reporte, isLoading } = useQuery({
    queryKey: ['estado-resultados', mes, año],
    queryFn: () => movimientosAPI.estadoResultados(mes, año),
  });

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Link to="/contabilidad" className="p-2 rounded-lg hover:bg-secondary transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Estado de Resultados</h2>
          <p className="text-sm text-muted-foreground mt-1">Resumen financiero mensual</p>
        </div>
      </div>

      {/* Selector de período */}
      <div className="flex items-center gap-3">
        <select
          value={mes}
          onChange={(e) => setMes(Number(e.target.value))}
          className="px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          {MESES.map((nombre, idx) => (
            <option key={idx + 1} value={idx + 1}>
              {nombre}
            </option>
          ))}
        </select>
        <select
          value={año}
          onChange={(e) => setAño(Number(e.target.value))}
          className="px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          {Array.from({ length: 6 }, (_, i) => hoy.getFullYear() - i).map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Calculando…</p>
      ) : reporte ? (
        <>
          {/* Ingresos */}
          <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-4 flex items-center gap-2">
              <TrendingUp size={20} className="text-emerald-700" />
              <h3 className="text-lg font-semibold text-emerald-900">Ingresos</h3>
            </div>
            <div className="divide-y divide-border">
              <FilaReporte etiqueta="Renta" monto={reporte.ingresos.renta} />
              <FilaReporte etiqueta="Depósito" monto={reporte.ingresos.deposito} />
              <FilaReporte etiqueta="Otro" monto={reporte.ingresos.otro} />
              <FilaReporte etiqueta="Total ingresos" monto={reporte.ingresos.total} destacado />
            </div>
          </div>

          {/* Gastos */}
          <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="bg-red-50 border-b border-red-200 px-6 py-4 flex items-center gap-2">
              <TrendingDown size={20} className="text-red-700" />
              <h3 className="text-lg font-semibold text-red-900">Gastos</h3>
            </div>
            <div className="divide-y divide-border">
              <FilaReporte etiqueta="Luz" monto={reporte.gastos.luz} />
              <FilaReporte etiqueta="Internet" monto={reporte.gastos.internet} />
              <FilaReporte etiqueta="Predial" monto={reporte.gastos.predial} />
              <FilaReporte
                etiqueta="Honorarios administrador"
                monto={reporte.gastos.honorariosAdministrador}
              />
              <FilaReporte etiqueta="Mantenimiento" monto={reporte.gastos.mantenimiento} />
              <FilaReporte etiqueta="SAT" monto={reporte.gastos.sat} />
              <FilaReporte etiqueta="Otro" monto={reporte.gastos.otro} />
              <FilaReporte etiqueta="Total gastos" monto={reporte.gastos.total} destacado />
            </div>
          </div>

          {/* Utilidad Neta */}
          <div
            className={cn(
              'rounded-xl border-2 p-8 shadow-sm',
              reporte.utilidadNeta >= 0
                ? 'border-emerald-300 bg-emerald-50'
                : 'border-red-300 bg-red-50',
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Wallet
                  size={32}
                  className={reporte.utilidadNeta >= 0 ? 'text-emerald-700' : 'text-red-700'}
                />
                <div>
                  <p className="text-sm uppercase tracking-wide text-muted-foreground">
                    Utilidad Neta
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {MESES[mes - 1]} {año}
                  </p>
                </div>
              </div>
              <p
                className={cn(
                  'text-4xl font-bold font-mono',
                  reporte.utilidadNeta >= 0 ? 'text-emerald-700' : 'text-red-700',
                )}
              >
                {formatearMoneda(reporte.utilidadNeta)}
              </p>
            </div>
          </div>
        </>
      ) : null}

      <Link
        to="/contabilidad"
        className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
      >
        Ver movimientos del período
      </Link>
    </div>
  );
}

function FilaReporte({
  etiqueta,
  monto,
  destacado = false,
}: {
  etiqueta: string;
  monto: number;
  destacado?: boolean;
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-between px-6 py-3',
        destacado && 'bg-secondary/50 font-semibold',
      )}
    >
      <span className={cn('text-sm', destacado && 'text-foreground')}>{etiqueta}</span>
      <span
        className={cn(
          'font-mono text-sm',
          monto > 0 && !destacado ? 'text-foreground' : 'text-muted-foreground',
          destacado && 'text-base',
        )}
      >
        {formatearMoneda(monto)}
      </span>
    </div>
  );
}