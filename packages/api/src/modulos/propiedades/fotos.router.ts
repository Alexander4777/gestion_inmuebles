import { Router, type Request, type Response, type NextFunction } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { reordenarFotosEsquema } from '@proyecto-modular/shared/esquemas/propiedades';
import { requerirAuth } from '../../core/auth';
import { fotosService, type ArchivoSubir } from './fotos.service';

// ── Configuración de multer ────────────────────────────────────────────────────
// memoryStorage: el buffer llega al handler; el service lo escribe a disco.
// Esto facilita mockear `fs/promises` en tests.
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const MAX_ARCHIVOS = 20;
const MIME_PERMITIDOS = new Set(['image/jpeg', 'image/png', 'image/webp']);

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (_req, file, cb) => {
    if (MIME_PERMITIDOS.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Tipo de archivo no permitido: ${file.mimetype}. Solo JPEG, PNG o WebP.`));
    }
  },
  limits: {
    fileSize: MAX_BYTES,
    files: MAX_ARCHIVOS,
  },
});

// ── Validadores locales ────────────────────────────────────────────────────────
const idEsquema = z.object({ id: z.string().uuid() });
const fotoIdEsquema = z.object({ fotoId: z.string().uuid() });

// ── Sub-router: rutas anidadas en /api/propiedades/:id/fotos ───────────────────
// mergeParams: true para que `req.params.id` (capturado por el padre) esté
// disponible en los handlers. Sin esto, Express no propaga los params del
// router padre al sub-router.
export const fotosRouter = Router({ mergeParams: true });
fotosRouter.use(requerirAuth);

/** GET /api/propiedades/:id/fotos — lista las fotos de una propiedad. */
fotosRouter.get('/', async (req, res) => {
  try {
    const { id } = idEsquema.parse(req.params);
    const fotos = await fotosService.listarPorPropiedad(id);
    res.json(fotos);
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'ID inválido' });
      return;
    }
    console.error('Error al listar fotos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

/**
 * POST /api/propiedades/:id/fotos — sube 1..20 fotos.
 * Campo multipart: `fotos` (mismo nombre, repetido).
 */
fotosRouter.post(
  '/',
  (req: Request, res: Response, next: NextFunction) => {
    upload.array('fotos', MAX_ARCHIVOS)(req, res, (err: unknown) => {
      if (err) {
        const mensaje =
          err instanceof multer.MulterError
            ? traducirErrorMulter(err)
            : err instanceof Error
              ? err.message
              : 'Error al procesar archivos';
        res.status(400).json({ error: mensaje });
        return;
      }
      next();
    });
  },
  async (req, res) => {
    try {
      const { id } = idEsquema.parse(req.params);
      const archivos = (req.files as Express.Multer.File[] | undefined) ?? [];
      if (archivos.length === 0) {
        res.status(400).json({ error: 'No se proporcionaron archivos en el campo "fotos"' });
        return;
      }
      const mapeados: ArchivoSubir[] = archivos.map((f) => ({
        buffer: f.buffer,
        mimeType: f.mimetype,
        nombreOriginal: f.originalname,
        tamanoBytes: f.size,
      }));
      const fotos = await fotosService.subir(id, mapeados);
      res.status(201).json(fotos);
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'ID inválido' });
        return;
      }
      const codigo = (error as { codigo?: number }).codigo;
      if (codigo === 404) {
        res.status(404).json({ error: 'Propiedad no encontrada' });
        return;
      }
      const mensaje = error instanceof Error ? error.message : 'Error desconocido';
      if (mensaje.includes('Tipo de archivo no permitido')) {
        res.status(400).json({ error: mensaje });
        return;
      }
      console.error('Error al subir fotos:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },
);

/** PATCH /api/propiedades/:id/fotos/orden — reordena por ids. */
fotosRouter.patch('/orden', async (req, res) => {
  try {
    const { id } = idEsquema.parse(req.params);
    const { ids } = reordenarFotosEsquema.parse(req.body);
    const fotos = await fotosService.reordenar(id, ids);
    res.json(fotos);
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Datos inválidos', detalles: error.errors });
      return;
    }
    console.error('Error al reordenar fotos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ── Sub-router: rutas a nivel de foto individual ───────────────────────────────
export const fotoIndividualRouter = Router();
fotoIndividualRouter.use(requerirAuth);

/** DELETE /api/propiedades/fotos/:fotoId — elimina una foto. */
fotoIndividualRouter.delete('/:fotoId', async (req, res) => {
  try {
    const { fotoId } = fotoIdEsquema.parse(req.params);
    const eliminado = await fotosService.eliminar(fotoId);
    if (!eliminado) {
      res.status(404).json({ error: 'Foto no encontrada' });
      return;
    }
    res.status(204).send();
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'ID de foto inválido' });
      return;
    }
    console.error('Error al eliminar foto:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

/** PATCH /api/propiedades/fotos/:fotoId/portada — marca como portada. */
fotoIndividualRouter.patch('/:fotoId/portada', async (req, res) => {
  try {
    const { fotoId } = fotoIdEsquema.parse(req.params);
    const foto = await fotosService.marcarPortada(fotoId);
    if (!foto) {
      res.status(404).json({ error: 'Foto no encontrada' });
      return;
    }
    res.json(foto);
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'ID de foto inválido' });
      return;
    }
    console.error('Error al marcar portada:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ── Helpers ────────────────────────────────────────────────────────────────────

function traducirErrorMulter(err: multer.MulterError): string {
  switch (err.code) {
    case 'LIMIT_FILE_SIZE':
      return `Cada archivo no puede superar ${MAX_BYTES / 1024 / 1024} MB`;
    case 'LIMIT_FILE_COUNT':
      return `No se pueden subir más de ${MAX_ARCHIVOS} archivos a la vez`;
    case 'LIMIT_UNEXPECTED_FILE':
      return 'El campo del archivo debe llamarse "fotos"';
    default:
      return err.message;
  }
}
