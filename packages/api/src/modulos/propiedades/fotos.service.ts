import { promises as fs } from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';
import { fileURLToPath } from 'url';
import { eq, and, asc, sql } from 'drizzle-orm';
import { db } from '../../core/db';
import { propiedades, propiedadFotos } from '../../core/db/esquema';
import type { FotoPropiedad } from '@proyecto-modular/shared/tipos/propiedades';

type FotoRow = typeof propiedadFotos.$inferSelect;

// ── Rutas físicas ──────────────────────────────────────────────────────────────
// Igual que modulos/inteligencia/ml/persistencia.ts:
// En ESM no hay __dirname — derivamos desde import.meta.url.
// El directorio de uploads debe estar en: packages/api/data/uploads/propiedades
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const RUTA_BASE_UPLOADS = path.resolve(__dirname, '../../../../data/uploads/propiedades');

// URL pública servida por express.static('/uploads') en core/app.ts.
const URL_BASE = '/uploads/propiedades';

// ── Mapeo DB ↔ Dominio ─────────────────────────────────────────────────────────

function mapearFoto(row: FotoRow): FotoPropiedad {
  return {
    id: row.id,
    nombreOriginal: row.nombreOriginal,
    mimeType: row.mimeType,
    tamanoBytes: row.tamanoBytes,
    orden: row.orden,
    esPortada: row.esPortada,
    url: `${URL_BASE}/${row.propiedadId}/${row.nombreArchivo}`,
    subidaEn: row.subidaEn.toISOString(),
  };
}

// Exportado para uso por otros servicios (ej. propiedades.service.listar)
// que necesiten componar `FotoPropiedad[]` desde filas crudas.
export { mapearFoto as mapearFotoInterno };

/**
 * Convierte un mime type de imagen a su extensión canónica en disco.
 * Whitelist dura: jpeg → jpg, png → png, webp → webp.
 */
function extensionParaMime(mime: string): string | null {
  switch (mime) {
    case 'image/jpeg':
      return 'jpg';
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    default:
      return null;
  }
}

export interface ArchivoSubir {
  buffer: Buffer;
  mimeType: string;
  nombreOriginal: string;
  tamanoBytes: number;
}

// ── Servicio ───────────────────────────────────────────────────────────────────

