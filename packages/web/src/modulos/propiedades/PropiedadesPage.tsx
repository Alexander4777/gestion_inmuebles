import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { Plus, Search, Eye, Building2 } from 'lucide-react';
import { propiedadesAPI } from '@/services/propiedades.api';
import { cn } from '@/core/ui/cn';
import type { PropiedadTipo } from '@proyecto-modular/shared/tipos/propiedades';
import { MiniaturaPropiedad } from './MiniaturaPropiedad';

const TIPO_LABELS: Record<PropiedadTipo, string> = {
  casa: 'Casa',
  departamento: 'Departamento',
  'local-comercial': 'Local comercial',
  bodega: 'Bodega',
  otro: 'Otro',
};

const TIPO_COLORES: Record<PropiedadTipo, string> = {
  casa: 'bg-blue-100 text-blue-800 border-blue-200',
  departamento: 'bg-purple-100 text-purple-800 border-purple-200',
  'local-comercial': 'bg-emerald-100 text-emerald-800 border-emerald-200',
  bodega: 'bg-amber-100 text-amber-800 border-amber-200',
  otro: 'bg-slate-100 text-slate-600 border-slate-200',
};

export function PropiedadesPage() {
  const [filtroActiva, setFiltroActiva] = useState<'all' | 'active' | 'inactive'>('active');
  const [busqueda, setBusqueda] = useState('');

  const { data: propiedades = [], isLoading } = useQuery({
    queryKey: ['propiedades', filtroActiva],
    queryFn: () =>
      propiedadesAPI.listar(
        filtroActiva === 'all' ? undefined : { activa: filtroActiva === 'active' },
      ),
  });

  const filtrados = useMemo(() => {
    if (!busqueda) return propiedades;
    const q = busqueda.toLowerCase();
    return propiedades.filter(
      (p) =>
        p.nombre.toLowerCase().includes(q) ||
        p.direccion.colonia.toLowerCase().includes(q) ||
        p.direccion.ciudad.toLowerCase().includes(q),
    );
  }, [propiedades, busqueda]);

  if (isLoading) return <p className="text-muted-foreground">Cargando propiedades…</p>;

  return (
    <div className="space-y-6">
      {/* ── Encabezado ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Propiedades</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {propiedades.length}{propiedades.length !== 1 ? 'es' : ''} registrada
            {propiedades.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link
          to="/propiedades/crear"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus size={18} />
          Nueva Propiedad
        </Link>
      </div>

      {/* ── Filtros ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por nombre, colonia, ciudad…"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <select
          value={filtroActiva}
          onChange={(e) => setFiltroActiva(e.target.value as 'all' | 'active' | 'inactive')}
          className="px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="active">Activas</option>
          <option value="inactive">Inactivas</option>
          <option value="all">Todas</option>
        </select>
      </div>

      {/* ── Tabla ───────────────────────────────────────────────────────────── */}
      {filtrados.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Building2 size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">No hay propiedades</p>
          <p className="text-sm mt-1">Crea tu primera propiedad para empezar.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Nombre</th>
                <th className="text-left px-4 py-3 font-medium">Dirección</th>
                <th className="text-center px-4 py-3 font-medium">Tipo</th>
                <th className="text-center px-4 py-3 font-medium w-20">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtrados.map((p) => {
                const portada = p.fotos?.find((f) => f.esPortada);
                return (
                  <tr key={p.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <MiniaturaPropiedad fotoPortada={portada} />
                        <span className="font-medium">
                          {p.nombre}
                          {!p.activa && (
                            <span className="ml-2 text-xs text-muted-foreground">(inactiva)</span>
                          )}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {p.direccion.calle} {p.direccion.numero}, {p.direccion.colonia}
                      <br />
                      <span className="text-xs">
                        {p.direccion.ciudad}, {p.direccion.estado} — CP {p.direccion.codigoPostal}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={cn(
                          'inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border',
                          TIPO_COLORES[p.tipo],
                        )}
                      >
                        {TIPO_LABELS[p.tipo]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <Link
                          to={`/propiedades/$id`}
                          params={{ id: p.id }}
                          className="p-1.5 rounded-md hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
                          title="Ver detalle"
                        >
                          <Eye size={15} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
