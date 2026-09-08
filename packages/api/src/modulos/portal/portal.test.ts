/**
 * Tests del módulo portal.
 *
 * Cubre:
 *  - requerirRol: 401 sin req.usuario, 403 con rol incorrecto
 *  - portalService: contrato vigente (auto-fixture), inquilino sin contrato → null
 *
 * Los endpoints HTTP no se prueban con supertest (no es dependencia).
 * La lógica de filtrado y autorización está cubierta por los unit tests.
 *
 * Cada test que toca DB inserta sus propios registros y los limpia al final,
 * para que la suite sea repetible sin depender del seed externo.
 */

import { describe, it, expect, afterEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { requerirRol } from '../../core/auth';
import { portalService } from './portal.service';
import { db } from '../../core/db';
import { contratos, inquilinos, propiedades } from '../../core/db/esquema';
import { eq } from 'drizzle-orm';

function mockReq(usuario?: { rol: string; sub: string; inquilinoId?: string }): Request {
  return { usuario } as unknown as Request;
}

function mockRes(): Response & { statusCode?: number; body?: unknown } {
  const res = {} as Response & { statusCode?: number; body?: unknown };
  res.status = (code: number) => {
    res.statusCode = code;
    return res as Response;
  };
  res.json = (body: unknown) => {
    res.body = body;
    return res as Response;
  };
  return res;
}

describe('requerirRol middleware', () => {
  it('devuelve 401 si no hay req.usuario', () => {
    const res = mockRes();
    const next = (() => {}) as NextFunction;
    requerirRol('inquilino')(mockReq(), res, next);
    expect(res.statusCode).toBe(401);
  });

  it('devuelve 403 si el rol no está en la lista permitida', () => {
    const res = mockRes();
    const next = (() => {}) as NextFunction;
    requerirRol('inquilino')(mockReq({ rol: 'admin', sub: 'admin' }), res, next);
    expect(res.statusCode).toBe(403);
  });

  it('llama next() si el rol está permitido', () => {
    const res = mockRes();
    let nextCalled = false;
    const next = (() => {
      nextCalled = true;
    }) as NextFunction;
    requerirRol('admin', 'inquilino')(
      mockReq({ rol: 'inquilino', sub: 'abc' }),
      res,
      next,
    );
    expect(nextCalled).toBe(true);
    expect(res.statusCode).toBeUndefined();
  });
});

describe('portalService.obtenerContratoVigente', () => {
  // IDs creados en el test, para limpiar al final (orden inverso a las FK).
  const creados: { contratos: string[]; inquilinos: string[]; propiedades: string[] } = {
    contratos: [],
    inquilinos: [],
    propiedades: [],
  };

  afterEach(async () => {
    if (creados.contratos.length > 0) {
      await db.delete(contratos).where(eq(contratos.id, creados.contratos[0]!));
      creados.contratos = [];
    }
    if (creados.inquilinos.length > 0) {
      await db.delete(inquilinos).where(eq(inquilinos.id, creados.inquilinos[0]!));
      creados.inquilinos = [];
    }
    if (creados.propiedades.length > 0) {
      await db.delete(propiedades).where(eq(propiedades.id, creados.propiedades[0]!));
      creados.propiedades = [];
    }
  });

  it('devuelve null para un inquilino sin contrato', async () => {
    const [nuevo] = await db
      .insert(inquilinos)
      .values({
        nombre: 'Sin',
        apellidoPaterno: 'Contrato',
        apellidoMaterno: 'Test',
        telefono: '5500000000',
        correo: `sin-contrato-${Date.now()}@test.local`,
        activo: true,
      })
      .returning();
    expect(nuevo).toBeDefined();
    creados.inquilinos.push(nuevo!.id);

    const resultado = await portalService.obtenerContratoVigente(nuevo!.id);
    expect(resultado).toBeNull();
  });

  it('devuelve el contrato vigente (auto-fixture)', async () => {
    // Propiedad de prueba
    const [prop] = await db
      .insert(propiedades)
      .values({
        nombre: 'Depto Polanco Test',
        calle: 'Calle Test',
        numero: '123',
        colonia: 'Polanco',
        codigoPostal: '11560',
        ciudad: 'CDMX',
        estado: 'CDMX',
        tipo: 'departamento',
        activa: true,
      })
      .returning();
    expect(prop).toBeDefined();
    creados.propiedades.push(prop!.id);

    // Inquilino de prueba
    const [inq] = await db
      .insert(inquilinos)
      .values({
        nombre: 'Ana',
        apellidoPaterno: 'Test',
        apellidoMaterno: 'Contrato',
        telefono: '5512345678',
        correo: `ana-test-${Date.now()}@test.local`,
        activo: true,
      })
      .returning();
    expect(inq).toBeDefined();
    creados.inquilinos.push(inq!.id);

    // Contrato vigente (estatus='vigente', activo=true)
    const [cto] = await db
      .insert(contratos)
      .values({
        propiedadId: prop!.id,
        inquilinoId: inq!.id,
        fechaInicio: '2026-01-15',
        fechaFin: '2027-01-14',
        rentaMensual: '18000',
        deposito: '18000',
        periodicidadPago: 'mensual',
        estatus: 'vigente',
        activo: true,
      })
      .returning();
    expect(cto).toBeDefined();
    creados.contratos.push(cto!.id);

    const resultado = await portalService.obtenerContratoVigente(inq!.id);
    expect(resultado).not.toBeNull();
    expect(resultado!.inquilinoId).toBe(inq!.id);
    expect(resultado!.estatus).toBe('vigente');
    expect(resultado!.activo).toBe(true);
    expect(resultado!.propiedad).toBeDefined();
    expect(resultado!.propiedad!.nombre).toBe('Depto Polanco Test');
  });
});
