import { describe, it, expect } from 'vitest';
import {
  DECLARACIONES,
  CLAUSULAS,
  PARAM_DEFAULTS,
  interpolar,
  interpolarClausulas,
  interpolarDeclaraciones,
  valoresPorDefecto,
} from './contratos.clausulas';
import type { Contrato } from '@proyecto-modular/shared/tipos/contratos';

describe('CLAUSULAS / DECLARACIONES — invariantes de catálogo', () => {
  it('hay 21 cláusulas', () => {
    expect(CLAUSULAS).toHaveLength(21);
  });

  it('hay 4 declaraciones (I, II, III, IV)', () => {
    expect(DECLARACIONES).toHaveLength(4);
    expect(DECLARACIONES.map((d) => d.romano)).toEqual(['I', 'II', 'III', 'IV']);
  });

  it('todas las cláusulas tienen título y cuerpo no vacíos', () => {
    for (const c of CLAUSULAS) {
      expect(c.titulo.length).toBeGreaterThan(0);
      expect(c.cuerpo.length).toBeGreaterThan(20);
    }
  });

  it('todas las declaraciones tienen subtítulo y al menos un campo (intro o incisos)', () => {
    for (const d of DECLARACIONES) {
      expect(d.subtitulo.length).toBeGreaterThan(0);
      expect(d.introduccion !== undefined || d.incisos.length > 0).toBe(true);
    }
  });

  it('los placeholders en cláusulas corresponden a claves de PARAM_DEFAULTS', () => {
    const claves = new Set(Object.keys(PARAM_DEFAULTS));
    const placeholders = new Set<string>();
    const re = /\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/g;
    for (const c of CLAUSULAS) {
      for (const m of c.cuerpo.matchAll(re)) placeholders.add(m[1]!);
    }
    for (const d of DECLARACIONES) {
      if (d.introduccion) {
        for (const m of d.introduccion.matchAll(re)) placeholders.add(m[1]!);
      }
      for (const i of d.incisos) {
        for (const m of i.cuerpo.matchAll(re)) placeholders.add(m[1]!);
      }
    }
    for (const p of placeholders) {
      expect(claves.has(p), `Placeholder {{ ${p} }} no está en PARAM_DEFAULTS`).toBe(true);
    }
  });
});

describe('interpolar', () => {
  it('reemplaza un placeholder simple', () => {
    expect(interpolar('Hola {{ nombre }}', { nombre: 'Mundo' })).toBe('Hola Mundo');
  });

  it('reemplaza múltiples placeholders', () => {
    expect(interpolar('{{ a }} + {{ b }} = {{ a }}', { a: '1', b: '2' })).toBe('1 + 2 = 1');
  });

  it('tolera espacios alrededor del nombre', () => {
    expect(interpolar('{{  foo  }}', { foo: 'bar' })).toBe('bar');
  });

  it('usa PARAM_DEFAULTS cuando la clave no está en params', () => {
    expect(interpolar('{{ incrementoAnualPct }}%')).toBe('5%');
  });

  it('usa "A completar manualmente" cuando no hay default', () => {
    expect(interpolar('{{ claveInexistente }}')).toBe('A completar manualmente');
  });

  it('prefiere el valor explícito sobre el default', () => {
    expect(interpolar('{{ diaPago }}', { diaPago: '15' })).toBe('15');
  });

  it('trata string vacío como "no provisto" → cae al default', () => {
    expect(interpolar('{{ incrementoAnualPct }}', { incrementoAnualPct: '' })).toBe('5');
  });
});

describe('interpolarClausulas / interpolarDeclaraciones', () => {
  it('interpola todas las cláusulas', () => {
    const out = interpolarClausulas({
      arrendatarioNombre: 'JUAN PÉREZ',
      rentaMensual: '$5,000.00',
    });
    expect(out).toHaveLength(21);
    // Verifica que NO quedaron placeholders sin reemplazar
    const re = /\{\{[^}]+\}\}/;
    expect(out.some((c) => re.test(c.cuerpo))).toBe(false);
  });

  it('interpola declaraciones (incluyendo subincisos)', () => {
    const out = interpolarDeclaraciones({
      arrendadorNombre: 'ANA LÓPEZ',
      fiadorNombre: 'PEDRO RAMÍREZ',
    });
    expect(out).toHaveLength(4);
    expect(out[0]!.introduccion).toContain('ANA LÓPEZ');
    expect(out[3]!.introduccion).toContain('PEDRO RAMÍREZ');
    // La declaración II tiene incisos; verifica que se interpolaron
    expect(out[1]!.incisos.length).toBeGreaterThan(0);
    expect(out[1]!.incisos.every((i) => !re.test(i.cuerpo))).toBe(true);
  });
});

const re = /\{\{[^}]+\}\}/;

describe('valoresPorDefecto', () => {
  it('extrae datos del inquilino, propiedad y contrato', () => {
    const contrato: Contrato = {
      id: 'c1',
      propiedadId: 'p1',
      inquilinoId: 'i1',
      fechaInicio: '2026-01-01',
      fechaFin: '2026-12-31',
      rentaMensual: 5000,
      deposito: 10000,
      periodicidadPago: 'mensual',
      estatus: 'vigente',
      activo: true,
      creadoEn: '',
      actualizadoEn: '',
      inquilino: {
        id: 'i1',
        nombre: 'JUAN',
        apellidoPaterno: 'PÉREZ',
        apellidoMaterno: 'LÓPEZ',
        telefono: '555',
        activo: true,
        creadoEn: '',
        actualizadoEn: '',
        identificacionOficial: 'INE 12345',
        estadoCivil: 'soltero',
        nacionalidad: 'mexicano',
        ocupacion: 'ingeniero',
        domicilio: {
          calle: 'Av. Reforma',
          numero: '100',
          colonia: 'Centro',
          codigoPostal: '06000',
          ciudad: 'CDMX',
          estado: 'CDMX',
        },
      },
      propiedad: {
        id: 'p1',
        nombre: 'Casa Providencia',
        tipo: 'casa',
        activa: true,
        creadaEn: '',
        actualizadaEn: '',
        direccion: {
          calle: 'Providencia',
          numero: '741',
          colonia: 'Providencia',
          codigoPostal: '44630',
          ciudad: 'Guadalajara',
          estado: 'Jalisco',
        },
      },
    };

    const params = valoresPorDefecto(contrato);
    expect(params.arrendatarioNombre).toBe('JUAN PÉREZ LÓPEZ');
    expect(params.inmuebleDireccion).toContain('Guadalajara');
    expect(params.rentaMensual).toBe('$5,000.00');
    expect(params.rentaMensualLetra).toContain('CINCO MIL');
    expect(params.deposito).toBe('$10,000.00');
    expect(params.depositoLetra).toContain('DIEZ MIL');
    expect(params.vigenciaMeses).toBe('11');
    expect(params.lugarFirma).toBe('Guadalajara');
  });

  it('produce un objeto que al interpolar deja las cláusulas sin placeholders', () => {
    const contrato: Contrato = {
      id: 'c1',
      propiedadId: 'p1',
      inquilinoId: 'i1',
      fechaInicio: '2026-01-01',
      fechaFin: '2026-12-31',
      rentaMensual: 5000,
      deposito: 10000,
      periodicidadPago: 'mensual',
      estatus: 'vigente',
      activo: true,
      creadoEn: '',
      actualizadoEn: '',
    };
    const params = valoresPorDefecto(contrato);
    const out = interpolarClausulas(params);
    expect(out.every((c) => !re.test(c.cuerpo))).toBe(true);
  });
});
