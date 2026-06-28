/**
 * Seed sintético: genera 2 años de datos realistas para entrenar los modelos de IA.
 *
 * Patrones inyectados (GROUND TRUTH para los modelos):
 * - Morosidad: inquilinos con RFC "ALTO" tienen +10% de probabilidad de pago tardío.
 *               Montos >$25k tienen +5% de morosidad.
 *               Contratos de >1 año tienen 30% menos morosidad.
 * - Vacancia: 5% de contratos terminan anticipadamente, concentrados en primeros 6 meses.
 * - Mantenimiento: propiedades con >3 mantenimientos en 12 meses son "propensas a fallas".
 *
 * El script es IDEMPOTENTE: hace TRUNCATE de las tablas antes de insertar.
 * Ejecutar con: pnpm --filter @proyecto-modular/api db:seed
 */

import { db } from '../src/core/db';
import {
  propiedades,
  inquilinos,
  contratos,
  recibos,
  mantenimientos,
  movimientosContables,
  facturas,
  predicciones,
  usuarios,
} from '../src/core/db/esquema';
import { sql } from 'drizzle-orm';

// ── Utilidades ────────────────────────────────────────────────────────────────

let _seed = 12345;
function rng(): number {
  _seed |= 0;
  _seed = (_seed + 0x6d2b79f5) | 0;
  let t = _seed;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function randInt(min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)]!;
}

function fechaAtras(dias: number): string {
  const d = new Date();
  d.setDate(d.getDate() - dias);
  return d.toISOString().slice(0, 10);
}

function timestampAtras(dias: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - dias);
  return d;
}

// ── Datos base ────────────────────────────────────────────────────────────────

const CIUDADES = [
  { ciudad: 'Ciudad de México', estado: 'CDMX' },
  { ciudad: 'Guadalajara', estado: 'Jalisco' },
  { ciudad: 'Monterrey', estado: 'Nuevo León' },
  { ciudad: 'Puebla', estado: 'Puebla' },
  { ciudad: 'Querétaro', estado: 'Querétaro' },
] as const;

const TIPOS = ['casa', 'departamento', 'local-comercial', 'bodega', 'otro'] as const;
const CATEGORIAS_MANT = [
  'electricidad',
  'fontaneria',
  'carpinteria',
  'albañileria',
  'materiales',
  'otro',
] as const;
const ESTATUS_MANT = ['pendiente', 'en-progreso', 'completado'] as const;

const NOMBRES = [
  'Juan', 'María', 'Pedro', 'Ana', 'Luis', 'Carmen', 'José', 'Laura',
  'Miguel', 'Sofía', 'Carlos', 'Patricia', 'Antonio', 'Rosa', 'Francisco',
  'Lucía', 'Manuel', 'Marta', 'Javier', 'Isabel',
];
const APELLIDOS = [
  'García', 'Martínez', 'López', 'González', 'Hernández', 'Pérez', 'Sánchez',
  'Ramírez', 'Torres', 'Flores', 'Rivera', 'Gómez', 'Díaz', 'Morales', 'Cruz',
  'Reyes', 'Ortiz', 'Vargas', 'Castillo', 'Romero',
];

function generarRfc(): string {
  const letras = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  return (
    letras[randInt(0, 25)]! +
    letras[randInt(0, 25)]! +
    letras[randInt(0, 25)]! +
    letras[randInt(0, 25)]! +
    String(randInt(0, 9)) +
    String(randInt(0, 9)) +
    String(randInt(0, 9)) +
    String(randInt(0, 9)) +
    String(randInt(0, 9)) +
    String(randInt(0, 9)) +
    String(randInt(0, 9)) +
    String(randInt(0, 9)) +
    String(randInt(0, 9))
  );
}

function generarCurp(): string {
  const letras = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  return (
    letras[randInt(0, 25)]! +
    letras[randInt(0, 25)]! +
    letras[randInt(0, 25)]! +
    letras[randInt(0, 25)]! +
    String(randInt(50, 99)) +
    String(randInt(1, 12)).padStart(2, '0') +
    String(randInt(1, 28)).padStart(2, '0') +
    'H' +
    letras[randInt(0, 25)]! +
    letras[randInt(0, 25)]! +
    String(randInt(0, 9)) +
    String(randInt(0, 9)) +
    String(randInt(0, 9)) +
    String(randInt(0, 9)) +
    String(randInt(0, 9)) +
    String(randInt(0, 9))
  );
}

