import { cn } from '@/core/ui/cn';
import type { NivelRiesgo } from '@proyecto-modular/shared/tipos/inteligencia';

const COLORES: Record<NivelRiesgo, string> = {
  bajo: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  medio: 'bg-amber-100 text-amber-800 border-amber-200',
  alto: 'bg-red-100 text-red-800 border-red-200',
  'sin-datos': 'bg-slate-100 text-slate-500 border-slate-200',
};

const ETIQUETAS: Record<NivelRiesgo, string> = {
  bajo: 'Bajo',
  medio: 'Medio',
  alto: 'Alto',
  'sin-datos': 'Sin datos',
};

interface Props {
  nivel: NivelRiesgo;
  className?: string;
}

export function RiesgoBadge({ nivel, className }: Props) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border',
        COLORES[nivel],
        className,
      )}
    >
      {ETIQUETAS[nivel]}
    </span>
  );
}

interface ProbabilidadProps {
  probabilidad: number;
  className?: string;
}

export function ProbabilidadDisplay({ probabilidad, className }: ProbabilidadProps) {
  const pct = Math.round(probabilidad * 100);
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="w-16 h-2 rounded-full bg-secondary overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all',
            pct >= 70 ? 'bg-red-500' : pct >= 50 ? 'bg-amber-500' : 'bg-emerald-500',
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs tabular-nums text-muted-foreground w-9 text-right">{pct}%</span>
    </div>
  );
}