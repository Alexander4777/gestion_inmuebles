/**
 * Tests del módulo de fotos de propiedades.
 *
 * Estrategia: aquí solo se cubren las funciones puras (extensión, mapeo).
 * Los métodos que tocan DB (`subir`, `eliminar`, `marcarPortada`, `reordenar`)
 * necesitan una DB de prueba; vitest no tiene una configurada y los existentes
 * (inteligencia.test.ts, propiedades.test.ts) siguen la misma política.
 */

import { describe, it, expect } from 'vitest';
import * as path from 'path';
import { __testing } from './fotos.service';

describe('Módulo de Fotos de Propiedades', () => {
  describe('extensionParaMime', () => {
    it.each([
      ['image/jpeg', 'jpg'],
      ['image/png', 'png'],
      ['image/webp', 'webp'],
    ] as const)('mime %s → extensión %s', (mime, ext) => {
      expect(__testing.extensionParaMime(mime)).toBe(ext);
    });

    it.each([
      ['image/gif'],
      ['image/svg+xml'],
      ['application/pdf'],
      ['text/plain'],
      [''],
    ])('rechaza mime no permitido: %s', (mime) => {
      expect(__testing.extensionParaMime(mime)).toBeNull();
    });
  });

  describe('mapearFoto', () => {
    it('compone la URL pública en /uploads/propiedades/<id>/<archivo>', () => {
      const fila = {
        id: '11111111-2222-3333-4444-555555555555',
        propiedadId: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
        nombreArchivo: 'abc-uuid.jpg',
        nombreOriginal: 'fachada.JPG',
        mimeType: 'image/jpeg',
        tamanoBytes: 102400,
        orden: 1,
        esPortada: true,
        subidaEn: new Date('2026-09-06T12:00:00Z'),
      };

      const foto = __testing.mapearFoto(fila);

      expect(foto).toEqual({
        id: fila.id,
        nombreOriginal: 'fachada.JPG',
        mimeType: 'image/jpeg',
        tamanoBytes: 102400,
        orden: 1,
        esPortada: true,
        url: `${__testing.URL_BASE}/${fila.propiedadId}/${fila.nombreArchivo}`,
        subidaEn: '2026-09-06T12:00:00.000Z',
      });
    });
  });

  describe('Constantes de ruta', () => {
    it('URL_BASE es pública (sin host, sin auth)', () => {
      expect(__testing.URL_BASE).toBe('/uploads/propiedades');
      expect(__testing.URL_BASE.startsWith('/')).toBe(true);
    });

    it('RUTA_BASE_UPLOADS apunta dentro de packages/api/data/uploads/propiedades', () => {
      expect(__testing.RUTA_BASE_UPLOADS.endsWith('/data/uploads/propiedades')).toBe(true);
      // Verifica que es una ruta absoluta (no relativa).
      expect(path.isAbsolute(__testing.RUTA_BASE_UPLOADS)).toBe(true);
    });
  });
});
