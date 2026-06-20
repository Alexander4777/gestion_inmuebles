import { useParams, Link } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Power, PowerOff, MapPin, Home } from 'lucide-react';
import { propiedadesAPI } from '@/services/propiedades.api';
import { cn } from '@/core/ui/cn';
import type { PropiedadTipo } from '@proyecto-modular/shared/tipos/propiedades';

const TIPO_LABELS: Record<PropiedadTipo, string> = {
  casa: 'Casa',
  departamento: 'Departamento',
  'local-comercial': 'Local comercial',
  bodega: 'Bodega',
  otro: 'Otro',
};

export function PropiedadDetallePage() {
  const { id } = useParams({ strict: false }) as { id: string };
  const queryClient = useQueryClient();

  const { data: propiedad, isLoading, error } = useQuery({
    queryKey: ['propiedades', id],
    queryFn: () => propiedadesAPI.obtener(id),
  });

  const toggleActiva = useMutation({
    mutationFn: () => propiedadesAPI.actualizar(id, { activa: !propiedad?.activa }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['propiedades'] }),
  });

  if (isLoading) return <p className="text-muted-foreground">Cargando propiedad…</p>;
  if (error || !propiedad)
    return (
      <div className="text-center py-16">
        <p className="text-lg font-medium text-red-600">Propiedad no encontrada</p>
        <Link to="/propiedades" className="text-sm text-primary hover:underline mt-2 inline-block">
          Volver a la lista
        </Link>
      </div>
    );

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <Link to="/propiedades" className="p-2 rounded-lg hover:bg-secondary transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <Home size={28} className="text-muted-foreground" />
            <h2 className="text-3xl font-bold tracking-tight">{propiedad.nombre}</h2>
            {!propiedad.activa && (
              <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border bg-slate-50 text-slate-500 border-slate-200">
                inactiva
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">{TIPO_LABELS[propiedad.tipo]}</p>
        </div>
      </div>

      {/* ── Dirección ───────────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <MapPin size={18} className="text-muted-foreground" />
          <h3 className="text-lg font-semibold">Dirección</h3>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="col-span-2">
            <p className="text-muted-foreground">Calle y número</p>
            <p className="font-medium">
              {propiedad.direccion.calle} {propiedad.direccion.numero}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Colonia</p>
            <p className="font-medium">{propiedad.direccion.colonia}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Código Postal</p>
            <p className="font-medium">{propiedad.direccion.codigoPostal}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Ciudad</p>
            <p className="font-medium">{propiedad.direccion.ciudad}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Estado</p>
            <p className="font-medium">{propiedad.direccion.estado}</p>
          </div>
        </div>
      </div>

      {/* ── Acciones ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={() => {
            const accion = propiedad.activa ? 'desactivar' : 'activar';
            if (confirm(`¿${accion.charAt(0).toUpperCase() + accion.slice(1)} esta propiedad?`)) {
              toggleActiva.mutate();
            }
          }}
          disabled={toggleActiva.isPending}
          className={cn(
            'inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50',
            propiedad.activa
              ? 'border border-border hover:bg-secondary'
              : 'bg-emerald-600 text-white hover:bg-emerald-700',
          )}
        >
          {propiedad.activa ? <PowerOff size={18} /> : <Power size={18} />}
          {propiedad.activa ? 'Desactivar' : 'Activar'}
        </button>
      </div>
    </div>
  );
}
