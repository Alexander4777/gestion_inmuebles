import { Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { Sparkles, ArrowRight, AlertCircle, Brain } from 'lucide-react';
import { inteligenciaAPI } from '@/services/inteligencia.api';
import { RiesgoBadge, ProbabilidadDisplay } from '@/modulos/inteligencia/RiesgoBadge';
import { cn } from '@/core/ui/cn';

function formatearMoneda(monto: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0,
  }).format(monto);
}

export function DashboardPage() {
  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['ia-dashboard'],
    queryFn: () => inteligenciaAPI.dashboard(),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-sm text-muted-foreground">Cargando…</p>
      </div>
    );
  }

  const sinEntrenar = dashboard?.estadoGeneral !== 'entrenado';

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>

      {sinEntrenar && dashboard && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
          <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
          <div className="text-sm text-amber-900 flex-1">
            <p className="font-medium">Modelos de IA pendientes de entrenar</p>
            <p className="text-xs mt-1 text-amber-800">
              Las predicciones se muestran como orientativas. Entrena los modelos para obtener
              resultados reales.
            </p>
          </div>
          <Link
            to="/inteligencia"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-amber-600 text-white text-xs font-medium hover:bg-amber-700"
          >
            <Brain size={14} />
            Ir a entrenar
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <WidgetResumenIA
          titulo="Recibos en riesgo"
          valor={dashboard?.totalRecibosEnRiesgo ?? 0}
          descripcion="Morosidad predicha"
          to="/inteligencia"
          tab="morosidad"
        />
        <WidgetResumenIA
          titulo="Contratos en riesgo"
          valor={dashboard?.totalContratosEnRiesgo ?? 0}
          descripcion="Terminación anticipada"
          to="/inteligencia"
          tab="vacancia"
        />
        <WidgetResumenIA
          titulo="Propiedades"
          valor={dashboard?.totalPropiedadesEnMantenimientoAlto ?? 0}
          descripcion="Con mantenimiento alto previsto"
          to="/inteligencia"
          tab="mantenimiento"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <PanelTop
          titulo="Top morosidad"
          items={(dashboard?.topMorosidad ?? []).map((p) => ({
            id: p.reciboId,
            linea1: `Recibo ${p.reciboId.slice(0, 8)}`,
            linea2: (
              <ProbabilidadDisplay probabilidad={p.probabilidad} className="justify-end" />
            ),
            badge: <RiesgoBadge nivel={p.nivelRiesgo} />,
          }))}
          sinDatos="Sin recibos pendientes en riesgo."
        />
        <PanelTop
          titulo="Top vacancia"
          items={(dashboard?.topVacancia ?? []).map((p) => ({
            id: p.contratoId,
            linea1: `Contrato ${p.contratoId.slice(0, 8)}`,
            linea2: (
              <ProbabilidadDisplay probabilidad={p.probabilidad} className="justify-end" />
            ),
            badge: <RiesgoBadge nivel={p.nivelRiesgo} />,
          }))}
          sinDatos="Sin contratos vigentes en riesgo."
        />
        <PanelTop
          titulo="Top mantenimiento"
          items={(dashboard?.topMantenimiento ?? []).map((p) => ({
            id: p.propiedadId,
            linea1: `Propiedad ${p.propiedadId.slice(0, 8)}`,
            linea2: (
              <span className="text-sm tabular-nums">
                {p.estadoModelo === 'entrenado' ? formatearMoneda(p.valorEstimado) : '—'}
              </span>
            ),
          }))}
          sinDatos="Sin propiedades evaluadas."
        />
      </div>
    </div>
  );
}

function WidgetResumenIA({
  titulo,
  valor,
  descripcion,
  to,
  tab,
}: {
  titulo: string;
  valor: number;
  descripcion: string;
  to: string;
  tab: string;
}) {
  return (
    <Link
      to={to}
      search={{ tab }}
      className="rounded-xl border border-border bg-card p-5 shadow-sm hover:shadow-md hover:border-primary/30 transition-all group"
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Sparkles size={12} className="text-primary" />
            {titulo}
          </div>
          <p className="text-3xl font-bold mt-2 tabular-nums">{valor}</p>
          <p className="text-xs text-muted-foreground mt-1">{descripcion}</p>
        </div>
        <ArrowRight
          size={16}
          className="text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all"
        />
      </div>
    </Link>
  );
}

function PanelTop({
  titulo,
  items,
  sinDatos,
}: {
  titulo: string;
  items: Array<{ id: string; linea1: string; linea2: React.ReactNode; badge?: React.ReactNode }>;
  sinDatos: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">{titulo}</h3>
        <Link
          to="/inteligencia"
          className="text-xs text-primary hover:underline inline-flex items-center gap-1"
        >
          Ver detalle <ArrowRight size={12} />
        </Link>
      </div>
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground py-4">{sinDatos}</p>
      ) : (
        <ul className="space-y-2">
          {items.slice(0, 5).map((it) => (
            <li
              key={it.id}
              className={cn(
                'flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/40 transition-colors',
              )}
            >
              <div className="flex-1 min-w-0">
                <p className="text-xs font-mono truncate">{it.linea1}</p>
              </div>
              {it.linea2}
              {it.badge}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}