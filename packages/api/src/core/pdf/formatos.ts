/**
 * Funciones puras de formato usadas por los generadores de PDF.
 * Sin dependencias externas — equivalentes a las que viven duplicadas
 * en las páginas de detalle del frontend, pero server-side.
 */

/** Formatea un número como moneda MXN: $1,234.56 */
export function formatearMonedaMX(monto: number): string {
  return monto.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
}

/**
 * Fecha larga en español: "15 de enero de 2026".
 * Acepta string ISO (YYYY-MM-DD) o ya parseable por Date.
 */
export function formatearFechaLarga(fecha: string): string {
  const d = new Date(fecha.length === 10 ? fecha + 'T00:00:00' : fecha);
  return d.toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
}

/**
 * Fecha narrativa para cláusulas y líneas de cierre:
 * "15 de enero del 2026" (con "del", minúsculas) — coincide con la
 * referencia del contrato mexicano.
 */
export function formatearFechaNarrativa(fecha: string | Date): string {
  const d = fecha instanceof Date ? fecha : new Date(fecha.length === 10 ? fecha + 'T00:00:00' : fecha);
  const dStr = d.toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
  // Reemplazar "de " antes del año por "del " ("15 de enero de 2026" → "15 de enero del 2026")
  return dStr.replace(/ de (\d{4})$/, ' del $1');
}

/** Fecha corta en español: "15/01/2026" */
export function formatearFechaCorta(fecha: string): string {
  const d = new Date(fecha.length === 10 ? fecha + 'T00:00:00' : fecha);
  return d.toLocaleDateString('es-MX', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

/**
 * Diferencia en meses entre dos fechas ISO. Útil para la sección
 * "Vigencia" del contrato: "Del … al … (12 meses)".
 */
export function calcularAntiguedadMeses(fechaInicio: string, fechaFin: string): number {
  const inicio = new Date(fechaInicio + 'T00:00:00');
  const fin = new Date(fechaFin + 'T00:00:00');
  const meses = (fin.getFullYear() - inicio.getFullYear()) * 12 + (fin.getMonth() - inicio.getMonth());
  // Ajuste por día: si el día de fin es anterior al de inicio, aún no se cumplió el último mes.
  return fin.getDate() >= inicio.getDate() ? meses : meses - 1;
}

/** Fecha y hora actual para pies de página: "16/08/2026 14:35" */
export function formatearFechaHoraActual(): string {
  const d = new Date();
  const fecha = d.toLocaleDateString('es-MX', { year: 'numeric', month: '2-digit', day: '2-digit' });
  const hora = d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false });
  return `${fecha} ${hora}`;
}

// ── Conversión número → letras (es-MX) ────────────────────────────────────────

const UNIDADES = [
  '',
  'UNO',
  'DOS',
  'TRES',
  'CUATRO',
  'CINCO',
  'SEIS',
  'SIETE',
  'OCHO',
  'NUEVE',
  'DIEZ',
  'ONCE',
  'DOCE',
  'TRECE',
  'CATORCE',
  'QUINCE',
  'DIECISÉIS',
  'DIECISIETE',
  'DIECIOCHO',
  'DIECINUEVE',
  'VEINTE',
  'VEINTIÚN',
  'VEINTIDÓS',
  'VEINTITRÉS',
  'VEINTICUATRO',
  'VEINTICINCO',
  'VEINTISÉIS',
  'VEINTISIETE',
  'VEINTIOCHO',
  'VEINTINUEVE',
];

const DECENAS = [
  '',
  '',
  '',
  'TREINTA',
  'CUARENTA',
  'CINCUENTA',
  'SESENTA',
  'SETENTA',
  'OCHENTA',
  'NOVENTA',
];

const CENTENAS = [
  '',
  'CIENTO',
  'DOSCIENTOS',
  'TRESCIENTOS',
  'CUATROCIENTOS',
  'QUINIENTOS',
  'SEISCIENTOS',
  'SETECIENTOS',
  'OCHOCIENTOS',
  'NOVECIENTOS',
];

