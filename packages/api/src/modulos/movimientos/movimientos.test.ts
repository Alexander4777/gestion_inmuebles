import { describe, it, expect } from 'vitest';
import {
  movimientoEsquema,
  estadoResultadosEsquema,
} from '@proyecto-modular/shared/esquemas/contabilidad';

describe('Módulo de Contabilidad', () => {
  const ingresoValido = {
    tipo: 'ingreso' as const,
    categoria: 'renta' as const,
    monto: 15000,
    descripcion: 'Renta mensual junio',
    fecha: '2026-06-01',
  };

  const gastoValido = {
    tipo: 'gasto' as const,
    categoria: 'luz' as const,
    monto: 850,
    descripcion: 'Recibo de luz',
    fecha: '2026-06-15',
  };

  describe('movimientoEsquema (validación de ingresos)', () => {
    it('acepta ingreso válido', () => {
      const resultado = movimientoEsquema.safeParse(ingresoValido);
      expect(resultado.success).toBe(true);
    });

    it('acepta referencias opcionales (propiedad/contrato/factura)', () => {
      const resultado = movimientoEsquema.safeParse({
        ...ingresoValido,
        propiedadId: '123e4567-e89b-12d3-a456-426614174000',
        contratoId: '223e4567-e89b-12d3-a456-426614174000',
        facturaId: '323e4567-e89b-12d3-a456-426614174000',
      });
      expect(resultado.success).toBe(true);
    });

    it('rechaza monto cero', () => {
      const resultado = movimientoEsquema.safeParse({ ...ingresoValido, monto: 0 });
      expect(resultado.success).toBe(false);
    });

    it('rechaza monto negativo', () => {
      const resultado = movimientoEsquema.safeParse({ ...ingresoValido, monto: -100 });
      expect(resultado.success).toBe(false);
    });

    it('rechaza fecha con formato incorrecto', () => {
      const resultado = movimientoEsquema.safeParse({ ...ingresoValido, fecha: '01/06/2026' });
      expect(resultado.success).toBe(false);
    });

    it('rechaza descripción vacía', () => {
      const resultado = movimientoEsquema.safeParse({ ...ingresoValido, descripcion: '' });
      expect(resultado.success).toBe(false);
    });

    it('rechaza UUID inválido en propiedadId', () => {
      const resultado = movimientoEsquema.safeParse({ ...ingresoValido, propiedadId: 'no-uuid' });
      expect(resultado.success).toBe(false);
    });
  });

  describe('categorías de ingreso', () => {
    it.each(['renta', 'deposito', 'otro-ingreso'] as const)('acepta categoría de ingreso: %s', (cat) => {
      const resultado = movimientoEsquema.safeParse({ ...ingresoValido, categoria: cat });
      expect(resultado.success).toBe(true);
    });
  });

  describe('categorías de gasto', () => {
    it.each([
      'luz',
      'internet',
      'predial',
      'honorarios-administrador',
      'mantenimiento',
      'sat',
      'otro-gasto',
    ] as const)('acepta categoría de gasto: %s', (cat) => {
      const resultado = movimientoEsquema.safeParse({ ...gastoValido, categoria: cat });
      expect(resultado.success).toBe(true);
    });
  });

  describe('estadoResultadosEsquema (validación de query)', () => {
    it('acepta mes y año válidos', () => {
      const resultado = estadoResultadosEsquema.safeParse({ mes: '6', año: '2026' });
      expect(resultado.success).toBe(true);
      if (resultado.success) {
        expect(resultado.data.mes).toBe(6);
        expect(resultado.data.año).toBe(2026);
      }
    });

    it('rechaza mes fuera de rango', () => {
      const resultado = estadoResultadosEsquema.safeParse({ mes: '13', año: '2026' });
      expect(resultado.success).toBe(false);
    });

    it('rechaza año fuera de rango', () => {
      const resultado = estadoResultadosEsquema.safeParse({ mes: '6', año: '1999' });
      expect(resultado.success).toBe(false);
    });

    it('rechaza mes 0', () => {
      const resultado = estadoResultadosEsquema.safeParse({ mes: '0', año: '2026' });
      expect(resultado.success).toBe(false);
    });
  });
});