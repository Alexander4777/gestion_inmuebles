import { describe, it, expect } from 'vitest';
import { inquilinoEsquema } from '../esquemas/inquilinos';
import { contratoEsquema } from '../esquemas/contratos';
import { reciboEsquema } from '../esquemas/recibos';

describe('Esquemas Zod — Smoke Test', () => {
  it('valida un inquilino correcto', () => {
    const resultado = inquilinoEsquema.safeParse({
      nombre: 'Juan',
      apellidoPaterno: 'Pérez',
      apellidoMaterno: 'García',
      rfc: 'PEGJ900101ABC',
      telefono: '5512345678',
    });
    expect(resultado.success).toBe(true);
  });

  it('rechaza un inquilino con RFC inválido', () => {
    const resultado = inquilinoEsquema.safeParse({
      nombre: 'Juan',
      apellidoPaterno: 'Pérez',
      apellidoMaterno: 'García',
      rfc: 'INVALIDO',
      telefono: '5512345678',
    });
    expect(resultado.success).toBe(false);
  });

  it('valida un contrato correcto', () => {
    const resultado = contratoEsquema.safeParse({
      propiedadId: '00000000-0000-0000-0000-000000000001',
      inquilinoId: '00000000-0000-0000-0000-000000000002',
      fechaInicio: '2026-07-01',
      fechaFin: '2027-06-30',
      rentaMensual: 15000,
      deposito: 15000,
      periodicidadPago: 'mensual',
    });
    expect(resultado.success).toBe(true);
  });

  it('valida un recibo con desglose', () => {
    const resultado = reciboEsquema.safeParse({
      contratoId: '00000000-0000-0000-0000-000000000001',
      periodoInicio: '2026-07-01',
      periodoFin: '2026-07-31',
      fechaLimitePago: '2026-07-05',
      renta: 15000,
      otrosCobros: 500,
      desglose: [
        { descripcion: 'Internet', monto: 300 },
        { descripcion: 'Luz', monto: 200 },
      ],
    });
    expect(resultado.success).toBe(true);
  });

  it('rechaza una renta negativa', () => {
    const resultado = reciboEsquema.safeParse({
      contratoId: '00000000-0000-0000-0000-000000000001',
      periodoInicio: '2026-07-01',
      periodoFin: '2026-07-31',
      fechaLimitePago: '2026-07-05',
      renta: -100,
    });
    expect(resultado.success).toBe(false);
  });
});
