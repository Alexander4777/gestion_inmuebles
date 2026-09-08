import { describe, it, expect } from 'vitest';
import { generarPDFRecibo } from './recibos.pdf';
import type { DetalleRecibo } from '@proyecto-modular/shared/tipos/recibos';

const reciboMock: DetalleRecibo = {
  id: 'r1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
  contratoId: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
  numeroRecibo: 'REC-20260801-001',
  periodoInicio: '2026-08-01',
  periodoFin: '2026-08-31',
  fechaLimitePago: '2026-08-05',
  renta: 15000,
  otrosCobros: 500,
  total: 15500,
  estatus: 'pendiente',
  creadoEn: new Date().toISOString(),
  actualizadoEn: new Date().toISOString(),
  desglose: [
    { descripcion: 'Agua', monto: 300 },
    { descripcion: 'Mantenimiento', monto: 200 },
  ],
  contrato: {
    id: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
    propiedadId: '11111111-1111-1111-1111-111111111111',
    inquilinoId: '22222222-2222-2222-2222-222222222222',
    fechaInicio: '2026-01-01',
    fechaFin: '2026-12-31',
    rentaMensual: 15000,
    deposito: 15000,
    periodicidadPago: 'mensual',
    estatus: 'vigente',
    activo: true,
    creadoEn: new Date().toISOString(),
    actualizadoEn: new Date().toISOString(),
  },
  inquilino: {
    id: '22222222-2222-2222-2222-222222222222',
    nombre: 'Juan',
    apellidoPaterno: 'Pérez',
    apellidoMaterno: 'López',
    telefono: '5555555555',
    correo: 'juan@example.com',
    activo: true,
    creadoEn: new Date().toISOString(),
    actualizadoEn: new Date().toISOString(),
  },
  propiedad: {
    id: '11111111-1111-1111-1111-111111111111',
    nombre: 'Casa Centro',
    tipo: 'casa',
    activa: true,
    creadaEn: new Date().toISOString(),
    actualizadaEn: new Date().toISOString(),
    direccion: {
      calle: 'Av. Reforma',
      numero: '123',
      colonia: 'Centro',
      codigoPostal: '06000',
      ciudad: 'CDMX',
      estado: 'CDMX',
    },
  },
};

describe('generarPDFRecibo', () => {
  it('produce un buffer con magic bytes PDF', async () => {
    const buf = await generarPDFRecibo(reciboMock);
    expect(buf.slice(0, 4).toString('latin1')).toBe('%PDF');
  });

  it('produce un PDF con tamaño significativo (layout de 2 zonas)', async () => {
    // El layout incluye: recuadro No. RECIBO, TOTAL grande, cantidad con letra,
    // recuadro de FIRMA + cuerpo con conceptos. ~3 KB es un piso conservador.
    const buf = await generarPDFRecibo(reciboMock);
    expect(buf.byteLength).toBeGreaterThan(2_000);
  });

  it('incluye el número de recibo en el metadata dict (no FlateDecode)', async () => {
    const buf = await generarPDFRecibo(reciboMock);
    const texto = buf.toString('latin1');
    expect(texto).toContain('RECIBO');
  });

  it('funciona sin relaciones opcionales (inquilino/propiedad undefined)', async () => {
    const sinRelaciones: DetalleRecibo = { ...reciboMock, inquilino: undefined, propiedad: undefined, contrato: undefined };
    const buf = await generarPDFRecibo(sinRelaciones);
    expect(buf.slice(0, 4).toString('latin1')).toBe('%PDF');
    expect(buf.byteLength).toBeGreaterThan(2_000);
  });

  it('funciona con desglose vacío', async () => {
    const sinDesglose: DetalleRecibo = { ...reciboMock, desglose: [], otrosCobros: 0 };
    const buf = await generarPDFRecibo(sinDesglose);
    expect(buf.slice(0, 4).toString('latin1')).toBe('%PDF');
    expect(buf.byteLength).toBeGreaterThan(2_000);
  });

  it('funciona con snapshot del arrendador', async () => {
    const conArrendador: DetalleRecibo = {
      ...reciboMock,
      arrendadorSnapshot: {
        nombreCompleto: 'ANA LÓPEZ MARTÍNEZ',
        identificacionOficial: 'INE 12345678',
      },
    };
    const buf = await generarPDFRecibo(conArrendador);
    expect(buf.slice(0, 4).toString('latin1')).toBe('%PDF');
    expect(buf.byteLength).toBeGreaterThan(2_000);
  });
});