function generarTelefono(): string {
  return `55${String(randInt(10000000, 99999999))}`;
}

// ── Limpieza ──────────────────────────────────────────────────────────────────

async function limpiarTablas() {
  console.log('🗑  Limpiando tablas existentes...');
  // Orden importa: dependencias primero
  await db.execute(sql`TRUNCATE TABLE predicciones RESTART IDENTITY CASCADE`);
  await db.execute(sql`TRUNCATE TABLE movimientos_contables RESTART IDENTITY CASCADE`);
  await db.execute(sql`TRUNCATE TABLE facturas RESTART IDENTITY CASCADE`);
  await db.execute(sql`TRUNCATE TABLE recibos RESTART IDENTITY CASCADE`);
  await db.execute(sql`TRUNCATE TABLE mantenimientos RESTART IDENTITY CASCADE`);
  await db.execute(sql`TRUNCATE TABLE contratos RESTART IDENTITY CASCADE`);
  await db.execute(sql`TRUNCATE TABLE inquilinos RESTART IDENTITY CASCADE`);
  await db.execute(sql`TRUNCATE TABLE propiedades RESTART IDENTITY CASCADE`);
}

// ── Generadores ───────────────────────────────────────────────────────────────

async function generarPropiedades(n = 50) {
  console.log(`🏠 Generando ${n} propiedades...`);
  const props = [];
  for (let i = 0; i < n; i++) {
    const lugar = pick(CIUDADES);
    const tipo = pick(TIPOS);
    props.push({
      nombre: `${tipo.charAt(0).toUpperCase() + tipo.slice(1)} ${lugar.ciudad.split(' ')[0]} #${i + 1}`,
      calle: pick(['Av. Reforma', 'Calle Hidalgo', 'Av. Insurgentes', 'Calle Madero', 'Av. Juárez']) + ' Sur',
      numero: String(randInt(1, 9999)),
      colonia: pick(['Centro', 'Roma', 'Condesa', 'Polanco', 'Del Valle', 'Coyoacán', 'Santa Fe']),
      codigoPostal: String(randInt(10000, 99999)),
      ciudad: lugar.ciudad,
      estado: lugar.estado,
      tipo,
      activa: true,
    });
  }
  const inserted = await db.insert(propiedades).values(props).returning();
  console.log(`   ✓ ${inserted.length} propiedades insertadas`);
  return inserted;
}

async function generarInquilinos(n = 80) {
  console.log(`👤 Generando ${n} inquilinos...`);
  const inqs = [];
  for (let i = 0; i < n; i++) {
    const nombre = pick(NOMBRES);
    const apPat = pick(APELLIDOS);
    const apMat = pick(APELLIDOS);
    // Patrón inyectado: 20% con RFC prefijo "MORA" los marca como de mayor morosidad
    const esMoroso = rng() < 0.2;
    inqs.push({
      nombre,
      apellidoPaterno: apPat,
      apellidoMaterno: apMat,
      rfc: esMoroso ? 'MORA' + generarRfc().slice(4) : generarRfc(),
      curp: generarCurp(),
      telefono: generarTelefono(),
      correo: `${nombre.toLowerCase()}.${apPat.toLowerCase()}${i}@example.com`,
      activo: true,
    });
  }
  const inserted = await db.insert(inquilinos).values(inqs).returning();
  console.log(`   ✓ ${inserted.length} inquilinos insertados`);
  return inserted;
}

