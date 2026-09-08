import { describe, it, expect } from 'vitest';
import {
  numeroALetrasMX,
  numeroALetrasEntero,
  formatearFechaNarrativa,
  formatearFechaLarga,
} from './formatos';

describe('numeroALetrasEntero', () => {
  it.each([
    [0, 'CERO'],
    [1, 'UNO'],
    [2, 'DOS'],
    [9, 'NUEVE'],
    [10, 'DIEZ'],
    [11, 'ONCE'],
    [15, 'QUINCE'],
    [20, 'VEINTE'],
    [21, 'VEINTIÚN'],
    [22, 'VEINTIDÓS'],
    [26, 'VEINTISÉIS'],
    [29, 'VEINTINUEVE'],
    [30, 'TREINTA'],
    [32, 'TREINTA Y DOS'],
    [40, 'CUARENTA'],
    [99, 'NOVENTA Y NUEVE'],
    [100, 'CIEN'],
    [101, 'CIENTO UNO'],
    [199, 'CIENTO NOVENTA Y NUEVE'],
    [200, 'DOSCIENTOS'],
    [500, 'QUINIENTOS'],
    [900, 'NOVECIENTOS'],
    [999, 'NOVECIENTOS NOVENTA Y NUEVE'],
    [1000, 'MIL'],
    [1001, 'MIL UNO'],
    [1234, 'MIL DOSCIENTOS TREINTA Y CUATRO'],
    [5000, 'CINCO MIL'],
    [10000, 'DIEZ MIL'],
    [100000, 'CIEN MIL'],
    [1000000, 'UN MILLÓN'],
    [1000001, 'UN MILLÓN UNO'],
    [1500000, 'UN MILLÓN QUINIENTOS MIL'],
    [12345678, 'DOCE MILLONES TRESCIENTOS CUARENTA Y CINCO MIL SEISCIENTOS SETENTA Y OCHO'],
  ])('numeroALetrasEntero(%i) === %s', (input, expected) => {
    expect(numeroALetrasEntero(input)).toBe(expected);
  });

  it('lanza RangeError para negativos', () => {
    expect(() => numeroALetrasEntero(-1)).toThrow(RangeError);
  });

  it('lanza RangeError para > 999_999_999', () => {
    expect(() => numeroALetrasEntero(1_000_000_000)).toThrow(RangeError);
  });

  it('lanza RangeError para no enteros', () => {
    expect(() => numeroALetrasEntero(1.5)).toThrow(RangeError);
  });
});

describe('numeroALetrasMX', () => {
  it.each([
    [0, 'CERO PESOS 00/100 M.N.'],
    [1, 'UNO PESO 00/100 M.N.'], // singular gramaticalmente correcto
    [2, 'DOS PESOS 00/100 M.N.'],
    [5000, 'CINCO MIL PESOS 00/100 M.N.'],
    [5000.0, 'CINCO MIL PESOS 00/100 M.N.'],
    [1234.56, 'MIL DOSCIENTOS TREINTA Y CUATRO PESOS 56/100 M.N.'],
    [100.5, 'CIEN PESOS 50/100 M.N.'],
    [0.99, 'CERO PESOS 99/100 M.N.'],
    [999999999.99, 'NOVECIENTOS NOVENTA Y NUEVE MILLONES NOVECIENTOS NOVENTA Y NUEVE MIL NOVECIENTOS NOVENTA Y NUEVE PESOS 99/100 M.N.'],
  ])('numeroALetrasMX(%s) === %s', (input, expected) => {
    expect(numeroALetrasMX(input)).toBe(expected);
  });

  it('siempre rellena centavos a 2 dígitos', () => {
    expect(numeroALetrasMX(10.05)).toBe('DIEZ PESOS 05/100 M.N.');
    expect(numeroALetrasMX(10.5)).toBe('DIEZ PESOS 50/100 M.N.');
  });

  it('lanza RangeError para negativos', () => {
    expect(() => numeroALetrasMX(-1)).toThrow(RangeError);
  });

  it('lanza RangeError para > 999_999_999.99', () => {
    expect(() => numeroALetrasMX(1_000_000_000)).toThrow(RangeError);
  });
});

describe('formatearFechaNarrativa', () => {
  it('produce formato con "del" antes del año', () => {
    expect(formatearFechaNarrativa('2026-09-01')).toBe('1 de septiembre del 2026');
    expect(formatearFechaNarrativa('2026-01-15')).toBe('15 de enero del 2026');
    expect(formatearFechaNarrativa('2026-12-31')).toBe('31 de diciembre del 2026');
  });

  it('acepta objetos Date', () => {
    const d = new Date('2026-09-01T00:00:00');
    expect(formatearFechaNarrativa(d)).toBe('1 de septiembre del 2026');
  });

  it('difiere de formatearFechaLarga (que usa "de")', () => {
    const iso = '2026-09-01';
    expect(formatearFechaLarga(iso)).toMatch(/ de 2026$/); // "de 2026"
    expect(formatearFechaNarrativa(iso)).toMatch(/ del 2026$/); // "del 2026"
  });
});
