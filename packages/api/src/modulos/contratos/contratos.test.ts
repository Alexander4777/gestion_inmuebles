import { describe, it, expect } from 'vitest';
import { contratoEsquema } from '@proyecto-modular/shared/esquemas/contratos';

describe('Módulo de Contratos', () => {
  const datosValidos = {
    propiedadId: '123e4567-e89b-12d3-a456-426614174000',
    inquilinoId: '987fcdeb-51a2-43d1-9f4b-1234567890ab',
    fechaInicio: '2026-01-01',
    fechaFin: '2027-01-01',
    rentaMensual: 8000,
    deposito: 8000,
    periodicidadPago: 'mensual' as const,
  };

  describe('contratoEsquema (validación)', () => {
    it('acepta datos válidos', () => {
      const resultado = contratoEsquema.safeParse(datosValidos);
      expect(resultado.success).toBe(true);
    });

    it('rechaza rentaMensual negativa o cero', () => {
      const resultado = contratoEsquema.safeParse({ ...datosValidos, rentaMensual: 0 });
      expect(resultado.success).toBe(false);
    });

    it('rechaza depósito negativo', () => {
      const resultado = contratoEsquema.safeParse({ ...datosValidos, deposito: -100 });
      expect(resultado.success).toBe(false);
    });

    it('rechaza periodicidad inválida', () => {
      const resultado = contratoEsquema.safeParse({ ...datosValidos, periodicidadPago: 'semanal' });
      expect(resultado.success).toBe(false);
    });

    it('rechaza UUID inválido en propiedad', () => {
      const resultado = contratoEsquema.safeParse({ ...datosValidos, propiedadId: 'no-uuid' });
      expect(resultado.success).toBe(false);
    });
  });

  describe('periodicidades soportadas', () => {
    it.each(['mensual', 'bimestral', 'anual'] as const)('acepta %s', (periodo) => {
      const resultado = contratoEsquema.safeParse({ ...datosValidos, periodicidadPago: periodo });
      expect(resultado.success).toBe(true);
    });
  });
});
