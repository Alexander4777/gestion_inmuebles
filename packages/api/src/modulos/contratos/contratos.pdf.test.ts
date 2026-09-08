import { describe, it, expect } from 'vitest';
import { generarPDFContrato } from './contratos.pdf';
import type { Contrato } from '@proyecto-modular/shared/tipos/contratos';

const contratoMock: Contrato = {
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
  inquilino: {
    id: '22222222-2222-2222-2222-222222222222',
    nombre: 'Juan',
    apellidoPaterno: 'Pérez',
    apellidoMaterno: 'López',
    rfc: 'PELJ800101ABC',
    curp: 'PELJ800101HDFRPN09',
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

describe('generarPDFContrato', () => {
  it('produce un buffer con magic bytes PDF', async () => {
    const buf = await generarPDFContrato(contratoMock);
    expect(buf.slice(0, 4).toString('latin1')).toBe('%PDF');
  });

  it('produce un PDF sustancial (21 cláusulas + 4 declaraciones)', async () => {
    // Umbral alto porque el contrato ahora trae 21 cláusulas + 4 declaraciones
    // + subincisos + líneas de firma. ~10 KB es un piso conservador.
    const buf = await generarPDFContrato(contratoMock);
    expect(buf.byteLength).toBeGreaterThan(10_000);
  });

  it('incluye el título en el metadata dict (no FlateDecode)', async () => {
    // PDFKit guarda el título en el info dict sin comprimir, así que
    // podemos verificarlo sin descomprimir los streams.
    const buf = await generarPDFContrato(contratoMock);
    const texto = buf.toString('latin1');
    expect(texto).toContain('CONTRATO');
    expect(texto).toContain('ARRENDAMIENTO');
  });

  it('funciona sin relaciones opcionales (inquilino/propiedad undefined)', async () => {
    const sinRelaciones: Contrato = { ...contratoMock, inquilino: undefined, propiedad: undefined };
    const buf = await generarPDFContrato(sinRelaciones);
    expect(buf.slice(0, 4).toString('latin1')).toBe('%PDF');
    // Aún con placeholders "A completar manualmente", el contrato debe
    // mantenerse sobre el umbral mínimo.
    expect(buf.byteLength).toBeGreaterThan(10_000);
  });

  it('idempotente: dos llamadas producen el mismo número de páginas', async () => {
    const a = await generarPDFContrato(contratoMock);
    const b = await generarPDFContrato(contratoMock);
    // /Type /Page (no /Pages) aparece una vez por página
    const pagesA = (a.toString('latin1').match(/\/Type \/Page[^s]/g) ?? []).length;
    const pagesB = (b.toString('latin1').match(/\/Type \/Page[^s]/g) ?? []).length;
    expect(pagesA).toBe(pagesB);
  });
});
