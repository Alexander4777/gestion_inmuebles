import type { DetalleRecibo } from '@proyecto-modular/shared/tipos/recibos';
import PDFDocument from 'pdfkit';
import { crearDocumentoPDF, recuadro, lineaDivisoria } from '../../core/pdf/documento';
import { agregarPie } from '../../core/pdf/pie';
import {
  formatearMonedaMX,
  formatearFechaLarga,
  formatearFechaCorta,
  numeroALetrasMX,
} from '../../core/pdf/formatos';

/**
 * Genera el PDF de un Recibo de Pago en formato imprimible.
 *
 * Layout basado en la plantilla de recibo de la referencia (recibo.ods):
 *   — Zona izquierda (flujo): ARRENDADOR, RECIBO DE, DOMICILIO, PERIODO narrativo,
 *     línea de concepto (renta + desglose si lo hay).
 *   — Zona derecha (absoluta): No. RECIBO (recuadro), TOTAL grande, CANTIDAD CON
 *     LETRA, recuadro de FIRMA único.
 *
 * Devuelve un Buffer listo para enviarse como `application/pdf`.
 */
export function generarPDFRecibo(detalle: DetalleRecibo): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = crearDocumentoPDF({
      titulo: `RECIBO DE PAGO`,
      subtitulo: `No. ${detalle.numeroRecibo}`,
    });

    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    try {
      escribirCuerpo(doc, detalle);
      agregarPie(doc);
    } catch (err) {
      reject(err);
      return;
    }

    doc.end();
  });
}

// ── Renderizado del cuerpo ──────────────────────────────────────────────────────

