import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { recibosAPI } from '@/services/recibos.api';
import { useContratosParaSelecto } from '@/services/hooks';
import { Selector } from '@/core/ui/Selector';
import type { ReciboEntrada } from '@proyecto-modular/shared/esquemas/recibos';

export function ReciboCrearPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    contratoId: '',
    periodoInicio: '',
    periodoFin: '',
    fechaLimitePago: '',
    renta: '',
    otrosCobros: '0',
  });

  const [desglose, setDesglose] = useState<{ descripcion: string; monto: string }[]>([]);
  const [error, setError] = useState('');

  const { opciones: opcionesContratos, isLoading: cargandoContratos } =
    useContratosParaSelecto();

  const crearMutation = useMutation({
    mutationFn: recibosAPI.crear,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recibos'] });
      navigate({ to: '/recibos' });
    },
    onError: (err: Error) => setError(err.message),
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const entrada: ReciboEntrada = {
      contratoId: formData.contratoId,
      periodoInicio: formData.periodoInicio,
      periodoFin: formData.periodoFin,
      fechaLimitePago: formData.fechaLimitePago,
      renta: Number(formData.renta),
      otrosCobros: Number(formData.otrosCobros),
      desglose: desglose
        .filter((d) => d.descripcion && d.monto)
        .map((d) => ({ descripcion: d.descripcion!, monto: Number(d.monto!) })),
    };

    crearMutation.mutate(entrada);
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* ── Encabezado ────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate({ to: '/recibos' })}
          className="p-2 rounded-lg hover:bg-secondary transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Nuevo Recibo</h2>
          <p className="text-sm text-muted-foreground mt-1">Completa los datos para generar un nuevo recibo</p>
        </div>
      </div>

      {/* ── Formulario ────────────────────────────────────────────────────────── */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
        )}

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Datos del recibo</h3>

          <div className="grid grid-cols-1 gap-4">
            <Selector
              etiqueta="Contrato"
              value={formData.contratoId}
              onChange={(v) => setFormData((prev) => ({ ...prev, contratoId: v }))}
              opciones={opcionesContratos}
              isLoading={cargandoContratos}
              placeholder="Selecciona un contrato…"
              mensajeVacio="No hay contratos registrados."
            />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Periodo Inicio</label>
                <input
                  type="date"
                  name="periodoInicio"
                  value={formData.periodoInicio}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Periodo Fin</label>
                <input
                  type="date"
                  name="periodoFin"
                  value={formData.periodoFin}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Fecha Límite de Pago</label>
              <input
                type="date"
                name="fechaLimitePago"
                value={formData.fechaLimitePago}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <h3 className="text-lg font-semibold pt-2">Montos</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Renta</label>
                <input
                  type="number"
                  name="renta"
                  value={formData.renta}
                  onChange={handleChange}
                  placeholder="0.00"
                  min="0.01"
                  step="0.01"
                  required
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Otros Cobros</label>
                <input
                  type="number"
                  name="otrosCobros"
                  value={formData.otrosCobros}
                  onChange={handleChange}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            {/* ── Desglose ──────────────────────────────────────────────────── */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold">Desglose de otros cobros</h3>
                <button
                  type="button"
                  onClick={() => setDesglose([...desglose, { descripcion: '', monto: '' }])}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border text-sm hover:bg-secondary transition-colors"
                >
                  <Plus size={14} />
                  Agregar concepto
                </button>
              </div>

              {desglose.length === 0 && (
                <p className="text-sm text-muted-foreground py-2">Sin conceptos adicionales</p>
              )}

              <div className="space-y-2">
                {desglose.map((concepto, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Descripción (ej: Internet)"
                      value={concepto.descripcion}
                      onChange={(e) => {
                        const nuevo = [...desglose];
                        nuevo[i] = { descripcion: e.target.value, monto: nuevo[i]!.monto };
                        setDesglose(nuevo);
                      }}
                      className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <input
                      type="number"
                      placeholder="0.00"
                      value={concepto.monto}
                      onChange={(e) => {
                        const nuevo = [...desglose];
                        nuevo[i] = { descripcion: nuevo[i]!.descripcion, monto: e.target.value };
                        setDesglose(nuevo);
                      }}
                      min="0"
                      step="0.01"
                      className="w-28 px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <button
                      type="button"
                      onClick={() => setDesglose(desglose.filter((_, j) => j !== i))}
                      className="p-2 rounded-md hover:bg-red-50 text-muted-foreground hover:text-red-600 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-4 border-t border-border">
          <button
            type="submit"
            disabled={crearMutation.isPending}
            className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {crearMutation.isPending ? 'Creando…' : 'Crear Recibo'}
          </button>
          <button
            type="button"
            onClick={() => navigate({ to: '/recibos' })}
            className="px-6 py-2.5 rounded-lg border border-border text-sm hover:bg-secondary transition-colors"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
