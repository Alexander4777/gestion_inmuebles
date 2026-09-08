import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Upload, X, Star, ImagePlus, AlertCircle } from 'lucide-react';
import { propiedadesAPI } from '@/services/propiedades.api';
import { cn } from '@/core/ui/cn';
import type { FotoPropiedad } from '@proyecto-modular/shared/tipos/propiedades';

interface Props {
  propiedadId: string;
  fotos: FotoPropiedad[];
}

const MIME_FOTO = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
};

export function GaleriaPropiedad({ propiedadId, fotos }: Props) {
  const queryClient = useQueryClient();

  const invalidar = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['propiedades', propiedadId] });
  }, [queryClient, propiedadId]);

  const subir = useMutation({
    mutationFn: (archivos: File[]) => propiedadesAPI.subirFotos(propiedadId, archivos),
    onSuccess: invalidar,
  });

  const eliminar = useMutation({
    mutationFn: (fotoId: string) => propiedadesAPI.eliminarFoto(fotoId),
    onSuccess: invalidar,
  });

  const marcarPortada = useMutation({
    mutationFn: (fotoId: string) => propiedadesAPI.marcarPortada(fotoId),
    onSuccess: invalidar,
  });

  const onDrop = useCallback(
    (archivosAceptados: File[]) => {
      if (archivosAceptados.length > 0) {
        subir.mutate(archivosAceptados);
      }
    },
    [subir],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: MIME_FOTO,
    maxSize: 5 * 1024 * 1024,
    disabled: subir.isPending,
  });

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
      <div className="flex items-center gap-2">
        <ImagePlus size={18} className="text-muted-foreground" />
        <h3 className="text-lg font-semibold">Galería</h3>
        <span className="text-xs text-muted-foreground">
          {fotos.length === 0 ? 'Sin fotos' : `${fotos.length} foto${fotos.length !== 1 ? 's' : ''}`}
        </span>
      </div>

      {/* ── Grid de miniaturas ────────────────────────────────────────────────── */}
      {fotos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {fotos.map((foto) => (
            <FotoItem
              key={foto.id}
              foto={foto}
              onEliminar={() => {
                if (confirm(`¿Eliminar "${foto.nombreOriginal}"?`)) eliminar.mutate(foto.id);
              }}
              onMarcarPortada={() => marcarPortada.mutate(foto.id)}
              eliminando={eliminar.isPending && eliminar.variables === foto.id}
              marcandoPortada={
                marcarPortada.isPending && marcarPortada.variables === foto.id
              }
            />
          ))}
        </div>
      )}

      {/* ── Dropzone ─────────────────────────────────────────────────────────── */}
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors',
          isDragActive
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary/40 hover:bg-secondary/30',
          subir.isPending && 'opacity-50 pointer-events-none',
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-1 text-sm text-muted-foreground">
          <Upload size={22} />
          {subir.isPending ? (
            <p>Subiendo {subir.variables?.length ?? 0} archivo(s)…</p>
          ) : isDragActive ? (
            <p className="text-primary font-medium">Suelta para subir</p>
          ) : (
            <>
              <p>
                <span className="font-medium text-foreground">Arrastra fotos aquí</span> o haz clic
                para seleccionar
              </p>
              <p className="text-xs">JPEG, PNG o WebP · máx 5 MB c/u · hasta 20 a la vez</p>
            </>
          )}
        </div>
      </div>

      {/* ── Mensajes de error ────────────────────────────────────────────────── */}
      {subir.isError && (
        <p className="flex items-center gap-2 text-sm text-red-600">
          <AlertCircle size={15} />
          {subir.error.message}
        </p>
      )}
    </div>
  );
}

// ── Sub-componente: item individual ───────────────────────────────────────────

function FotoItem({
  foto,
  onEliminar,
  onMarcarPortada,
  eliminando,
  marcandoPortada,
}: {
  foto: FotoPropiedad;
  onEliminar: () => void;
  onMarcarPortada: () => void;
  eliminando: boolean;
  marcandoPortada: boolean;
}) {
  return (
    <div className="group relative aspect-square rounded-lg overflow-hidden border border-border bg-secondary">
      <img
        src={foto.url}
        alt={foto.nombreOriginal}
        className="w-full h-full object-cover"
        loading="lazy"
      />

      {/* Indicador de portada */}
      {foto.esPortada && (
        <div
          className="absolute top-1.5 left-1.5 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-xs font-medium bg-amber-500 text-white shadow"
          title="Foto principal"
        >
          <Star size={12} fill="white" />
          Portada
        </div>
      )}

      {/* Acciones hover */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
        {!foto.esPortada && (
          <button
            type="button"
            onClick={onMarcarPortada}
            disabled={marcandoPortada}
            className="p-1.5 rounded-md bg-white/90 hover:bg-white text-amber-600 shadow transition-colors disabled:opacity-50"
            title="Marcar como portada"
          >
            <Star size={15} />
          </button>
        )}
        <button
          type="button"
          onClick={onEliminar}
          disabled={eliminando}
          className="p-1.5 rounded-md bg-white/90 hover:bg-white text-red-600 shadow transition-colors disabled:opacity-50"
          title="Eliminar"
        >
          <X size={15} />
        </button>
      </div>

      {/* Nombre del archivo en la parte inferior */}
      <div className="absolute bottom-0 inset-x-0 px-2 py-1 bg-gradient-to-t from-black/60 to-transparent">
        <p className="text-xs text-white truncate" title={foto.nombreOriginal}>
          {foto.nombreOriginal}
        </p>
      </div>
    </div>
  );
}
