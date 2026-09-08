import { Home } from 'lucide-react';
import type { FotoPropiedad } from '@proyecto-modular/shared/tipos/propiedades';

/**
 * Miniatura 40×40 para el listado de propiedades.
 * Si la propiedad tiene foto marcada como portada, la muestra; si no, un icono genérico.
 */
export function MiniaturaPropiedad({ fotoPortada }: { fotoPortada?: FotoPropiedad }) {
  if (!fotoPortada) {
    return (
      <div className="w-10 h-10 rounded-md border border-border bg-secondary flex items-center justify-center text-muted-foreground">
        <Home size={18} />
      </div>
    );
  }

  return (
    <img
      src={fotoPortada.url}
      alt={fotoPortada.nombreOriginal}
      title={`Foto principal: ${fotoPortada.nombreOriginal}`}
      className="w-10 h-10 rounded-md object-cover border border-border bg-secondary"
      loading="lazy"
    />
  );
}
