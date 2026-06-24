import { describe, it, expect } from 'vitest';
import {
  facturaEsquema,
  facturaActualizarEsquema,
  facturaCancelarEsquema,
} from '@proyecto-modular/shared/esquemas/facturacion';

describe('Módulo de Facturación', () => {
  const uuidValido = '123e4567-e89b-12d3-a456-426614174000';
  const datosValidos = {
    reciboId: uuidValido,
    usoCFDI: 'D10' as const,
  };

  describe('facturaEsquema (validación)', () => {
    it('acepta datos válidos', () => {
      const resultado = facturaEsquema.safeParse(datosValidos);
      expect(resultado.success).toBe(true);
    });

    it('rechaza reciboId no UUID', () => {
      const resultado = facturaEsquema.safeParse({ ...datosValidos, reciboId: 'no-uuid' });
      expect(resultado.success).toBe(false);
    });

    it('rechaza usoCFDI inválido', () => {
      const resultado = facturaEsquema.safeParse({ ...datosValidos, usoCFDI: 'Z99' });
      expect(resultado.success).toBe(false);
    });
  });

  describe('usoCFDI permitidos', () => {
    it.each(['G03', 'D01', 'D10'] as const)('acepta usoCFDI %s', (uso) => {
      const resultado = facturaEsquema.safeParse({ ...datosValidos, usoCFDI: uso });
      expect(resultado.success).toBe(true);
    });
  });

  describe('facturaActualizarEsquema (validación)', () => {
    it('acepta actualización vacía (no-op)', () => {
      const resultado = facturaActualizarEsquema.safeParse({});
      expect(resultado.success).toBe(true);
    });

    it('acepta cambio de usoCFDI', () => {
      const resultado = facturaActualizarEsquema.safeParse({ usoCFDI: 'G03' });
      expect(resultado.success).toBe(true);
    });

    it('rechaza usoCFDI inválido en actualización', () => {
      const resultado = facturaActualizarEsquema.safeParse({ usoCFDI: 'X99' });
      expect(resultado.success).toBe(false);
    });
  });

  describe('facturaCancelarEsquema (validación)', () => {
    it('acepta motivo válido', () => {
      const resultado = facturaCancelarEsquema.safeParse({ motivo: 'Comprobante emitido con error' });
      expect(resultado.success).toBe(true);
    });

    it('rechaza motivo vacío', () => {
      const resultado = facturaCancelarEsquema.safeParse({ motivo: '' });
      expect(resultado.success).toBe(false);
    });

    it('rechaza motivo ausente', () => {
      const resultado = facturaCancelarEsquema.safeParse({});
      expect(resultado.success).toBe(false);
    });

    it('rechaza motivo mayor a 200 caracteres', () => {
      const resultado = facturaCancelarEsquema.safeParse({ motivo: 'a'.repeat(201) });
      expect(resultado.success).toBe(false);
    });

    it('acepta motivo de exactamente 200 caracteres', () => {
      const resultado = facturaCancelarEsquema.safeParse({ motivo: 'a'.repeat(200) });
      expect(resultado.success).toBe(true);
    });
  });
});