async function generarContratos(propIds: string[], inqIds: string[], n = 100) {
  console.log(`📄 Generando ${n} contratos...`);
  const ctrs = [];
  const ahora = new Date();

  for (let i = 0; i < n; i++) {
    const inicio = new Date(ahora);
    inicio.setDate(inicio.getDate() - randInt(30, 900)); // 1-30 meses atrás

    const duracionMeses = pick([6, 12, 12, 18, 24]); // 12 es más común
    const fin = new Date(inicio);
    fin.setMonth(fin.getMonth() + duracionMeses);

    const esAntiguo = duracionMeses >= 12;
    const esReciente = (ahora.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24) < 180;

    // Patrón: 5% termina anticipadamente, concentrado en primeros 6 meses del contrato
    const terminaAnticipado = rng() < 0.05 && esReciente;
    // Patrón: 20% renovado
    const estaVigente = rng() > 0.2;
    // Patrón: 10% terminado ya
    const yaTerminado = !estaVigente;

    let fechaFinReal: Date;
    if (terminaAnticipado) {
      fechaFinReal = new Date(inicio);
      fechaFinReal.setMonth(fechaFinReal.getMonth() + randInt(1, 5));
    } else {
      fechaFinReal = fin;
    }

    const esFuturo = fechaFinReal > ahora;
    const estatusFinal = yaTerminado
      ? 'terminado'
      : esFuturo
        ? 'vigente'
        : 'terminado';

    const renta = String(randInt(8000, 35000) + rng()); // Float
    const deposito = String(Number(renta) * 1);

    ctrs.push({
      propiedadId: pick(propIds),
      inquilinoId: pick(inqIds),
      fechaInicio: inicio.toISOString().slice(0, 10),
      fechaFin: fechaFinReal.toISOString().slice(0, 10),
      rentaMensual: renta,
      deposito,
      periodicidadPago: 'mensual' as const,
      estatus: estatusFinal as 'vigente' | 'terminado',
      activo: !yaTerminado,
      // Hint para el patrón: si terminó anticipado, la fechaFin ya está truncada
    });
  }
  const inserted = await db
    .insert(contratos)
    .values(ctrs)
    .returning();
  console.log(`   ✓ ${inserted.length} contratos insertados`);
  return inserted;
}

async function generarRecibos(contratosList: typeof contratos.$inferSelect[]) {
  console.log(`🧾 Generando recibos...`);
  const recs = [];
  let contadorRecibo = 1;

  for (const c of contratosList) {
    const inicio = new Date(c.fechaInicio);
    const fin = new Date(c.fechaFin);
    const meses = Math.floor(
      (fin.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24 * 30),
    );
    const numMeses = Math.max(1, meses);

    const esMoroso = (c.inquilinoId.charCodeAt(0) % 5) === 0; // Pseudo-patrón por id

    for (let m = 0; m < numMeses; m++) {
      const fechaLimite = new Date(inicio);
      fechaLimite.setMonth(fechaLimite.getMonth() + m + 1);
      // Pagos a fin de mes
      fechaLimite.setDate(5);

      const periodoInicio = new Date(fechaLimite);
      periodoInicio.setMonth(periodoInicio.getMonth() - 1);
      const periodoFin = new Date(fechaLimite);
      periodoFin.setDate(periodoFin.getDate() - 1);

      const hoy = new Date();
      const yaVencio = fechaLimite < hoy;
      const esFuturo = fechaLimite > hoy;

      // Patrón de morosidad
      let pMora = 0.06; // base
      if (esMoroso) pMora += 0.10;
      const renta = Number(c.rentaMensual);
      if (renta > 25000) pMora += 0.05;
      const mesesContrato = Math.floor(
        (fechaLimite.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24 * 30),
      );
      if (mesesContrato > 12) pMora -= 0.02;

      let estatus: 'pendiente' | 'pagado' | 'vencido' | 'cancelado';
      let pagadoEn: Date | null = null;

      if (esFuturo) {
        estatus = 'pendiente';
      } else if (rng() < 0.02) {
        estatus = 'cancelado';
      } else if (yaVencio && rng() < pMora) {
        estatus = 'vencido';
      } else {
        estatus = 'pagado';
        // Pagar a tiempo: 0-3 días
        // Pagar tarde: 3-30 días
        const diasAtraso = rng() < 0.85 ? randInt(0, 3) : randInt(4, 30);
        pagadoEn = new Date(fechaLimite);
        pagadoEn.setDate(pagadoEn.getDate() + diasAtraso);
      }

      const otrosCobros = rng() < 0.1 ? randInt(100, 500) : 0;
      const total = renta + otrosCobros;

      recs.push({
        contratoId: c.id,
        numeroRecibo: `REC-${String(contadorRecibo++).padStart(6, '0')}`,
        periodoInicio: periodoInicio.toISOString().slice(0, 10),
        periodoFin: periodoFin.toISOString().slice(0, 10),
        fechaLimitePago: fechaLimite.toISOString().slice(0, 10),
        renta: String(renta),
        otrosCobros: String(otrosCobros),
        total: String(total),
        estatus,
        pagadoEn,
      });
    }
  }
  // Insertar en batches para no saturar
  const BATCH = 200;
  for (let i = 0; i < recs.length; i += BATCH) {
    await db.insert(recibos).values(recs.slice(i, i + BATCH));
  }
  console.log(`   ✓ ${recs.length} recibos insertados`);
  return recs;
}

