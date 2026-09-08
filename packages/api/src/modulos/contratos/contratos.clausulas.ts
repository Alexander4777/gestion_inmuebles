import type { Contrato } from '@proyecto-modular/shared/tipos/contratos';
import {
  formatearMonedaMX,
  numeroALetrasMX,
  formatearFechaLarga,
} from '../../core/pdf/formatos';

/**
 * Plantillas de las DECLARACIONES y CLÁUSULAS del contrato de arrendamiento,
 * basadas en el modelo mexicano Jalisco (referencia: contrato Providencia 741).
 *
 * Cada cadena usa placeholders `{{ variable }}` que se interpolan en tiempo
 * de render con `interpolarClausulas(valoresPorDefecto(contrato))`.
 *
 * Si una variable no tiene valor en `ClausulaParametros`, el interpolador
 * usa el `DEFAULT` correspondiente (cuando existe) o imprime
 * "A completar manualmente" como último recurso.
 */

// ── Tipos ──────────────────────────────────────────────────────────────────────

/** Subinciso de una declaración (A, B, C, …). */
export interface IncisoDeclaracion {
  /** Letra que se imprime al inicio (ej. "A"). */
  letra: string;
  /** Cuerpo del inciso con placeholders `{{ var }}`. */
  cuerpo: string;
}

export interface Declaracion {
  /** Encabezado romano (I, II, III, IV). */
  romano: string;
  /** Subtítulo en MAYÚSCULAS (ej. "DE EL ARRENDADOR"). */
  subtitulo: string;
  /** Párrafo introductorio antes de los incisos. Puede tener placeholders. */
  introduccion?: string;
  /** Lista de incisos (A, B, C, …). */
  incisos: ReadonlyArray<IncisoDeclaracion>;
}

export interface Clausula {
  /** Encabezado mayúscula (ej. "PRIMERA"). */
  titulo: string;
  /** Cuerpo con placeholders `{{ var }}`. */
  cuerpo: string;
}

/** Parámetros que las cláusulas pueden interpolar. Todos son strings. */
export interface ClausulaParametros {
  // Arrendador
  arrendadorNombre: string;
  arrendadorIdentificacion: string;
  arrendadorEstadoCivil: string;
  arrendadorNacionalidad: string;
  arrendadorOcupacion: string;
  arrendadorDomicilio: string;
  // Arrendatario
  arrendatarioNombre: string;
  arrendatarioIdentificacion: string;
  arrendatarioEstadoCivil: string;
  arrendatarioNacionalidad: string;
  arrendatarioOcupacion: string;
  arrendatarioDomicilio: string;
  // Fiador
  fiadorNombre: string;
  fiadorIdentificacion: string;
  fiadorEstadoCivil: string;
  fiadorNacionalidad: string;
  fiadorOcupacion: string;
  fiadorDomicilio: string;
  fiadorEsPropietario: string; // "Sí" / "No"
  // Inmueble
  inmuebleNombre: string;
  inmuebleDireccion: string;
  inmuebleTipo: string;
  // Condiciones económicas
  rentaMensual: string;
  rentaMensualLetra: string;
  deposito: string;
  depositoLetra: string;
  diaPago: string;
  incrementoAnualPct: string;
  interesMoratorioPct: string;
  penaConvencional: string;
  // Vigencia
  fechaInicio: string;
  fechaFin: string;
  vigenciaMeses: string;
  // Firma
  lugarFirma: string;
  fechaFirma: string;
  // Inventario (cláusula DÉCIMA OCTAVA) — placeholder literal mientras no exista modelo
  inventarioDescripcion: string;
}

// ── Defaults ───────────────────────────────────────────────────────────────────

const FALTA = 'A completar manualmente';