/**
 * Convierte un número entre 0 y 999 en letras mayúsculas en español.
 * 100 → "CIEN" (exacto). 1 → "UNO".
 */
function letrasHasta999(n: number): string {
  if (n === 0) return '';
  if (n === 100) return 'CIEN';

  const centenas = Math.floor(n / 100);
  const resto = n % 100;

  let parteCentena = '';
  if (centenas > 0) parteCentena = CENTENAS[centenas]!;

  let parteDecena = '';
  if (resto < 30) {
    parteDecena = UNIDADES[resto]!;
  } else {
    const decenas = Math.floor(resto / 10);
    const unidades = resto % 10;
    parteDecena = DECENAS[decenas]!;
    if (unidades > 0) parteDecena = `${parteDecena} Y ${UNIDADES[unidades]}`;
  }

  if (parteCentena && parteDecena) return `${parteCentena} ${parteDecena}`;
  return parteCentena || parteDecena;
}

/** Convierte un entero entre 0 y 999_999_999 en letras mayúsculas. */
export function numeroALetrasEntero(n: number): string {
  if (!Number.isFinite(n) || !Number.isInteger(n)) {
    throw new RangeError(`numeroALetrasEntero requiere entero finito, recibido: ${n}`);
  }
  if (n < 0 || n > 999_999_999) {
    throw new RangeError(`numeroALetrasEntero soporta 0..999999999, recibido: ${n}`);
  }
  if (n === 0) return 'CERO';

  const millones = Math.floor(n / 1_000_000);
  const miles = Math.floor((n % 1_000_000) / 1000);
  const unidades = n % 1000;

  const partes: string[] = [];

  if (millones > 0) {
    if (millones === 1) partes.push('UN MILLÓN');
    else partes.push(`${letrasHasta999(millones)} MILLONES`);
  }

  if (miles > 0) {
    if (miles === 1) partes.push('MIL');
    else partes.push(`${letrasHasta999(miles)} MIL`);
  }

  if (unidades > 0) {
    partes.push(letrasHasta999(unidades));
  }

  return partes.join(' ').trim();
}

/**
 * Convierte un monto (hasta 2 decimales) a letras con formato de moneda:
 *   numeroALetrasMX(5000)      → "CINCO MIL PESOS 00/100 M.N."
 *   numeroALetrasMX(1234.56)   → "MIL DOSCIENTOS TREINTA Y CUATRO PESOS 56/100 M.N."
 *   numeroALetrasMX(0.5)       → "CERO PESOS 50/100 M.N."
 *
 * Acepta hasta 999,999,999.99. Lanza RangeError si excede o es negativo.
 * La parte decimal se trunca a 2 dígitos (no se redondea).
 */
export function numeroALetrasMX(monto: number): string {
  if (!Number.isFinite(monto)) {
    throw new RangeError(`numeroALetrasMX requiere número finito, recibido: ${monto}`);
  }
  if (monto < 0 || monto > 999_999_999.99) {
    throw new RangeError(`numeroALetrasMX soporta 0..999999999.99, recibido: ${monto}`);
  }

  // Redondeo a 2 decimales para evitar 0.1 + 0.2 = 0.30000000000000004
  const redondeado = Math.round(monto * 100) / 100;
  const parteEntera = Math.trunc(redondeado);
  const centavos = Math.round((redondeado - parteEntera) * 100);
  const centavosStr = centavos.toString().padStart(2, '0');

  const letras = numeroALetrasEntero(parteEntera);
  // Singular/plural: 1 peso → "PESO", cualquier otro → "PESOS"
  const palabra = parteEntera === 1 ? 'PESO' : 'PESOS';
  return `${letras} ${palabra} ${centavosStr}/100 M.N.`;
}