function escribirCuerpo(doc: InstanceType<typeof PDFDocument>, recibo: DetalleRecibo): void {
  const inquilino = recibo.inquilino;
  const propiedad = recibo.propiedad;
  const arrendador = recibo.arrendadorSnapshot;

  const totalLetra = numeroALetrasMX(recibo.total);

  // ── Constantes de layout ─────────────────────────────────────────────────────
  const margenIzq = doc.page.margins.left;
  const anchoUtil = doc.page.width - margenIzq - doc.page.margins.right;

  // Columnas: izquierda (datos) y derecha (No. recibo + total + firma).
  const anchoIzq = Math.round(anchoUtil * 0.6); // ~60% a la izquierda
  const xDer = margenIzq + anchoIzq + 20;
  const anchoDer = anchoUtil - anchoIzq - 20;
  const anchoRecuadroDer = anchoDer;

  // ── Zona derecha: bloque superior (No. RECIBO + TOTAL + LETRA) ──────────────
  // Dibujamos en coordenadas absolutas desde el inicio del cuerpo.

  // Capturamos doc.y ANTES de los writes absolutos: al usar coordenadas
  // explícitas PDFKit actualiza doc.y al final del último text(), y luego
  // la zona izquierda en flujo arrancaría desde esa posición falsa.
  const yInicioCuerpo = doc.y;

  // 1) Recuadro superior: No. RECIBO
  const yRecuadroRecibo = doc.y;
  recuadro(doc, xDer, yRecuadroRecibo, anchoRecuadroDer, 26, {
    etiqueta: 'No. RECIBO',
    grosor: 0.9,
  });
  doc
    .font('Helvetica-Bold')
    .fontSize(14)
    .fillColor('#0f172a')
    .text(recibo.numeroRecibo, xDer, yRecuadroRecibo + 6, {
      width: anchoRecuadroDer,
      align: 'center',
      lineBreak: false,
    });

  // 2) TOTAL grande (sin recuadro, en negritas grandes)
  const yTotalLabel = yRecuadroRecibo + 36;
  doc
    .font('Helvetica-Bold')
    .fontSize(11)
    .fillColor('#475569')
    .text('TOTAL', xDer, yTotalLabel, {
      width: anchoRecuadroDer,
      align: 'center',
      lineBreak: false,
    });

  const yTotalMonto = yTotalLabel + 14;
  doc
    .font('Helvetica-Bold')
    .fontSize(20)
    .fillColor('#0f172a')
    .text(formatearMonedaMX(recibo.total), xDer, yTotalMonto, {
      width: anchoRecuadroDer,
      align: 'center',
      lineBreak: false,
    });

  // 3) Cantidad con letra (debajo del TOTAL)
  const yCantidadLetra = yTotalMonto + 26;
  doc
    .font('Helvetica')
    .fontSize(8)
    .fillColor('#475569')
    .text(`(${totalLetra})`, xDer, yCantidadLetra, {
      width: anchoRecuadroDer,
      align: 'center',
      lineBreak: false,
    });

  // 4) Estatus
  const yEstatus = yCantidadLetra + 14;
  doc
    .font('Helvetica-Bold')
    .fontSize(8)
    .fillColor('#64748b')
    .text('Estatus:', xDer, yEstatus, { lineBreak: false });
  doc
    .font('Helvetica')
    .fontSize(9)
    .fillColor('#0f172a')
    .text(` ${recibo.estatus.toUpperCase()}`, xDer + 38, yEstatus, { lineBreak: false });

  // 5) Recuadro de FIRMA (zona inferior derecha)
  const altoFirma = 50;
  const yFirma = doc.page.height - doc.page.margins.bottom - altoFirma - 20;
  recuadro(doc, xDer, yFirma, anchoRecuadroDer, altoFirma, {
    etiqueta: 'FIRMA',
    grosor: 0.9,
  });
  doc
    .font('Helvetica')
    .fontSize(8)
    .fillColor('#64748b')
    .text('RECIBÍ DE CONFORMIDAD', xDer, yFirma + altoFirma - 12, {
      width: anchoRecuadroDer,
      align: 'center',
      lineBreak: false,
    });

  // ── Zona izquierda: encabezado + cuerpo en flujo ─────────────────────────────
  // Reset explícito de `doc.x` y `doc.y` porque la zona derecha usó
  // coordenadas absolutas y dejó `doc.y` en la posición del FIRMA (~660pt),
  // no en la posición de inicio del cuerpo.
  doc.x = margenIzq;
  doc.y = yInicioCuerpo;

  // ARRENDADOR (etiqueta + valor)
  par(doc, 'ARRENDADOR', arrendador?.nombreCompleto ?? 'A completar manualmente', anchoIzq);

  // RECIBO DE (inquilino)
  if (inquilino) {
    const nombreCompleto = `${inquilino.nombre} ${inquilino.apellidoPaterno} ${inquilino.apellidoMaterno}`.trim();
    par(doc, 'RECIBO DE', nombreCompleto, anchoIzq);

    // DOMICILIO del inquilino
    if (inquilino.domicilio) {
      const d = inquilino.domicilio;
      par(
        doc,
        'DOMICILIO',
        `${d.calle} #${d.numero}, ${d.colonia}, CP ${d.codigoPostal}, ${d.ciudad}, ${d.estado}`,
        anchoIzq,
      );
    } else {
      par(doc, 'DOMICILIO', 'A completar manualmente', anchoIzq);
    }
  } else {
    par(doc, 'RECIBO DE', '—', anchoIzq);
    par(doc, 'DOMICILIO', '—', anchoIzq);
  }

  // PROPIEDAD arrendada (contexto)
  if (propiedad) {
    const d = propiedad.direccion;
    par(
      doc,
      'PROPIEDAD',
      `${propiedad.nombre} — ${d.calle} #${d.numero}, ${d.colonia}`,
      anchoIzq,
    );
  }

  lineaDivisoria(doc);

  // ── PERIODO narrativo ───────────────────────────────────────────────────────
  // "Pago renta del 1 de julio al 1 de agosto del 2026."
  const inicioCorto = formatearFechaCorta(recibo.periodoInicio);
  const finCorto = formatearFechaCorta(recibo.periodoFin);
  const inicioLargo = formatearFechaLarga(recibo.periodoInicio);
  const finLargo = formatearFechaLarga(recibo.periodoFin);
  doc.moveDown(0.4);
  doc
    .font('Helvetica')
    .fontSize(11)
    .fillColor('#0f172a')
    .text(
      `Pago renta del ${inicioLargo} al ${finLargo}.`,
      { width: anchoIzq, align: 'justify', lineGap: 1.5 },
    );
  doc.moveDown(0.2);
  doc
    .font('Helvetica')
    .fontSize(9)
    .fillColor('#64748b')
    .text(
      `Periodo ${inicioCorto} → ${finCorto} · Fecha límite de pago: ${formatearFechaLarga(recibo.fechaLimitePago)}.`,
      { width: anchoIzq, lineGap: 1.5 },
    );

  doc.moveDown(0.4);
  lineaDivisoria(doc);

  // ── CONCEPTOS ────────────────────────────────────────────────────────────────
  doc.font('Helvetica-Bold').fontSize(11).fillColor('#0f172a').text('CONCEPTOS');
  doc.moveDown(0.2);

  // Renta
  concepto(doc, 'Renta del periodo', recibo.renta, anchoIzq);
  if (recibo.otrosCobros > 0) {
    concepto(doc, 'Otros cobros', recibo.otrosCobros, anchoIzq);
  }
  for (const item of recibo.desglose) {
    concepto(doc, `· ${item.descripcion}`, item.monto, anchoIzq);
  }

  doc.moveDown(0.4);
  lineaDivisoria(doc);

  // ── Observaciones ────────────────────────────────────────────────────────────
  doc.moveDown(0.3);
  doc.font('Helvetica').fontSize(9).fillColor('#475569');
  doc.text(
    'Recibí de conformidad la cantidad arriba descrita, correspondiente al periodo indicado. ' +
      'Este comprobante ampara el pago de renta del inmueble arrendado.',
    { width: anchoIzq, align: 'justify', lineGap: 1.5 },
  );

  // Reset x para futuros writes
  doc.x = doc.page.margins.left;
}

// ── Helpers locales ────────────────────────────────────────────────────────────

function par(
  doc: InstanceType<typeof PDFDocument>,
  etiqueta: string,
  valor: string,
  ancho: number,
): void {
  doc.x = doc.page.margins.left;
  doc.font('Helvetica-Bold').fontSize(9).fillColor('#64748b').text(etiqueta, {
    width: ancho,
    continued: false,
  });
  doc.font('Helvetica').fontSize(10).fillColor('#0f172a').text(valor || '—', {
    width: ancho,
  });
  doc.moveDown(0.2);
}

function concepto(
  doc: InstanceType<typeof PDFDocument>,
  descripcion: string,
  monto: number,
  ancho: number,
): void {
  const xIni = doc.page.margins.left;
  const xMonto = xIni + ancho - 90;
  const anchoDesc = ancho - 90;
  const y = doc.y;
  doc.font('Helvetica').fontSize(10).fillColor('#0f172a');
  doc.text(descripcion, xIni, y, { width: anchoDesc, lineBreak: false });
  doc.text(formatearMonedaMX(monto), xMonto, y, {
    width: 90,
    align: 'right',
    lineBreak: false,
  });
  doc.moveDown(0.4);
}