export const PARAM_DEFAULTS: Readonly<ClausulaParametros> = Object.freeze({
  // Arrendador
  arrendadorNombre: FALTA,
  arrendadorIdentificacion: FALTA,
  arrendadorEstadoCivil: FALTA,
  arrendadorNacionalidad: FALTA,
  arrendadorOcupacion: FALTA,
  arrendadorDomicilio: FALTA,
  // Arrendatario
  arrendatarioNombre: FALTA,
  arrendatarioIdentificacion: FALTA,
  arrendatarioEstadoCivil: FALTA,
  arrendatarioNacionalidad: FALTA,
  arrendatarioOcupacion: FALTA,
  arrendatarioDomicilio: FALTA,
  // Fiador
  fiadorNombre: FALTA,
  fiadorIdentificacion: FALTA,
  fiadorEstadoCivil: FALTA,
  fiadorNacionalidad: FALTA,
  fiadorOcupacion: FALTA,
  fiadorDomicilio: FALTA,
  fiadorEsPropietario: FALTA,
  // Inmueble
  inmuebleNombre: FALTA,
  inmuebleDireccion: FALTA,
  inmuebleTipo: 'casa habitación',
  // Condiciones económicas
  rentaMensual: FALTA,
  rentaMensualLetra: FALTA,
  deposito: FALTA,
  depositoLetra: FALTA,
  diaPago: '1',
  incrementoAnualPct: '5',
  interesMoratorioPct: '5',
  penaConvencional: FALTA,
  // Vigencia
  fechaInicio: FALTA,
  fechaFin: FALTA,
  vigenciaMeses: FALTA,
  // Firma
  lugarFirma: FALTA,
  fechaFirma: FALTA,
  // Inventario
  inventarioDescripcion:
    'Baño completo, todos sus vidrios, dos chapas completas con llaves y cocina integral con parrilla eléctrica.',
});

// ── Declaraciones ──────────────────────────────────────────────────────────────

export const DECLARACIONES: ReadonlyArray<Declaracion> = Object.freeze([
  {
    romano: 'I',
    subtitulo: 'DE EL ARRENDADOR',
    introduccion:
      'Declara EL ARRENDADOR, por su propio derecho, llamarse {{ arrendadorNombre }}, ' +
      '{{ arrendadorEstadoCivil }}, {{ arrendadorNacionalidad }}, {{ arrendadorOcupacion }}, ' +
      'con domicilio en {{ arrendadorDomicilio }}, quien se identifica con {{ arrendadorIdentificacion }}, ' +
      'y que cuenta con la legítima propiedad del inmueble que se describe en la declaración II siguiente.',
    incisos: [],
  },
  {
    romano: 'II',
    subtitulo: 'DEL INMUEBLE',
    introduccion:
      'Declaran LAS PARTES que el inmueble objeto del presente contrato es {{ inmuebleNombre }}, ' +
      'ubicado en {{ inmuebleDireccion }}, y se destinará exclusivamente para {{ inmuebleTipo }}.',
    incisos: [
      {
        letra: 'A',
        cuerpo:
          'El inmueble cuenta con las instalaciones eléctricas, hidráulicas y sanitarias en ' +
          'perfecto estado de funcionamiento, así como con los muebles que se describen en ' +
          'el inventario adjunto.',
      },
      {
        letra: 'B',
        cuerpo:
          'El inmueble se encuentra libre de gravámenes, limitaciones de dominio, embargo ' +
          'y cualquier otra carga que impida su uso y disfrute pacífico.',
      },
      {
        letra: 'C',
        cuerpo:
          'EL ARRENDADOR entrega el inmueble en condiciones de ser habitado inmediatamente, ' +
          'y EL ARRENDATARIO lo recibe a su entera satisfacción.',
      },
    ],
  },
  {
    romano: 'III',
    subtitulo: 'DE EL ARRENDATARIO',
    introduccion:
      'Declara EL ARRENDATARIO, por su propio derecho, llamarse {{ arrendatarioNombre }}, ' +
      '{{ arrendatarioEstadoCivil }}, {{ arrendatarioNacionalidad }}, {{ arrendatarioOcupacion }}, ' +
      'con domicilio en {{ arrendatarioDomicilio }}, quien se identifica con {{ arrendatarioIdentificacion }}, ' +
      'y que cuenta con la capacidad legal y económica para obligarse en los términos del presente contrato.',
    incisos: [
      {
        letra: 'A',
        cuerpo:
          'Que es su voluntad celebrar el presente contrato de arrendamiento en los términos ' +
          'y condiciones que aquí se estipulan.',
      },
      {
        letra: 'B',
        cuerpo:
          'Que conoce el estado físico y jurídico del inmueble, por lo que renuncia ' +
          'expresamente a cualquier acción de saneamiento por vicios o defectos.',
      },
    ],
  },
  {
    romano: 'IV',
    subtitulo: 'DE EL FIADOR',
    introduccion:
      'Declara EL FIADOR, por su propio derecho, llamarse {{ fiadorNombre }}, ' +
      '{{ fiadorEstadoCivil }}, {{ fiadorNacionalidad }}, {{ fiadorOcupacion }}, ' +
      'con domicilio en {{ fiadorDomicilio }}, quien se identifica con {{ fiadorIdentificacion }}, ' +
      'y que acepta obligarse solidariamente con EL ARRENDATARIO en todas las obligaciones ' +
      'que para éste derivan del presente contrato. {{ fiadorEsPropietario }} es propietario del ' +
      'domicilio señalado con anterioridad.',
    incisos: [],
  },
]);

