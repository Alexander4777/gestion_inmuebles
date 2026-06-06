export function DashboardPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { titulo: 'Propiedades', valor: '—', descripcion: 'Activas' },
          { titulo: 'Contratos', valor: '—', descripcion: 'Vigentes' },
          { titulo: 'Recibos', valor: '—', descripcion: 'Pendientes este mes' },
          { titulo: 'Ingresos', valor: '—', descripcion: 'Este mes' },
        ].map((tarjeta) => (
          <div
            key={tarjeta.titulo}
            className="rounded-xl border border-border bg-card p-6 shadow-sm"
          >
            <h3 className="text-sm font-medium text-muted-foreground">{tarjeta.titulo}</h3>
            <p className="text-3xl font-bold mt-2">{tarjeta.valor}</p>
            <p className="text-xs text-muted-foreground mt-1">{tarjeta.descripcion}</p>
          </div>
        ))}
      </div>

      <p className="text-muted-foreground text-sm">
        El sistema está en fase de construcción. Los módulos se irán activando conforme avance el
        desarrollo.
      </p>
    </div>
  );
}
