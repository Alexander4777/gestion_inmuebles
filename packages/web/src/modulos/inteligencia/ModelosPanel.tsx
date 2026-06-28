import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Brain, RefreshCw, AlertCircle } from 'lucide-react';
import { inteligenciaAPI } from '@/services/inteligencia.api';
import type { ModeloInfo } from '@proyecto-modular/shared/tipos/inteligencia';

const NOMBRES: Record<string, string> = {
  morosidad: 'Morosidad (recibos)',
  vacancia: 'Vacancia (contratos)',
  mantenimiento: 'Mantenimiento (propiedades)',
};

const ESTADO_COLORES: Record<string, string> = {
  entrenado: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  'no-entrenado': 'bg-amber-100 text-amber-800 border-amber-200',
  'sin-datos': 'bg-red-100 text-red-800 border-red-200',
};

function formatearMetrica(m: ModeloInfo['metricas']): string {
  if (!m) return '—';
  const principal = m.principal;
  const pct = Math.round(principal * 100);
  return `${pct}% ${m.principalNombre} (n=${m.nPrueba})`;
}

export function ModelosPanel() {
  const queryClient = useQueryClient();
  const { data: modelos = [], isLoading } = useQuery({
    queryKey: ['ia-modelos'],
    queryFn: () => inteligenciaAPI.modelos(),
  });

  const entrenarMutation = useMutation({
    mutationFn: (nombre: 'morosidad' | 'vacancia' | 'mantenimiento') =>
      inteligenciaAPI.entrenar(nombre),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ia-modelos'] });
      queryClient.invalidateQueries({ queryKey: ['ia-dashboard'] });
    },
  });

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Cargando modelos…</p>;
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Brain size={20} className="text-primary" />
        <h3 className="text-lg font-semibold">Modelos predictivos</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {modelos.map((m) => (
          <div key={m.nombre} className="rounded-lg border border-border p-4 space-y-2">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium text-sm">{NOMBRES[m.nombre] ?? m.nombre}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  v{m.version ?? '—'} · {m.muestrasDisponibles} muestras
                </p>
              </div>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${ESTADO_COLORES[m.estado] ?? ''}`}
              >
                {m.estado}
              </span>
            </div>

            {m.estado === 'entrenado' && m.metricas && (
              <p className="text-xs text-muted-foreground">
                {formatearMetrica(m.metricas)}
              </p>
            )}

            {m.estado === 'sin-datos' && (
              <p className="text-xs text-muted-foreground flex items-start gap-1">
                <AlertCircle size={12} className="mt-0.5 shrink-0" />
                <span>Datos insuficientes (mínimo 30 muestras).</span>
              </p>
            )}

            <button
              type="button"
              onClick={() => entrenarMutation.mutate(m.nombre)}
              disabled={entrenarMutation.isPending}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-secondary hover:bg-secondary/80 text-xs font-medium transition-colors disabled:opacity-50"
            >
              <RefreshCw size={12} className={entrenarMutation.isPending ? 'animate-spin' : ''} />
              Reentrenar
            </button>
          </div>
        ))}
      </div>

      {entrenarMutation.error && (
        <p className="text-xs text-red-600 mt-3">
          Error al entrenar: {(entrenarMutation.error as Error).message}
        </p>
      )}
    </div>
  );
}