// ── Cláusulas ──────────────────────────────────────────────────────────────────

export const CLAUSULAS: ReadonlyArray<Clausula> = Object.freeze([
  {
    titulo: 'PRIMERA',
    cuerpo:
      'EL ARRENDADOR da en arrendamiento a EL ARRENDATARIO el inmueble descrito en la ' +
      'declaración II del presente contrato, y éste lo recibe para su uso exclusivo de ' +
      '{{ inmuebleTipo }}. Queda expresamente prohibido cualquier uso comercial, industrial ' +
      'o de servicios sin consentimiento previo y por escrito de EL ARRENDADOR.',
  },
  {
    titulo: 'SEGUNDA',
    cuerpo:
      'La renta mensual por el arrendamiento del inmueble es la cantidad de ' +
      '{{ rentaMensual }} ({{ rentaMensualLetra }}), misma que EL ARRENDATARIO se obliga a ' +
      'pagar dentro de los primeros {{ diaPago }} días naturales de cada mes, en el domicilio ' +
      'de EL ARRENDADOR o mediante transferencia bancaria a la cuenta que éste le señale por escrito.',
  },
  {
    titulo: 'TERCERA',
    cuerpo:
      'EL ARRENDATARIO entrega en este acto, a título de depósito en garantía, la cantidad de ' +
      '{{ deposito }} ({{ depositoLetra }}), misma que será devuelta al término del contrato, ' +
      'dentro de los 30 (treinta) días naturales siguientes, una vez verificado el estado de ' +
      'conservación del inmueble y deducidos los daños, adeudos y penalizaciones que, en su caso, ' +
      'procedan. El depósito no se aplicará al pago de rentas.',
  },
  {
    titulo: 'CUARTA',
    cuerpo:
      'Las partes convienen que la renta se incrementará anualmente en un {{ incrementoAnualPct }}% ' +
      'sobre el monto vigente en el periodo inmediato anterior. El primer incremento se aplicará ' +
      'al cumplir un año de vigencia del presente contrato y se notificará por escrito a EL ' +
      'ARRENDATARIO con al menos 30 (treinta) días naturales de anticipación.',
  },
  {
    titulo: 'QUINTA',
    cuerpo:
      'En caso de mora en el pago de la renta, EL ARRENDATARIO cubrirá un interés moratorio ' +
      'equivalente al {{ interesMoratorioPct }}% mensual sobre el saldo insoluto, sin que ello ' +
      'implique novación o prórroga del plazo de pago. El incumplimiento por más de 30 (treinta) ' +
      'días naturales faculta a EL ARRENDADOR para rescindir el presente contrato, sin necesidad ' +
      'de declaración judicial, de conformidad con el artículo 2488 del Código Civil Federal.',
  },
  {
    titulo: 'SEXTA',
    cuerpo:
      'EL ARRENDATARIO destinará el inmueble únicamente para los fines convenidos, ' +
      'manteniéndolo en buen estado de conservación y limpieza. Las reparaciones menores ' +
      'que surjan por el uso normal del inmueble correrán por cuenta de EL ARRENDATARIO; ' +
      'las reparaciones mayores o que afecten la estructura del mismo serán por cuenta de ' +
      'EL ARRENDADOR.',
  },
  {
    titulo: 'SÉPTIMA',
    cuerpo:
      'Queda prohibida cualquier mejora, modificación o adaptación del inmueble sin ' +
      'consentimiento previo y por escrito de EL ARRENDADOR. Las mejoras autorizadas ' +
      'quedarán a beneficio del inmueble sin derecho a compensación alguna para EL ' +
      'ARRENDATARIO al término del contrato.',
  },
  {
    titulo: 'OCTAVA',
    cuerpo:
      'EL ARRENDATARIO no podrá subarrendar, ceder o traspasar el inmueble, total o ' +
      'parcialmente, ni los derechos derivados del presente contrato, sin consentimiento ' +
      'previo, expreso y por escrito de EL ARRENDADOR. La violación de esta cláusula ' +
      'será causa de rescisión inmediata.',
  },
  {
    titulo: 'NOVENA',
    cuerpo:
      'La vigencia del presente contrato es de {{ vigenciaMeses }} meses, comenzando el ' +
      '{{ fechaInicio }} y terminando el {{ fechaFin }}. Al término de la vigencia, el contrato ' +
      'podrá renovarse por períodos iguales mediante acuerdo expreso y por escrito de LAS PARTES, ' +
      'con al menos 30 (treinta) días naturales de anticipación al vencimiento.',
  },
  {
    titulo: 'DÉCIMA',
    cuerpo:
      'Si EL ARRENDATARIO desea terminar el contrato antes de su vencimiento, deberá notificar ' +
      'por escrito a EL ARRENDADOR con al menos 60 (sesenta) días naturales de anticipación y ' +
      'cubrir una pena convencional equivalente a {{ penaConvencional }}, misma que será ' +
      'descontada del depósito en garantía. En caso de que el depósito no sea suficiente, ' +
      'EL ARRENDATARIO cubrirá la diferencia dentro de los 5 (cinco) días hábiles siguientes ' +
      'a la terminación.',
  },
  {
    titulo: 'DÉCIMA PRIMERA',
    cuerpo:
      'EL ARRENDADOR podrá rescindir el presente contrato en cualquier tiempo, sin ' +
      'responsabilidad alguna, en los siguientes casos: ' +
      '(i) falta de pago de 2 (dos) o más mensualidades de renta; ' +
      '(ii) destinar el inmueble a un uso distinto del convenido; ' +
      '(iii) subarrendar, ceder o traspasar los derechos del contrato sin autorización; ' +
      '(iv) realizar mejoras o modificaciones sin consentimiento; o ' +
      '(v) causar daños intencionales al inmueble.',
  },
  {
    titulo: 'DÉCIMA SEGUNDA',
    cuerpo:
      'Al término del contrato, ya sea por vencimiento, rescisión o terminación anticipada, ' +
      'LAS PARTES realizarán una entrega-recepción formal del inmueble, levantando un acta ' +
      'donde se haga constar el estado de conservación del mismo y de los muebles e ' +
      'instalaciones descritos en el inventario adjunto.',
  },
  {
    titulo: 'DÉCIMA TERCERA',
    cuerpo:
      'EL ARRENDATARIO se obliga a permitir el acceso al inmueble a EL ARRENDADOR o a la ' +
      'persona que éste designe, previa cita acordada con al menos 24 (veinticuatro) horas ' +
      'de anticipación, para efectos de inspección, mantenimiento mayor o verificación del ' +
      'cumplimiento de las obligaciones del presente contrato. Esta visita podrá realizarse ' +
      'con una periodicidad no mayor a una vez al mes.',
  },
  {
    titulo: 'DÉCIMA CUARTA',
    cuerpo:
      'EL ARRENDATARIO cubrirá puntualmente los servicios de energía eléctrica, agua potable, ' +
      'gas, teléfono, internet y demás servicios con que cuente el inmueble, así como las ' +
      'cuotas de mantenimiento y vigilancia del conjunto o fraccionamiento, en caso de que ' +
      'aplique. Los adeudos generados durante la vigencia del contrato deberán quedar ' +
      'saldados a más tardar en la fecha de entrega del inmueble.',
  },
  {
    titulo: 'DÉCIMA QUINTA',
    cuerpo:
      'EL ARRENDADOR no será responsable por daños o perjuicios causados a EL ARRENDATARIO ' +
      'o a sus bienes por caso fortuito, fuerza mayor, fenómenos naturales, disturbios civiles ' +
      'o cualquier evento fuera de su control. EL ARRENDATARIO renuncia expresamente a ' +
      'cualquier acción en contra de EL ARRENDADOR por estos conceptos.',
  },
  {
    titulo: 'DÉCIMA SÉXTA',
    cuerpo:
      'EL FIADOR se obliga solidariamente con EL ARRENDATARIO al cumplimiento de todas las ' +
      'obligaciones que para éste derivan del presente contrato, por lo que renuncia ' +
      'expresamente al beneficio de orden y excusión, y acepta que cualquier requerimiento de ' +
      'pago dirigido a EL ARRENDATARIO podrá serle directamente exigido, sin necesidad de ' +
      'proceder previamente contra el deudor principal.',
  },
  {
    titulo: 'DÉCIMA SÉPTIMA',
    cuerpo:
      'Para todo lo no previsto en el presente contrato, LAS PARTES se someten a las ' +
      'disposiciones del Código Civil Federal y, en su caso, a las del Código Civil del ' +
      'estado donde se ubica el inmueble, así como a la jurisdicción de los tribunales ' +
      'competentes de la ciudad de {{ lugarFirma }}, renunciando expresamente a cualquier ' +
      'otro fuero que pudiere corresponderles por razón de su domicilio presente o futuro.',
  },
  {
    titulo: 'DÉCIMA OCTAVA',
    cuerpo:
      'Ambas partes reconocen que al momento de la firma del presente contrato, el inmueble ' +
      'cuenta con los siguientes muebles y accesorios en perfecto estado: {{ inventarioDescripcion }}. ' +
      'Cualquier faltante o daño a estos muebles y accesorios será responsabilidad de EL ' +
      'ARRENDATARIO, quien deberá cubrir su reparación o reposición al término del contrato.',
  },
  {
    titulo: 'DÉCIMA NOVENA',
    cuerpo:
      'Las partes manifiestan que en la celebración del presente contrato no existe error, ' +
      'dolo, mala fe, violencia, lesión o cualquier vicio del consentimiento que pueda ' +
      'invalidarlo, y que las estipulaciones aquí contenidas son la expresión fiel de su ' +
      'voluntad, por lo que lo firman de conformidad en el lugar y fecha señalados al final.',
  },
  {
    titulo: 'VIGÉSIMA',
    cuerpo:
      'El presente contrato se firma por duplicado en {{ lugarFirma }}, quedando un tanto ' +
      'en poder de cada una de LAS PARTES. Ambas copias tienen la misma fuerza legal.',
  },
  {
    titulo: 'VIGÉSIMA PRIMERA',
    cuerpo:
      'Leído que fue el presente contrato por LAS PARTES y conformes con su contenido y ' +
      'alcances legales, lo firman al margen y al calce en {{ lugarFirma }}, el día {{ fechaFirma }}.',
  },
]);

