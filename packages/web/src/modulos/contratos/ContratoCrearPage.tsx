import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { contratosAPI } from '@/services/contratos.api';
import type { ContratoEntrada } from '@proyecto-modular/shared/esquemas/contratos';
import type { PeriodicidadPago } from '@proyecto-modular/shared/tipos/contratos';

export function ContratoCrearPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    propiedadId: '',
    inquilinoId: '',
    fechaInicio: '',
    fechaFin: '',
    rentaMensual: '',
    deposito: '0',
    periodicidadPago: 'mensual' as PeriodicidadPago,
  });

  const [error, setError] = useState('');

  const crearMutation = useMutation({
    mutationFn: contratosAPI.crear,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contratos'] });
      navigate({ to: '/contratos' });
    },
    onError: (err: Error) => setError(err.message),
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const entrada: ContratoEntrada = {
      propiedadId: formData.propiedadId,
      inquilinoId: formData.inquilinoId,
      fechaInicio: formData.fechaInicio,
      fechaFin: formData.fechaFin,
      rentaMensual: Number(formData.rentaMensual),
      deposito: Number(formData.deposito),
      periodicidadPago: formData.periodicidadPago,
    };

    crearMutation.mutate(entrada);
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* ── Encabezado ──────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate({ to: '/contratos' })}
          className="p-2 rounded-lg hover:bg-secondary transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Nuevo Contrato</h2>
          <p className="text-sm text-muted-foreground mt-1">Registra un nuevo contrato de arrendamiento</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
        )}

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Vinculación</h3>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">ID de la Propiedad</label>
              <input
                type="text"
                name="propiedadId"
                value={formData.propiedadId}
                onChange={handleChange}
                placeholder="UUID de la propiedad"
                required
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">ID del Inquilino</label>
              <input
                type="text"
                name="inquilinoId"
                value={formData.inquilinoId}
                onChange={handleChange}
                placeholder="UUID del inquilino"
                required
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <h3 className="text-lg font-semibold pt-2">Periodo</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Fecha de Inicio</label>
              <input
                type="date"
                name="fechaInicio"
                value={formData.fechaInicio}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Fecha de Fin</label>
              <input
                type="date"
                name="fechaFin"
                value={formData.fechaFin}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <h3 className="text-lg font-semibold pt-2">Condiciones económicas</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Renta Mensual</label>
              <input
                type="number"
                name="rentaMensual"
                value={formData.rentaMensual}
                onChange={handleChange}
                placeholder="0.00"
                min="0.01"
                step="0.01"
                required
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Depósito</label>
              <input
                type="number"
                name="deposito"
                value={formData.deposito}
                onChange={handleChange}
                placeholder="0.00"
                min="0"
                step="0.01"
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Periodicidad de Pago</label>
            <select
              name="periodicidadPago"
              value={formData.periodicidadPago}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="mensual">Mensual</option>
              <option value="bimestral">Bimestral</option>
              <option value="anual">Anual</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-4 border-t border-border">
          <button
            type="submit"
            disabled={crearMutation.isPending}
            className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {crearMutation.isPending ? 'Creando…' : 'Crear Contrato'}
          </button>
          <button
            type="button"
            onClick={() => navigate({ to: '/contratos' })}
            className="px-6 py-2.5 rounded-lg border border-border text-sm hover:bg-secondary transition-colors"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
