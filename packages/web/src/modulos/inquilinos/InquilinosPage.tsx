import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { Plus, Search, Eye, Users } from 'lucide-react';
import { inquilinosAPI } from '@/services/inquilinos.api';
import { cn } from '@/core/ui/cn';

export function InquilinosPage() {
  const [filtroActivo, setFiltroActivo] = useState<'all' | 'active' | 'inactive'>('active');
  const [busqueda, setBusqueda] = useState('');

  const { data: inquilinos = [], isLoading } = useQuery({
    queryKey: ['inquilinos', filtroActivo],
    queryFn: () =>
      inquilinosAPI.listar(filtroActivo === 'all' ? undefined : { activo: filtroActivo === 'active' }),
  });

  const filtrados = useMemo(() => {
    if (!busqueda) return inquilinos;
    const q = busqueda.toLowerCase();
    return inquilinos.filter(
      (i) =>
        i.nombre.toLowerCase().includes(q) ||
        i.apellidoPaterno.toLowerCase().includes(q) ||
        i.apellidoMaterno.toLowerCase().includes(q) ||
        (i.rfc?.toLowerCase().includes(q) ?? false),
    );
  }, [inquilinos, busqueda]);

  if (isLoading) return <p className="text-muted-foreground">Cargando inquilinos…</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Inquilinos</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {inquilinos.length} registrado{inquilinos.length !== 1 && 's'}
          </p>
        </div>
        <Link
          to="/inquilinos/crear"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus size={18} />
          Nuevo Inquilino
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por nombre o RFC…"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <select
          value={filtroActivo}
          onChange={(e) => setFiltroActivo(e.target.value as 'all' | 'active' | 'inactive')}
          className="px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="active">Activos</option>
          <option value="inactive">Inactivos</option>
          <option value="all">Todos</option>
        </select>
      </div>

      {filtrados.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Users size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">No hay inquilinos</p>
          <p className="text-sm mt-1">Registra tu primer inquilino para empezar.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Nombre completo</th>
                <th className="text-left px-4 py-3 font-medium">RFC</th>
                <th className="text-left px-4 py-3 font-medium">Contacto</th>
                <th className="text-center px-4 py-3 font-medium w-20">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtrados.map((i) => (
                <tr
                  key={i.id}
                  className={cn(
                    'hover:bg-secondary/20 transition-colors',
                    !i.activo && 'opacity-60',
                  )}
                >
                  <td className="px-4 py-3 font-medium">
                    {i.nombre} {i.apellidoPaterno} {i.apellidoMaterno}
                    {!i.activo && (
                      <span className="ml-2 text-xs text-muted-foreground">(inactivo)</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground font-mono text-xs">
                    {i.rfc || '—'}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {i.telefono}
                    {i.correo && (
                      <>
                        <br />
                        <span className="text-xs">{i.correo}</span>
                      </>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <Link
                        to={`/inquilinos/$id`}
                        params={{ id: i.id }}
                        className="p-1.5 rounded-md hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
                        title="Ver detalle"
                      >
                        <Eye size={15} />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