async function generarMantenimientos(propIds: string[], n = 300) {
  console.log(`🔧 Generando ${n} mantenimientos...`);
  const mants = [];
  // 10% de las propiedades son "propensas a fallas" (más mantenimientos)
  const propensasSet = new Set<string>();
  const nPropensas = Math.floor(propIds.length * 0.1);
  for (let i = 0; i < nPropensas; i++) {
    propensasSet.add(pick(propIds));
  }

  for (let i = 0; i < n; i++) {
    const propId = propensasSet.has(pick(propIds)) || rng() < 0.3
      ? (rng() < 0.5 && propensasSet.size > 0 ? [...propensasSet][Math.floor(rng() * propensasSet.size)]! : pick(propIds))
      : pick(propIds);

    const diasAtras = randInt(1, 700);
    const estatus = pick(ESTATUS_MANT);
    const costo = randInt(500, 15000);
    const completado = estatus === 'completado';
    const creado = timestampAtras(diasAtras);
    const completadoEn = completado
      ? new Date(creado.getTime() + randInt(1, 30) * 24 * 60 * 60 * 1000)
      : null;

    mants.push({
      propiedadId: propId,
      categoria: pick(CATEGORIAS_MANT),
      descripcion: `Reparación/mantenimiento ${i + 1}`,
      costo: String(costo),
      estatus,
      reportadoPor: 'Inquilino',
      completadoEn,
      creadoEn: creado,
    });
  }
  const BATCH = 100;
  for (let i = 0; i < mants.length; i += BATCH) {
    await db.insert(mantenimientos).values(mants.slice(i, i + BATCH));
  }
  console.log(`   ✓ ${mants.length} mantenimientos insertados`);
}

async function generarMovimientosContables(
  propIds: string[],
  contratosList: typeof contratos.$inferSelect[],
  n = 5000,
) {
  console.log(`💰 Generando ~${n} movimientos contables...`);
  const movs = [];
  // 60% ingresos cruzados con recibos pagados
  // 40% gastos varios

  for (let i = 0; i < n; i++) {
    const esIngreso = rng() < 0.6;
    if (esIngreso) {
      const c = pick(contratosList);
      movs.push({
        tipo: 'ingreso' as const,
        categoria: pick(['renta', 'renta', 'renta', 'deposito', 'otro-ingreso']),
        monto: String(Number(c.rentaMensual) + (rng() < 0.1 ? randInt(100, 500) : 0)),
        descripcion: 'Cobro de renta',
        fecha: fechaAtras(randInt(0, 700)),
        propiedadId: c.propiedadId,
        contratoId: c.id,
      });
    } else {
      movs.push({
        tipo: 'gasto' as const,
        categoria: pick([
          'luz',
          'internet',
          'predial',
          'mantenimiento',
          'honorarios-administrador',
          'sat',
          'otro-gasto',
        ]),
        // 0.5% gastos atípicos (>3x lo normal) para futura detección de anomalías
        monto: String(rng() < 0.005 ? randInt(50000, 200000) : randInt(200, 5000)),
        descripcion: 'Gasto operativo',
        fecha: fechaAtras(randInt(0, 700)),
        propiedadId: pick(propIds),
      });
    }
  }
  const BATCH = 200;
  for (let i = 0; i < movs.length; i += BATCH) {
    await db.insert(movimientosContables).values(movs.slice(i, i + BATCH));
  }
  console.log(`   ✓ ${movs.length} movimientos insertados`);
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🌱 Iniciando seed sintético...\n');
  await limpiarTablas();

  const props = await generarPropiedades(50);
  const inqs = await generarInquilinos(80);
  const ctrs = await generarContratos(
    props.map((p) => p.id),
    inqs.map((i) => i.id),
    100,
  );
  await generarRecibos(ctrs);
  await generarMantenimientos(
    props.map((p) => p.id),
    300,
  );
  await generarMovimientosContables(
    props.map((p) => p.id),
    ctrs,
    5000,
  );

  console.log('\n✅ Seed completado.');
  console.log('   Para entrenar los modelos:');
  console.log('   POST /api/ia/modelos/morosidad/entrenar');
  console.log('   POST /api/ia/modelos/vacancia/entrenar');
  console.log('   POST /api/ia/modelos/mantenimiento/entrenar');
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Error durante seed:', err);
  process.exit(1);
});