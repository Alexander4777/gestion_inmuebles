import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, FileSpreadsheet } from 'lucide-react';
import { facturacionAPI } from '@/services/facturacion.api';
import { useRecibosParaSelecto } from '@/services/hooks';
import { Selector } from '@/core/ui/Selector';
import type { FacturaEntrada } from '@proyecto-modular/shared/esquemas/facturacion';
import type { UsoCFDI } from '@proyecto-modular/shared/tipos/facturacion';
import { cn } from '@/core/ui/cn';

const USO_CFDI: { value: UsoCFDI; label: string; descripcion: string }[] = [
  { value: 'D10', label: 'D10', descripcion: 'Arrendamiento de inmuebles' },
  { value: 'G03', label: 'G03', descripcion: 'Gastos en general' },
  { value: 'D01', label: 'D01', descripcion: 'Honorarios médicos / dentales' },
];

export function FacturaCrearPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [form, setForm] = useState<FacturaEntrada>({
    reciboId: '',
    usoCFDI: 'D10',
  });
  const [error, setError] = useState('');

  const { opciones: opcionesRecibos, isLoading: cargandoRecibos } =
    useRecibosParaSelecto(true);

  const crearMutation = useMutation({
    mutationFn: facturacionAPI.crear,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facturas'] });
      navigate({ to: '/facturacion' });
    },
    onError: (err: Error) => setError(err.message),
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
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
          onClick={() => navigate({ to: '/facturacion' })}
          className="p-2 rounded-lg hover:bg-secondary transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Nueva Factura</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Generar un CFDI a partir de un recibo
          </p>
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
            etiqueta="Recibo a facturar"
            value={form.reciboId}
            onChange={(v) => setForm({ ...form, reciboId: v })}
            opciones={opcionesRecibos}
            isLoading={cargandoRecibos}
            placeholder="Selecciona un recibo pendiente…"
            mensajeVacio="No hay recibos pendientes de facturar."
          />
          <p className="text-xs text-muted-foreground -mt-2">
            El recibo debe existir y no tener ya una factura asociada.
          </p>

          <div>
            <label className="block text-sm font-medium mb-2">Uso CFDI</label>
            <div className="space-y-2">
              {USO_CFDI.map((u) => (
                <label
                  key={u.value}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                    form.usoCFDI === u.value
                      ? 'bg-primary/5 border-primary'
                      : 'border-border hover:bg-secondary/50',
                  )}
                >
                  <input
                    type="radio"
                    name="usoCFDI"
                    value={u.value}
                    checked={form.usoCFDI === u.value}
                    onChange={handleChange}
                    className="text-primary"
                  />
                  <div>
                    <p className="font-medium text-sm">{u.label}</p>
                    <p className="text-xs text-muted-foreground">{u.descripcion}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-dashed border-border bg-secondary/30 p-4">
            <p className="text-xs text-muted-foreground">
              <FileSpreadsheet size={14} className="inline mr-1" />
              Al crear la factura, se generará automáticamente:
            </p>
            <ul className="text-xs text-muted-foreground mt-2 ml-4 list-disc space-y-0.5">
              <li>
                Serie: <span className="font-mono">A</span>
              </li>
              <li>Folio: número consecutivo de 6 dígitos</li>
              <li>Estatus inicial: <span className="font-medium">pendiente</span></li>
            </ul>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-4 border-t border-border">
          <button
            type="submit"
            disabled={crearMutation.isPending}
            className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {crearMutation.isPending ? 'Creando…' : 'Crear Factura'}
          </button>
          <button
            type="button"
            onClick={() => navigate({ to: '/facturacion' })}
            className="px-6 py-2.5 rounded-lg border border-border text-sm hover:bg-secondary transition-colors"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}