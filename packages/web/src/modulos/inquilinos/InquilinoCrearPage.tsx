import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { inquilinosAPI } from '@/services/inquilinos.api';
import type { InquilinoEntrada } from '@proyecto-modular/shared/esquemas/inquilinos';

export function InquilinoCrearPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [form, setForm] = useState<InquilinoEntrada>({
    nombre: '',
    apellidoPaterno: '',
    apellidoMaterno: '',
    rfc: '',
    curp: '',
    telefono: '',
    correo: '',
  });

  const [error, setError] = useState('');

  const crearMutation = useMutation({
    mutationFn: inquilinosAPI.crear,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inquilinos'] });
      navigate({ to: '/inquilinos' });
    },
    onError: (err: Error) => setError(err.message),
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.name === 'rfc' || e.target.name === 'curp'
      ? e.target.value.toUpperCase()
      : e.target.value;
    setForm((prev) => ({ ...prev, [e.target.name]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    // Limpiar strings vacíos → undefined para que Zod acepte como optional
    const entrada: InquilinoEntrada = {
      ...form,
      rfc: form.rfc?.trim() || undefined,
      curp: form.curp?.trim() || undefined,
      correo: form.correo?.trim() || undefined,
    };
    crearMutation.mutate(entrada);
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate({ to: '/inquilinos' })}
          className="p-2 rounded-lg hover:bg-secondary transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Nuevo Inquilino</h2>
          <p className="text-sm text-muted-foreground mt-1">Registra un nuevo inquilino</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Datos personales</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Nombre(s)</label>
              <input
                type="text"
                name="nombre"
                value={form.nombre}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium mb-1.5">Apellido Paterno</label>
                <input
                  type="text"
                  name="apellidoPaterno"
                  value={form.apellidoPaterno}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Apellido Materno</label>
                <input
                  type="text"
                  name="apellidoMaterno"
                  value={form.apellidoMaterno}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Identificación (opcional)</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">RFC</label>
              <input
                type="text"
                name="rfc"
                value={form.rfc ?? ''}
                onChange={handleChange}
                maxLength={13}
                placeholder="13 caracteres"
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">CURP</label>
              <input
                type="text"
                name="curp"
                value={form.curp ?? ''}
                onChange={handleChange}
                maxLength={18}
                placeholder="18 caracteres"
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Contacto</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Teléfono</label>
              <input
                type="tel"
                name="telefono"
                value={form.telefono}
                onChange={handleChange}
                minLength={10}
                required
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Correo</label>
              <input
                type="email"
                name="correo"
                value={form.correo ?? ''}
                onChange={handleChange}
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
            {crearMutation.isPending ? 'Creando…' : 'Crear Inquilino'}
          </button>
          <button
            type="button"
            onClick={() => navigate({ to: '/inquilinos' })}
            className="px-6 py-2.5 rounded-lg border border-border text-sm hover:bg-secondary transition-colors"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
