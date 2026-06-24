import { describe, it, expect } from 'vitest';
import { mantenimientoEsquema } from '@proyecto-modular/shared/esquemas/mantenimiento';

describe('Módulo de Mantenimiento', () => {
  const datosValidos = {
    propiedadId: '123e4567-e89b-12d3-a456-426614174000',
    categoria: 'fontaneria' as const,
    descripcion: 'Fuga en el baño',
    costo: 1500,
  };

  describe('mantenimientoEsquema (validación)', () => {
    it('acepta datos válidos', () => {
      const resultado = mantenimientoEsquema.safeParse(datosValidos);
      expect(resultado.success).toBe(true);
    });

    it('acepta costo cero (sin costo aún)', () => {
      const resultado = mantenimientoEsquema.safeParse({ ...datosValidos, costo: 0 });
      expect(resultado.success).toBe(true);
    });

    it('rechaza costo negativo', () => {
      const resultado = mantenimientoEsquema.safeParse({ ...datosValidos, costo: -100 });
      expect(resultado.success).toBe(false);
    });

    it('rechaza descripción vacía', () => {
      const resultado = mantenimientoEsquema.safeParse({ ...datosValidos, descripcion: '' });
      expect(resultado.success).toBe(false);
    });

    it('rechaza propiedadId no UUID', () => {
      const resultado = mantenimientoEsquema.safeParse({ ...datosValidos, propiedadId: 'no-uuid' });
      expect(resultado.success).toBe(false);
    });
  });

  describe('categorías soportadas', () => {
    it.each([
      'electricidad',
      'fontaneria',
      'carpinteria',
      'albañileria',
      'materiales',
      'otro',
    ] as const)('acepta categoría %s', (cat) => {
      const resultado = mantenimientoEsquema.safeParse({ ...datosValidos, categoria: cat });
      expect(resultado.success).toBe(true);
    });
  });
});