// ── Interpolador ───────────────────────────────────────────────────────────────

const PLACEHOLDER_RE = /\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/g;

/**
 * Reemplaza cada `{{ var }}` en la plantilla con `params[var]`. Si la
 * variable no existe, usa `DEFAULT` cuando esté disponible, o el literal
 * "A completar manualmente" como último recurso.
 *
 * `params` es un mapa libre (`Record<string, string | undefined>`) en
 * lugar de `Partial<ClausulaParametros>` para permitir placeholders con
 * nombres arbitrarios (útil en tests y para forward-compat).
 */
export function interpolar(
  plantilla: string,
  params: Record<string, string | undefined> = {},
): string {
  return plantilla.replace(PLACEHOLDER_RE, (_match, key: string) => {
    const valor = params[key];
    if (valor !== undefined && valor !== '') return valor;
    const def = (PARAM_DEFAULTS as Record<string, string | undefined>)[key];
    return def ?? FALTA;
  });
}

/** Devuelve las cláusulas ya interpoladas con los parámetros dados. */
export function interpolarClausulas(
  params: Partial<ClausulaParametros> = {},
): ReadonlyArray<{
  titulo: string;
  cuerpo: string;
}> {
  const tabla = params as Record<string, string | undefined>;
  return CLAUSULAS.map((c) => ({ titulo: c.titulo, cuerpo: interpolar(c.cuerpo, tabla) }));
}

