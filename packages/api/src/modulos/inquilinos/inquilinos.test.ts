import { describe, it, expect } from 'vitest';
import { inquilinoEsquema } from '@proyecto-modular/shared/esquemas/inquilinos';

describe('Módulo de Inquilinos', () => {
  const datosValidos = {
    nombre: 'Juan',
    apellidoPaterno: 'Pérez',
    apellidoMaterno: 'García',
    telefono: '5551234567',
    correo: 'juan@example.com',
  };

  describe('inquilinoEsquema (validación)', () => {
    it('acepta datos mínimos válidos', () => {
      const resultado = inquilinoEsquema.safeParse(datosValidos);
      expect(resultado.success).toBe(true);
    });

    it('acepta sin RFC ni CURP ni correo', () => {
      const minimo = {
        nombre: 'Juan',
        apellidoPaterno: 'Pérez',
        apellidoMaterno: 'García',
        telefono: '5551234567',
      };
      const resultado = inquilinoEsquema.safeParse(minimo);
      expect(resultado.success).toBe(true);
    });

    it('rechaza nombre vacío', () => {
      const resultado = inquilinoEsquema.safeParse({ ...datosValidos, nombre: '' });
      expect(resultado.success).toBe(false);
    });

    it('rechaza teléfono con menos de 10 dígitos', () => {
      const resultado = inquilinoEsquema.safeParse({ ...datosValidos, telefono: '123' });
      expect(resultado.success).toBe(false);
    });

    it('rechaza correo inválido', () => {
      const resultado = inquilinoEsquema.safeParse({ ...datosValidos, correo: 'no-es-correo' });
      expect(resultado.success).toBe(false);
    });

    it('acepta RFC válido (13 caracteres con formato SAT)', () => {
      const resultado = inquilinoEsquema.safeParse({ ...datosValidos, rfc: 'PEGJ800101ABC' });
      expect(resultado.success).toBe(true);
    });

    it('rechaza RFC con longitud incorrecta', () => {
      const resultado = inquilinoEsquema.safeParse({ ...datosValidos, rfc: 'PEGJ' });
      expect(resultado.success).toBe(false);
    });

    it('rechaza CURP con longitud incorrecta', () => {
      const resultado = inquilinoEsquema.safeParse({ ...datosValidos, curp: 'Corto' });
      expect(resultado.success).toBe(false);
    });
  });
});
