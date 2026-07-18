import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { mantenimientosAPI } from '@/services/mantenimientos.api';
import { usePropiedadesParaSelecto } from '@/services/hooks';
import { Selector } from '@/core/ui/Selector';
import type { MantenimientoEntrada } from '@proyecto-modular/shared/esquemas/mantenimiento';
import type { CategoriaMantenimiento } from '@proyecto-modular/shared/tipos/mantenimiento';

const CATEGORIAS: { value: CategoriaMantenimiento; label: string }[] = [
  { value: 'electricidad', label: 'Electricidad' },
  { value: 'fontaneria', label: 'Fontanería' },
  { value: 'carpinteria', label: 'Carpintería' },
  { value: 'albañileria', label: 'Albañilería' },
  { value: 'materiales', label: 'Materiales' },
  { value: 'otro', label: 'Otro' },
];

export function MantenimientoCrearPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [form, setForm] = useState<MantenimientoEntrada>({
    propiedadId: '',
    categoria: 'otro',
    descripcion: '',
    costo: 0,
    reportadoPor: '',
  });

  const [error, setError] = useState('');

  const { opciones: opcionesProp, isLoading: cargandoProp } = usePropiedadesParaSelecto();

  const crearMutation = useMutation({
    mutationFn: mantenimientosAPI.crear,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mantenimientos'] });
      navigate({ to: '/mantenimientos' });
    },
    onError: (err: Error) => setError(err.message),
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === 'costo' ? Number(value) : value,
    }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const entrada: MantenimientoEntrada = {
      ...form,
      reportadoPor: form.reportadoPor?.trim() || undefined,
    };
    crearMutation.mutate(entrada);
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate({ to: '/mantenimientos' })}
          className="p-2 rounded-lg hover:bg-secondary transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Nueva Solicitud de Mantenimiento</h2>
          <p className="text-sm text-muted-foreground mt-1">Registra una nueva solicitud</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <Selector
            etiqueta="Propiedad"
            value={form.propiedadId}
            onChange={(v) => setForm({ ...form, propiedadId: v })}
            opciones={opcionesProp}
            isLoading={cargandoProp}
            placeholder="Selecciona una propiedad…"
            mensajeVacio="No hay propiedades activas. Crea una primero."
          />

          <div>
            <label className="block text-sm font-medium mb-1.5">Categoría</label>
            <select
              name="categoria"
              value={form.categoria}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              {CATEGORIAS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Descripción</label>
            <textarea
              name="descripcion"
              value={form.descripcion}
              onChange={handleChange}
              required
              rows={4}
              placeholder="Describe el problema o trabajo a realizar…"
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Costo (estimado)</label>
              <input
                type="number"
                name="costo"
                value={form.costo}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Reportado por</label>
              <input
                type="text"
                name="reportadoPor"
                value={form.reportadoPor ?? ''}
                onChange={handleChange}
                placeholder="Nombre del reportante"
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-4 border-t border-border">
          <button
            type="submit"
            disabled={crearMutation.isPending}
            className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {crearMutation.isPending ? 'Creando…' : 'Crear Solicitud'}
          </button>
          <button
            type="button"
            onClick={() => navigate({ to: '/mantenimientos' })}
            className="px-6 py-2.5 rounded-lg border border-border text-sm hover:bg-secondary transition-colors"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