/** Devuelve las declaraciones ya interpoladas (incluye subincisos). */
export function interpolarDeclaraciones(
  params: Partial<ClausulaParametros> = {},
): ReadonlyArray<{
  romano: string;
  subtitulo: string;
  introduccion?: string;
  incisos: ReadonlyArray<{ letra: string; cuerpo: string }>;
}> {
  const tabla = params as Record<string, string | undefined>;
  return DECLARACIONES.map((d) => ({
    romano: d.romano,
    subtitulo: d.subtitulo,
    introduccion: d.introduccion ? interpolar(d.introduccion, tabla) : undefined,
    incisos: d.incisos.map((i) => ({ letra: i.letra, cuerpo: interpolar(i.cuerpo, tabla) })),
  }));
}

/**
 * Construye los `ClausulaParametros` a partir de un `Contrato` y sus
 * relaciones. Los campos opcionales que no estén en el snapshot usan
 * `PARAM_DEFAULTS` (ya incorporados en `interpolar()`).
 */
export function valoresPorDefecto(contrato: Contrato): ClausulaParametros {
  const inqu = contrato.inquilino;
  const prop = contrato.propiedad;
  const arr = contrato.arrendadorSnapshot;
  const fia = contrato.fiadorSnapshot;

  // Arrendatario
  const arrNombre = inqu
    ? `${inqu.nombre} ${inqu.apellidoPaterno} ${inqu.apellidoMaterno}`.trim()
    : FALTA;
  const arrDom = inqu?.domicilio
    ? `${inqu.domicilio.calle} #${inqu.domicilio.numero}, ${inqu.domicilio.colonia}, CP ${inqu.domicilio.codigoPostal}, ${inqu.domicilio.ciudad}, ${inqu.domicilio.estado}`
    : FALTA;

  // Fiador
  const fiaNombre = fia?.nombreCompleto ?? FALTA;
  const fiaDom = fia?.domicilio
    ? `${fia.domicilio.calle} #${fia.domicilio.numero}, ${fia.domicilio.colonia}, CP ${fia.domicilio.codigoPostal}, ${fia.domicilio.ciudad}, ${fia.domicilio.estado}`
    : FALTA;

  // Arrendador
  const arrendNombre = arr?.nombreCompleto ?? FALTA;
  const arrendDom = arr?.domicilio
    ? `${arr.domicilio.calle} #${arr.domicilio.numero}, ${arr.domicilio.colonia}, CP ${arr.domicilio.codigoPostal}, ${arr.domicilio.ciudad}, ${arr.domicilio.estado}`
    : FALTA;

  // Inmueble
  const inmNombre = prop?.nombre ?? FALTA;
  const inmDir = prop
    ? `${prop.direccion.calle} #${prop.direccion.numero}, ${prop.direccion.colonia}, CP ${prop.direccion.codigoPostal}, ${prop.direccion.ciudad}, ${prop.direccion.estado}`
    : FALTA;
  const inmTipo = 'casa habitación';

  // Condiciones económicas
  const rentaFmt = formatearMonedaMX(contrato.rentaMensual);
  const rentaLetra = numeroALetrasMX(contrato.rentaMensual);
  const depFmt = formatearMonedaMX(contrato.deposito);
  const depLetra = numeroALetrasMX(contrato.deposito);
  const diaPago = String(contrato.diaPago ?? 1);
  const incAnual = String(contrato.incrementoAnualPct ?? 5);
  const intMorat = String(contrato.interesMoratorioPct ?? 5);
  const penaConv =
    contrato.penaConvencional !== undefined
      ? `${formatearMonedaMX(contrato.penaConvencional)} (${numeroALetrasMX(contrato.penaConvencional)})`
      : formatearMonedaMX(contrato.rentaMensual); // default: 1 mes de renta

  // Vigencia
  const fechaInicio = formatearFechaLarga(contrato.fechaInicio);
  const fechaFin = formatearFechaLarga(contrato.fechaFin);
  const meses = (() => {
    const ini = new Date(contrato.fechaInicio + 'T00:00:00');
    const fin = new Date(contrato.fechaFin + 'T00:00:00');
    const m =
      (fin.getFullYear() - ini.getFullYear()) * 12 + (fin.getMonth() - ini.getMonth());
    return fin.getDate() >= ini.getDate() ? m : m - 1;
  })();

  // Firma
  const lugarFirma = contrato.lugarFirma ?? prop?.direccion.ciudad ?? FALTA;
  const fechaFirma = contrato.fechaFirma
    ? formatearFechaLarga(contrato.fechaFirma)
    : fechaInicio;

  return {
    // Arrendador
    arrendadorNombre: arrendNombre,
    arrendadorIdentificacion: arr?.identificacionOficial ?? FALTA,
    arrendadorEstadoCivil: arr?.estadoCivil ?? FALTA,
    arrendadorNacionalidad: arr?.nacionalidad ?? FALTA,
    arrendadorOcupacion: arr?.ocupacion ?? FALTA,
    arrendadorDomicilio: arrendDom,
    // Arrendatario
    arrendatarioNombre: arrNombre,
    arrendatarioIdentificacion: inqu?.identificacionOficial ?? FALTA,
    arrendatarioEstadoCivil: inqu?.estadoCivil ?? FALTA,
    arrendatarioNacionalidad: inqu?.nacionalidad ?? FALTA,
    arrendatarioOcupacion: inqu?.ocupacion ?? FALTA,
    arrendatarioDomicilio: arrDom,
    // Fiador
    fiadorNombre: fiaNombre,
    fiadorIdentificacion: fia?.identificacionOficial ?? FALTA,
    fiadorEstadoCivil: fia?.estadoCivil ?? FALTA,
    fiadorNacionalidad: fia?.nacionalidad ?? FALTA,
    fiadorOcupacion: fia?.ocupacion ?? FALTA,
    fiadorDomicilio: fiaDom,
    fiadorEsPropietario: fia?.esPropietarioDomicilio === true ? 'El fiador' : 'El fiador no',
    // Inmueble
    inmuebleNombre: inmNombre,
    inmuebleDireccion: inmDir,
    inmuebleTipo: inmTipo,
    // Condiciones económicas
    rentaMensual: rentaFmt,
    rentaMensualLetra: rentaLetra,
    deposito: depFmt,
    depositoLetra: depLetra,
    diaPago,
    incrementoAnualPct: incAnual,
    interesMoratorioPct: intMorat,
    penaConvencional: penaConv,
    // Vigencia
    fechaInicio,
    fechaFin,
    vigenciaMeses: String(meses),
    // Firma
    lugarFirma,
    fechaFirma,
    // Inventario
    inventarioDescripcion: PARAM_DEFAULTS.inventarioDescripcion,
  };
}