export const fotosService = {
  /**
   * Lista las fotos de una propiedad ordenadas por `orden` ascendente.
   * Si la propiedad no tiene fotos devuelve [].
   */
  async listarPorPropiedad(propiedadId: string): Promise<FotoPropiedad[]> {
    const filas = await db
      .select()
      .from(propiedadFotos)
      .where(eq(propiedadFotos.propiedadId, propiedadId))
      .orderBy(asc(propiedadFotos.orden), asc(propiedadFotos.subidaEn));
    return filas.map(mapearFoto);
  },

  /**
   * Sube 1..N fotos a una propiedad.
   * Falla sin tocar disco si la propiedad no existe.
   * Falla sin escribir ningún archivo si algún mime no es válido.
   * Marca la primera foto del lote como portada si la propiedad aún no tenía.
   */
  async subir(propiedadId: string, archivos: ArchivoSubir[]): Promise<FotoPropiedad[]> {
    if (archivos.length === 0) {
      throw new Error('No se proporcionaron archivos');
    }

    // 1. Verificar que la propiedad existe.
    const [prop] = await db
      .select({ id: propiedades.id })
      .from(propiedades)
      .where(eq(propiedades.id, propiedadId))
      .limit(1);
    if (!prop) {
      const err = new Error('Propiedad no encontrada');
      (err as Error & { codigo?: number }).codigo = 404;
      throw err;
    }

    // 2. Validar todos los mime ANTES de escribir nada.
    const extensiones = archivos.map((a) => extensionParaMime(a.mimeType));
    if (extensiones.some((e) => e === null)) {
      throw new Error('Tipo de archivo no permitido. Solo JPEG, PNG o WebP.');
    }

    // 3. Componer nombres en disco (UUID.<ext>) y crear el directorio.
    const dirPropiedad = path.join(RUTA_BASE_UPLOADS, propiedadId);
    await fs.mkdir(dirPropiedad, { recursive: true });

    const nombresDisco = archivos.map(() => `${randomUUID()}.${extensiones.shift()}`);

    // 4. Escribir todos los archivos. Si alguno falla, borrar los previos.
    const escritas: string[] = [];
    try {
      for (let i = 0; i < archivos.length; i++) {
        const archivo = archivos[i]!;
        const nombre = nombresDisco[i]!;
        await fs.writeFile(path.join(dirPropiedad, nombre), archivo.buffer);
        escritas.push(nombre);
      }
    } catch (err) {
      // Rollback: borrar los archivos ya escritos.
      await Promise.all(
        escritas.map((n) =>
          fs.unlink(path.join(dirPropiedad, n)).catch(() => undefined),
        ),
      );
      throw err;
    }

    // 5. Insertar filas. La primera del lote es portada si no había ninguna previa.
    const [existePortada] = await db
      .select({ id: propiedadFotos.id })
      .from(propiedadFotos)
      .where(
        and(
          eq(propiedadFotos.propiedadId, propiedadId),
          eq(propiedadFotos.esPortada, true),
        ),
      )
      .limit(1);
    const hayPortadaPrevia = !!existePortada;

    const filasCreadas: FotoRow[] = [];
    for (let i = 0; i < archivos.length; i++) {
      const archivo = archivos[i]!;
      const nombre = nombresDisco[i]!;
      const esPortada = !hayPortadaPrevia && i === 0;
      const [fila] = await db
        .insert(propiedadFotos)
        .values({
          propiedadId,
          nombreArchivo: nombre,
          nombreOriginal: archivo.nombreOriginal,
          mimeType: archivo.mimeType,
          tamanoBytes: archivo.tamanoBytes,
          orden: 0, // se actualizará abajo
          esPortada,
        })
        .returning();
      if (!fila) {
        throw new Error('No se pudo registrar la foto en la base de datos');
      }
      filasCreadas.push(fila);
    }

    // 6. Aplicar orden = posición en el lote (1, 2, 3...) desplazado al
    //    máximo existente para no pisar el orden de fotos previas.
    const [maxOrden] = await db
      .select({ max: sql<number>`COALESCE(MAX(${propiedadFotos.orden}), 0)` })
      .from(propiedadFotos)
      .where(eq(propiedadFotos.propiedadId, propiedadId));
    const base = Number(maxOrden?.max ?? 0);
    for (let i = 0; i < filasCreadas.length; i++) {
      const fila = filasCreadas[i]!;
      await db
        .update(propiedadFotos)
        .set({ orden: base + i + 1 })
        .where(eq(propiedadFotos.id, fila.id));
      fila.orden = base + i + 1;
    }

    return filasCreadas.map(mapearFoto);
  },

  /**
   * Elimina una foto: borra el archivo en disco y la fila en DB.
   * Si la foto no existe devuelve false.
   * Si el archivo ya no está en disco, igual borra la fila.
   */
  async eliminar(fotoId: string): Promise<boolean> {
    const [fila] = await db
      .select()
      .from(propiedadFotos)
      .where(eq(propiedadFotos.id, fotoId))
      .limit(1);
    if (!fila) return false;

    const rutaArchivo = path.join(RUTA_BASE_UPLOADS, fila.propiedadId, fila.nombreArchivo);
    await fs.unlink(rutaArchivo).catch((err: NodeJS.ErrnoException) => {
      if (err.code !== 'ENOENT') throw err;
    });

    await db.delete(propiedadFotos).where(eq(propiedadFotos.id, fotoId));
    return true;
  },

  /**
   * Marca una foto como portada. Si había otra marcada, la desmarca.
   * Devuelve la foto actualizada o null si no existe.
   */
  async marcarPortada(fotoId: string): Promise<FotoPropiedad | null> {
    const [fila] = await db
      .select()
      .from(propiedadFotos)
      .where(eq(propiedadFotos.id, fotoId))
      .limit(1);
    if (!fila) return null;

    await db
      .update(propiedadFotos)
      .set({ esPortada: false })
      .where(
        and(
          eq(propiedadFotos.propiedadId, fila.propiedadId),
          eq(propiedadFotos.esPortada, true),
        ),
      );
    await db
      .update(propiedadFotos)
      .set({ esPortada: true })
      .where(eq(propiedadFotos.id, fotoId));

    const [actualizada] = await db
      .select()
      .from(propiedadFotos)
      .where(eq(propiedadFotos.id, fotoId))
      .limit(1);
    return actualizada ? mapearFoto(actualizada) : null;
  },

  /**
   * Reordena las fotos de una propiedad según el orden del array `ids`.
   * Los ids que no pertenezcan a la propiedad se ignoran.
   */
  async reordenar(propiedadId: string, ids: string[]): Promise<FotoPropiedad[]> {
    if (ids.length === 0) return this.listarPorPropiedad(propiedadId);

    for (let i = 0; i < ids.length; i++) {
      await db
        .update(propiedadFotos)
        .set({ orden: i + 1 })
        .where(
          and(
            eq(propiedadFotos.propiedadId, propiedadId),
            eq(propiedadFotos.id, ids[i]!),
          ),
        );
    }
    return this.listarPorPropiedad(propiedadId);
  },

  /**
   * Elimina TODAS las fotos de una propiedad (archivos + filas).
   * Pensado para tests y limpieza administrativa. No usado por routers.
   */
  async _eliminarTodoDePropiedad(propiedadId: string): Promise<void> {
    const filas = await db
      .select()
      .from(propiedadFotos)
      .where(eq(propiedadFotos.propiedadId, propiedadId));
    await Promise.all(
      filas.map((f) =>
        fs
          .unlink(path.join(RUTA_BASE_UPLOADS, f.propiedadId, f.nombreArchivo))
          .catch(() => undefined),
      ),
    );
    await db.delete(propiedadFotos).where(eq(propiedadFotos.propiedadId, propiedadId));
  },
};

// Exposed for tests
export const __testing = { mapearFoto, extensionParaMime, RUTA_BASE_UPLOADS, URL_BASE };
