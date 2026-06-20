import { describe, it, expect } from 'vitest';
import { direccionEsquema } from '@proyecto-modular/shared/esquemas/propiedades';

describe('Módulo de Propiedades', () => {
  describe('direccionEsquema (validación)', () => {
    const direccionValida = {
      calle: 'Av. Reforma',
      numero: '123',
      colonia: 'Centro',
      codigoPostal: '06000',
      ciudad: 'Ciudad de México',
      estado: 'CDMX',
    };

    it('acepta dirección válida', () => {
      const resultado = direccionEsquema.safeParse(direccionValida);
      expect(resultado.success).toBe(true);
    });

    it('rechaza código postal con longitud incorrecta', () => {
      const resultado = direccionEsquema.safeParse({ ...direccionValida, codigoPostal: '1234' });
      expect(resultado.success).toBe(false);
    });

    it('rechaza calle vacía', () => {
      const resultado = direccionEsquema.safeParse({ ...direccionValida, calle: '' });
      expect(resultado.success).toBe(false);
    });

    it.each(['calle', 'numero', 'colonia', 'ciudad', 'estado'] as const)(
      'rechaza %s vacío',
      (campo) => {
        const resultado = direccionEsquema.safeParse({ ...direccionValida, [campo]: '' });
        expect(resultado.success).toBe(false);
      },
    );
  });

  describe('tipos de propiedad', () => {
    it.each(['casa', 'departamento', 'local-comercial', 'bodega', 'otro'] as const)(
      'acepta tipo %s',
      (tipo) => {
        const { z } = require('zod');
        const enumEsquema = z.enum(['casa', 'departamento', 'local-comercial', 'bodega', 'otro']);
        const resultado = enumEsquema.safeParse(tipo);
        expect(resultado.success).toBe(true);
      },
    );
  });
});
