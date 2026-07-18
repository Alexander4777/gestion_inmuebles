import { useState, useMemo } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { movimientosAPI } from '@/services/movimientos.api';
import { usePropiedadesParaSelecto, useContratosParaSelecto, useFacturasParaSelecto } from '@/services/hooks';
import { Selector } from '@/core/ui/Selector';
import type { MovimientoEntrada } from '@proyecto-modular/shared/esquemas/contabilidad';
import type {
  TipoMovimiento,
  CategoriaIngreso,
  CategoriaGasto,
} from '@proyecto-modular/shared/tipos/contabilidad';

const CATEGORIAS_INGRESO: { value: CategoriaIngreso; label: string }[] = [
  { value: 'renta', label: 'Renta' },
  { value: 'deposito', label: 'Depósito' },
  { value: 'otro-ingreso', label: 'Otro ingreso' },
];

const CATEGORIAS_GASTO: { value: CategoriaGasto; label: string }[] = [
  { value: 'luz', label: 'Luz' },
  { value: 'internet', label: 'Internet' },
  { value: 'predial', label: 'Predial' },
  { value: 'honorarios-administrador', label: 'Honorarios administrador' },
  { value: 'mantenimiento', label: 'Mantenimiento' },
  { value: 'sat', label: 'SAT' },
  { value: 'otro-gasto', label: 'Otro gasto' },
];

function hoyISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function MovimientoCrearPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [tipo, setTipo] = useState<TipoMovimiento>('gasto');
  const [form, setForm] = useState<MovimientoEntrada>({
    tipo: 'gasto',
    categoria: 'luz',
    monto: 0,
    descripcion: '',
    fecha: hoyISO(),
    propiedadId: undefined,
    contratoId: undefined,
    facturaId: undefined,
  });
  const [error, setError] = useState('');

  const { opciones: opcionesProp, isLoading: cargandoProp } = usePropiedadesParaSelecto();
  const { opciones: opcionesContratos, isLoading: cargandoContratos } =
    useContratosParaSelecto();
  const { opciones: opcionesFacturas, isLoading: cargandoFacturas } =
    useFacturasParaSelecto();

  const crearMutation = useMutation({
    mutationFn: movimientosAPI.crear,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movimientos'] });
      navigate({ to: '/contabilidad' });
    },
    onError: (err: Error) => setError(err.message),
  });

  const categoriasDisponibles = useMemo(
    () => (tipo === 'ingreso' ? CATEGORIAS_INGRESO : CATEGORIAS_GASTO),
    [tipo],
  );

  function handleTipoChange(nuevoTipo: TipoMovimiento) {
    setTipo(nuevoTipo);
    // Resetear categoría al primer valor del nuevo tipo
    const nuevaCategoria =
      nuevoTipo === 'ingreso' ? 'renta' : 'luz';
    setForm((prev) => ({ ...prev, tipo: nuevoTipo, categoria: nuevaCategoria }));
  }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]:
        name === 'monto'
          ? Number(value)
          : name === 'propiedadId' || name === 'contratoId' || name === 'facturaId'
            ? value.trim() || undefined
            : value,
    }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    crearMutation.mutate(form);
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate({ to: '/contabilidad' })}
          className="p-2 rounded-lg hover:bg-secondary transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Nuevo Movimiento</h2>
          <p className="text-sm text-muted-foreground mt-1">Registra un ingreso o gasto</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {/* Tipo */}
          <div>
            <label className="block text-sm font-medium mb-1.5">Tipo</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleTipoChange('ingreso')}
                className={`px-4 py-3 rounded-lg border text-sm font-medium transition-colors ${
                  tipo === 'ingreso'
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                    : 'border-border text-muted-foreground hover:bg-secondary'
                }`}
              >
                💰 Ingreso
              </button>
              <button
                type="button"
                onClick={() => handleTipoChange('gasto')}
                className={`px-4 py-3 rounded-lg border text-sm font-medium transition-colors ${
                  tipo === 'gasto'
                    ? 'bg-red-50 border-red-300 text-red-700'
                    : 'border-border text-muted-foreground hover:bg-secondary'
                }`}
              >
                💸 Gasto
              </button>
            </div>
          </div>

          {/* Categoría */}
          <div>
            <label className="block text-sm font-medium mb-1.5">Categoría</label>
            <select
              name="categoria"
              value={form.categoria}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              {categoriasDisponibles.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {/* Monto y Fecha */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Monto (MXN)</label>
              <input
                type="number"
                name="monto"
                value={form.monto}
                onChange={handleChange}
                min="0.01"
                step="0.01"
                required
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Fecha</label>
              <input
                type="date"
                name="fecha"
                value={form.fecha}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium mb-1.5">Descripción</label>
            <textarea
              name="descripcion"
              value={form.descripcion}
              onChange={handleChange}
              required
              rows={3}
              placeholder="Detalle del movimiento…"
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
            />
          </div>

          {/* Referencias opcionales */}
          <details className="rounded-lg border border-border bg-secondary/30 p-4">
            <summary className="text-sm font-medium cursor-pointer">
              Referencias opcionales
            </summary>
            <div className="space-y-3 mt-3">
              <Selector
                etiqueta="Propiedad"
                value={form.propiedadId ?? ''}
                onChange={(v) => setForm((prev) => ({ ...prev, propiedadId: v || undefined }))}
                opciones={opcionesProp}
                isLoading={cargandoProp}
                placeholder="(ninguna)"
                requerido={false}
              />
              <Selector
                etiqueta="Contrato"
                value={form.contratoId ?? ''}
                onChange={(v) => setForm((prev) => ({ ...prev, contratoId: v || undefined }))}
                opciones={opcionesContratos}
                isLoading={cargandoContratos}
                placeholder="(ninguno)"
                requerido={false}
              />
              <Selector
                etiqueta="Factura"
                value={form.facturaId ?? ''}
                onChange={(v) => setForm((prev) => ({ ...prev, facturaId: v || undefined }))}
                opciones={opcionesFacturas}
                isLoading={cargandoFacturas}
                placeholder="(ninguna)"
                requerido={false}
              />
            </div>
          </details>
        </div>

        <div className="flex items-center gap-3 pt-4 border-t border-border">
          <button
            type="submit"
            disabled={crearMutation.isPending}
            className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {crearMutation.isPending ? 'Creando…' : 'Crear Movimiento'}
          </button>
          <button
            type="button"
            onClick={() => navigate({ to: '/contabilidad' })}
            className="px-6 py-2.5 rounded-lg border border-border text-sm hover:bg-secondary transition-colors"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}