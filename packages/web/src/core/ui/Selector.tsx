import { cn } from './cn';

export interface OpcionSelector<TValor extends string = string> {
  value: TValor;
  etiqueta: string;
  descripcion?: string;
  /** Si true, la opción se deshabilita (útil para contratos terminados). */
  deshabilitado?: boolean;
}

interface Props<TValor extends string> {
  etiqueta: string;
  value: TValor | '';
  onChange: (valor: TValor | '') => void;
  opciones: OpcionSelector<TValor>[];
  /** Texto cuando no hay opción seleccionada. Default "Selecciona…" */
  placeholder?: string;
  /** Mensaje cuando opciones.length === 0 (ej. "No hay propiedades"). */
  mensajeVacio?: string;
  isLoading?: boolean;
  /** Si true (default), la opción vacía se renderiza como deshabilitada y no es seleccionable. */
  requerido?: boolean;
  className?: string;
}

/**
 * Select nativo del navegador con búsqueda y soporte para descripción secundaria.
 *
 * Por qué <select> y no combobox custom:
 * - Sin dependencias nuevas (ni cmdk ni Radix Combobox).
 * - Accesible por defecto (lectores de pantalla, teclado).
 * - Suficiente para el dominio actual (cientos de items como máximo).
 * - El navegador provee type-ahead (búsqueda por letra inicial) en el dropdown.
 *
 * Para >1000 opciones se puede migrar a combobox con filtro live sin cambiar los call-sites.
 */
export function Selector<TValor extends string>({
  etiqueta,
  value,
  onChange,
  opciones,
  placeholder = 'Selecciona…',
  mensajeVacio,
  isLoading = false,
  requerido = true,
  className,
}: Props<TValor>) {
  const empty = opciones.length === 0;
  return (
    <div className={className}>
      <label className="block text-sm font-medium mb-1.5">{etiqueta}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as TValor | '')}
        required={requerido}
        disabled={isLoading}
        className={cn(
          'w-full px-3 py-2 rounded-lg border border-border bg-background text-sm',
          'focus:outline-none focus:ring-2 focus:ring-primary/20',
          'disabled:opacity-50 disabled:cursor-not-allowed',
        )}
      >
        {!value && (
          <option value="" disabled>
            {isLoading ? 'Cargando…' : empty && mensajeVacio ? mensajeVacio : placeholder}
          </option>
        )}
        {opciones.map((op) => (
          <option key={op.value} value={op.value} disabled={op.deshabilitado}>
            {op.descripcion ? `${op.etiqueta} — ${op.descripcion}` : op.etiqueta}
          </option>
        ))}
      </select>
      {!isLoading && empty && mensajeVacio && (
        <p className="text-xs text-amber-700 mt-1">{mensajeVacio}</p>
      )}
    </div>
  );
}