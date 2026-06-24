import { useParams, Link } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Power, PowerOff, User, Phone, Mail } from 'lucide-react';
import { inquilinosAPI } from '@/services/inquilinos.api';
import { cn } from '@/core/ui/cn';

export function InquilinoDetallePage() {
  const { id } = useParams({ strict: false }) as { id: string };
  const queryClient = useQueryClient();

  const { data: inquilino, isLoading, error } = useQuery({
    queryKey: ['inquilinos', id],
    queryFn: () => inquilinosAPI.obtener(id),
  });

  const toggleActivo = useMutation({
    mutationFn: () => inquilinosAPI.actualizar(id, { activo: !inquilino?.activo }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['inquilinos'] }),
  });

  if (isLoading) return <p className="text-muted-foreground">Cargando inquilino…</p>;
  if (error || !inquilino)
    return (
      <div className="text-center py-16">
        <p className="text-lg font-medium text-red-600">Inquilino no encontrado</p>
        <Link to="/inquilinos" className="text-sm text-primary hover:underline mt-2 inline-block">
          Volver a la lista
        </Link>
      </div>
    );

  const nombreCompleto = `${inquilino.nombre} ${inquilino.apellidoPaterno} ${inquilino.apellidoMaterno}`;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <Link to="/inquilinos" className="p-2 rounded-lg hover:bg-secondary transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <User size={28} className="text-muted-foreground" />
            <h2 className="text-3xl font-bold tracking-tight">{nombreCompleto}</h2>
            {!inquilino.activo && (
              <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border bg-slate-50 text-slate-500 border-slate-200">
                inactivo
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Datos personales ─────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
        <h3 className="text-lg font-semibold">Datos personales</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          {inquilino.rfc && (
            <div>
              <p className="text-muted-foreground">RFC</p>
              <p className="font-medium font-mono">{inquilino.rfc}</p>
            </div>
          )}
          {inquilino.curp && (
            <div>
              <p className="text-muted-foreground">CURP</p>
              <p className="font-medium font-mono">{inquilino.curp}</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Contacto ────────────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
        <h3 className="text-lg font-semibold">Contacto</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Phone size={14} className="text-muted-foreground" />
            <div>
              <p className="text-muted-foreground text-xs">Teléfono</p>
              <p className="font-medium">{inquilino.telefono}</p>
            </div>
          </div>
          {inquilino.correo && (
            <div className="flex items-center gap-2">
              <Mail size={14} className="text-muted-foreground" />
              <div>
                <p className="text-muted-foreground text-xs">Correo</p>
                <p className="font-medium">{inquilino.correo}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Acciones ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={() => {
            const accion = inquilino.activo ? 'desactivar' : 'activar';
            if (confirm(`¿${accion.charAt(0).toUpperCase() + accion.slice(1)} este inquilino?`)) {
              toggleActivo.mutate();
            }
          }}
          disabled={toggleActivo.isPending}
          className={cn(
            'inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50',
            inquilino.activo
              ? 'border border-border hover:bg-secondary'
              : 'bg-emerald-600 text-white hover:bg-emerald-700',
          )}
        >
          {inquilino.activo ? <PowerOff size={18} /> : <Power size={18} />}
          {inquilino.activo ? 'Desactivar' : 'Activar'}
        </button>
      </div>
    </div>
  );
}
