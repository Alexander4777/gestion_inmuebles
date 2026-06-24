import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { propiedadesAPI, type PropiedadEntrada } from '@/services/propiedades.api';

export function PropiedadCrearPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [form, setForm] = useState<PropiedadEntrada>({
    nombre: '',
    tipo: 'casa',
    calle: '',
    numero: '',
    colonia: '',
    codigoPostal: '',
    ciudad: '',
    estado: '',
  });

  const [error, setError] = useState('');

  const crearMutation = useMutation({
    mutationFn: propiedadesAPI.crear,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['propiedades'] });
      navigate({ to: '/propiedades' });
    },
    onError: (err: Error) => setError(err.message),
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
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
          onClick={() => navigate({ to: '/propiedades' })}
          className="p-2 rounded-lg hover:bg-secondary transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Nueva Propiedad</h2>
          <p className="text-sm text-muted-foreground mt-1">Registra una nueva unidad rentable</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Información general</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Nombre</label>
              <input
                type="text"
                name="nombre"
                value={form.nombre}
                onChange={handleChange}
                placeholder="Ej: Casa Centro"
                required
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Tipo</label>
              <select
                name="tipo"
                value={form.tipo}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="casa">Casa</option>
                <option value="departamento">Departamento</option>
                <option value="local-comercial">Local comercial</option>
                <option value="bodega">Bodega</option>
                <option value="otro">Otro</option>
              </select>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Dirección</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1.5">Calle</label>
              <input
                type="text"
                name="calle"
                value={form.calle}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Número</label>
              <input
                type="text"
                name="numero"
                value={form.numero}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Colonia</label>
              <input
                type="text"
                name="colonia"
                value={form.colonia}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Código Postal</label>
              <input
                type="text"
                name="codigoPostal"
                value={form.codigoPostal}
                onChange={handleChange}
                maxLength={5}
                pattern="[0-9]{5}"
                required
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Ciudad</label>
              <input
                type="text"
                name="ciudad"
                value={form.ciudad}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Estado</label>
              <input
                type="text"
                name="estado"
                value={form.estado}
                onChange={handleChange}
                required
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
            {crearMutation.isPending ? 'Creando…' : 'Crear Propiedad'}
          </button>
          <button
            type="button"
            onClick={() => navigate({ to: '/propiedades' })}
            className="px-6 py-2.5 rounded-lg border border-border text-sm hover:bg-secondary transition-colors"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
