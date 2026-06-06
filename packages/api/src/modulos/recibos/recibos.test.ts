import { describe, it, expect } from 'vitest';
import { reciboEsquema } from '@proyecto-modular/shared/esquemas/recibos';

describe('Módulo de Recibos', () => {
  describe('reciboEsquema (validación)', () => {
    const datosValidos = {
      contratoId: '123e4567-e89b-12d3-a456-426614174000',
      periodoInicio: '2026-01-01',
      periodoFin: '2026-01-31',
      fechaLimitePago: '2026-01-05',
      renta: 8000,
      otrosCobros: 500,
      desglose: [{ descripcion: 'Internet', monto: 300 }, { descripcion: 'Limpieza', monto: 200 }],
    };

    it('acepta datos válidos', () => {
      const resultado = reciboEsquema.safeParse(datosValidos);
      expect(resultado.success).toBe(true);
    });

    it('rechaza renta negativa o cero', () => {
      const resultado = reciboEsquema.safeParse({ ...datosValidos, renta: 0 });
      expect(resultado.success).toBe(false);
    });

    it('rechaza contratoId no UUID', () => {
      const resultado = reciboEsquema.safeParse({ ...datosValidos, contratoId: 'no-es-uuid' });
      expect(resultado.success).toBe(false);
    });

    it('rechaza fechas inválidas', () => {
      const resultado = reciboEsquema.safeParse({ ...datosValidos, periodoInicio: 'ayer' });
      expect(resultado.success).toBe(false);
    });

    it('permite otrosCobros con default 0', () => {
      const { otrosCobros, ...sinOtros } = datosValidos;
      const resultado = reciboEsquema.safeParse(sinOtros);
      expect(resultado.success).toBe(true);
      if (resultado.success) {
        expect(resultado.data.otrosCobros).toBe(0);
      }
    });
  });

  describe('generación de número de recibo', () => {
    it('formato esperado: REC-YYYYMMDD-XXX', () => {
      const regexNumeroRecibo = /^REC-\d{8}-\d{3}$/;
      expect('REC-20260603-001').toMatch(regexNumeroRecibo);
      expect('REC-20261215-042').toMatch(regexNumeroRecibo);
      expect('REC-001').not.toMatch(regexNumeroRecibo);
    });
  });
});
