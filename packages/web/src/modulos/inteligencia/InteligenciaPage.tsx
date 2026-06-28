import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Sparkles, AlertTriangle, Wrench, FileWarning } from 'lucide-react';
import { inteligenciaAPI } from '@/services/inteligencia.api';
import { ModelosPanel } from './ModelosPanel';
import { RiesgoBadge, ProbabilidadDisplay } from './RiesgoBadge';
import { cn } from '@/core/ui/cn';
import type { FeatureImportance } from '@proyecto-modular/shared/tipos/inteligencia';

type Tab = 'morosidad' | 'vacancia' | 'mantenimiento';

const TABS: Array<{ id: Tab; etiqueta: string; icono: React.ElementType }> = [
  { id: 'morosidad', etiqueta: 'Morosidad', icono: FileWarning },
  { id: 'vacancia', etiqueta: 'Vacancia', icono: AlertTriangle },
  { id: 'mantenimiento', etiqueta: 'Mantenimiento', icono: Wrench },
];

function formatearMoneda(monto: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0,
  }).format(monto);
}

function BarrasImportancia({ items }: { items: FeatureImportance[] | undefined }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="mt-4 space-y-2">
      <p className="text-xs font-medium text-muted-foreground">Importancia de features</p>
      {items.slice(0, 5).map((it) => (
        <div key={it.nombre} className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground w-44 truncate">{it.nombre}</span>
          <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full bg-primary rounded-full"
              style={{ width: `${Math.round(it.importancia * 100)}%` }}
            />
          </div>
          <span className="text-xs tabular-nums w-10 text-right">
            {Math.round(it.importancia * 100)}%
          </span>
        </div>
      ))}
    </div>
  );
}

function DisclaimerBanner() {
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
      <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
      <div className="text-sm text-amber-900">
        <p className="font-medium">Predicciones orientativas</p>
        <p className="text-xs mt-1 text-amber-800">
          Los modelos son baselines entrenados con datos sintéticos en el MVP. Úsalos como
          referencia, no como decisión única. No constituyen asesoría legal ni financiera.
        </p>
      </div>
    </div>
  );
}

export function InteligenciaPage() {
  const [tab, setTab] = useState<Tab>('morosidad');

  const { data: morosidad = [], isLoading: cargandoMor } = useQuery({
    queryKey: ['ia-morosidad'],
    queryFn: () => inteligenciaAPI.morosidadTop(50, 0.5),
    enabled: tab === 'morosidad',
  });

  const { data: vacancia = [], isLoading: cargandoVac } = useQuery({
    queryKey: ['ia-vacancia'],
    queryFn: () => inteligenciaAPI.vacanciaTop(50, 0.5),
    enabled: tab === 'vacancia',
  });

  const { data: mantenimiento = [], isLoading: cargandoMant } = useQuery({
    queryKey: ['ia-mantenimiento'],
    queryFn: () => inteligenciaAPI.mantenimientoTop(50),
    enabled: tab === 'mantenimiento',
  });

  const cargando =
    (tab === 'morosidad' && cargandoMor) ||
    (tab === 'vacancia' && cargandoVac) ||
    (tab === 'mantenimiento' && cargandoMant);

  const featureImportanceTop =
    tab === 'morosidad'
      ? morosidad[0]?.featureImportance
      : tab === 'vacancia'
        ? vacancia[0]?.featureImportance
        : mantenimiento[0]?.featureImportance;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Sparkles size={28} className="text-primary" />
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Inteligencia Artificial</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Predicciones de morosidad, vacancia y costo de mantenimiento
          </p>
        </div>
      </div>

      <DisclaimerBanner />

      <ModelosPanel />

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {TABS.map((t) => {
          const Icono = t.icono;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                'inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px',
                tab === t.id
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              <Icono size={16} />
              {t.etiqueta}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista principal */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          {cargando ? (
            <p className="p-6 text-sm text-muted-foreground">Cargando predicciones…</p>
          ) : tab === 'morosidad' ? (
            <TablaMorosidad items={morosidad} />
          ) : tab === 'vacancia' ? (
            <TablaVacancia items={vacancia} />
          ) : (
            <TablaMantenimiento items={mantenimiento} />
          )}
        </div>

        {/* Panel lateral: feature importance */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm h-fit">
          <h3 className="text-sm font-semibold mb-2">¿Qué predice el modelo?</h3>
          {featureImportanceTop ? (
            <>
              <p className="text-xs text-muted-foreground mb-2">
                Top features que más influyen en la predicción (medido por permutación).
              </p>
              <BarrasImportancia items={featureImportanceTop} />
            </>
          ) : (
            <p className="text-xs text-muted-foreground">
              El modelo aún no está entrenado o no hay datos suficientes. Entrénalo desde el
              panel de arriba.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function TablaMorosidad({ items }: { items: import('@proyecto-modular/shared/tipos/inteligencia').PrediccionMorosidad[] }) {
  if (items.length === 0) {
    return <p className="p-6 text-sm text-muted-foreground">No hay recibos en riesgo.</p>;
  }
  return (
    <table className="w-full text-sm">
      <thead className="bg-secondary/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
        <tr>
          <th className="px-4 py-3">Recibo</th>
          <th className="px-4 py-3">Probabilidad</th>
          <th className="px-4 py-3">Riesgo</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-border">
        {items.map((it) => (
          <tr key={it.reciboId} className="hover:bg-secondary/30">
            <td className="px-4 py-3 font-mono text-xs">{it.reciboId.slice(0, 8)}…</td>
            <td className="px-4 py-3">
              <ProbabilidadDisplay probabilidad={it.probabilidad} />
            </td>
            <td className="px-4 py-3">
              <RiesgoBadge nivel={it.nivelRiesgo} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function TablaVacancia({ items }: { items: import('@proyecto-modular/shared/tipos/inteligencia').PrediccionVacancia[] }) {
  if (items.length === 0) {
    return <p className="p-6 text-sm text-muted-foreground">No hay contratos en riesgo.</p>;
  }
  return (
    <table className="w-full text-sm">
      <thead className="bg-secondary/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
        <tr>
          <th className="px-4 py-3">Contrato</th>
          <th className="px-4 py-3">Probabilidad</th>
          <th className="px-4 py-3">Riesgo</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-border">
        {items.map((it) => (
          <tr key={it.contratoId} className="hover:bg-secondary/30">
            <td className="px-4 py-3 font-mono text-xs">{it.contratoId.slice(0, 8)}…</td>
            <td className="px-4 py-3">
              <ProbabilidadDisplay probabilidad={it.probabilidad} />
            </td>
            <td className="px-4 py-3">
              <RiesgoBadge nivel={it.nivelRiesgo} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function TablaMantenimiento({ items }: { items: import('@proyecto-modular/shared/tipos/inteligencia').PrediccionMantenimiento[] }) {
  if (items.length === 0) {
    return <p className="p-6 text-sm text-muted-foreground">No hay propiedades evaluadas.</p>;
  }
  return (
    <table className="w-full text-sm">
      <thead className="bg-secondary/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
        <tr>
          <th className="px-4 py-3">Propiedad</th>
          <th className="px-4 py-3 text-right">Costo anual esperado</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-border">
        {items.map((it) => (
          <tr key={it.propiedadId} className="hover:bg-secondary/30">
            <td className="px-4 py-3 font-mono text-xs">{it.propiedadId.slice(0, 8)}…</td>
            <td className="px-4 py-3 text-right tabular-nums">
              {it.estadoModelo === 'entrenado'
                ? formatearMoneda(it.valorEstimado)
                : '—'}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}