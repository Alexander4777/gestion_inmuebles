// Script ad-hoc: genera PDFs de ejemplo y los escribe a /tmp para inspección.
// NO parte de los tests — solo para verificación visual durante implementación.
//
// Ejecutar con: cd packages/api && npx tsx scripts/smoke-pdf.ts
import fs from 'node:fs';
import { generarPDFContrato } from '../src/modulos/contratos/contratos.pdf';
import { generarPDFRecibo } from '../src/modulos/recibos/recibos.pdf';
import type { Contrato } from '@proyecto-modular/shared/tipos/contratos';
import type { DetalleRecibo } from '@proyecto-modular/shared/tipos/recibos';

const contrato: Contrato = {
  id: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
  propiedadId: '11111111-1111-1111-1111-111111111111',
  inquilinoId: '22222222-2222-2222-2222-222222222222',
  fechaInicio: '2026-01-15',
  fechaFin: '2027-01-14',
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
    nombre: 'Casa Centro Histórico',
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

const recibo: DetalleRecibo = {
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
    fechaInicio: '2026-01-15',
    fechaFin: '2027-01-14',
    rentaMensual: 15000,
    deposito: 15000,
    periodicidadPago: 'mensual',
    estatus: 'vigente',
    activo: true,
    creadoEn: new Date().toISOString(),
    actualizadoEn: new Date().toISOString(),
  },
  inquilino: contrato.inquilino,
  propiedad: contrato.propiedad,
};

(async () => {
  const bufContrato = await generarPDFContrato(contrato);
  fs.writeFileSync('/tmp/contrato.pdf', bufContrato);
  console.log(`contrato.pdf: ${bufContrato.byteLength} bytes`);

  const bufRecibo = await generarPDFRecibo(recibo);
  fs.writeFileSync('/tmp/recibo.pdf', bufRecibo);
  console.log(`recibo.pdf:   ${bufRecibo.byteLength} bytes`);
})();