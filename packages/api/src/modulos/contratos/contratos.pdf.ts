import type { Contrato } from '@proyecto-modular/shared/tipos/contratos';
import PDFDocument from 'pdfkit';
import { crearDocumentoPDF, tituloSeccion, lineaDivisoria } from '../../core/pdf/documento';
import { agregarPie } from '../../core/pdf/pie';
import { formatearFechaLarga, calcularAntiguedadMeses } from '../../core/pdf/formatos';
import {
  valoresPorDefecto,
  interpolarClausulas,
  interpolarDeclaraciones,
} from './contratos.clausulas';

/**
 * Genera el PDF de un Contrato de Arrendamiento en formato imprimible.
 * Devuelve un Buffer listo para enviarse como `application/pdf`.
 *
 * Layout basado en el modelo mexicano Jalisco (referencia: contrato
 * Providencia 741):
 *   — DECLARACIONES I, II, III, IV con subincisos
 *   — CLÁUSULAS Primera … Vigésima Primera (21 cláusulas)
 *   — Línea de cierre narrativa ("Leído que fue…")
 *   — Firmas: ARRENDADOR / ARRENDATARIO / FIADOR + TESTIGO 1 / TESTIGO 2
 */
export function generarPDFContrato(contrato: Contrato): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = crearDocumentoPDF({
      titulo: 'CONTRATO DE ARRENDAMIENTO',
      subtitulo: 'Versión basada en contrato Providencia 741',
    });

    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    try {
      escribirCuerpo(doc, contrato);
      agregarPie(doc);
    } catch (err) {
      reject(err);
      return;
    }

    doc.end();
  });
}

// ── Renderizado del cuerpo ──────────────────────────────────────────────────────

function escribirCuerpo(doc: InstanceType<typeof PDFDocument>, contrato: Contrato): void {
  const params = valoresPorDefecto(contrato);
  const declaraciones = interpolarDeclaraciones(params);
  const clausulas = interpolarClausulas(params);

  // ── Declaraciones (I, II, III, IV) ──────────────────────────────────────────
  tituloSeccion(doc, 'DECLARACIONES');

  for (const d of declaraciones) {
    doc.font('Helvetica-Bold').fontSize(11).fillColor('#1e293b');
    doc.text(`${d.romano}. ${d.subtitulo}.`);
    doc.moveDown(0.3);

    if (d.introduccion) {
      doc.font('Helvetica').fontSize(10).fillColor('#0f172a');
      doc.text(d.introduccion, { align: 'justify', lineGap: 1.5 });
      doc.moveDown(0.3);
    }

    for (const i of d.incisos) {
      doc.font('Helvetica').fontSize(10).fillColor('#0f172a');
      doc.text(`${i.letra}) ${i.cuerpo}`, {
        align: 'justify',
        lineGap: 1.5,
        indent: 18,
      });
      doc.moveDown(0.2);
    }

    doc.moveDown(0.4);
  }

  lineaDivisoria(doc);

  // ── Cláusulas (21) ──────────────────────────────────────────────────────────
  tituloSeccion(doc, 'CLÁUSULAS');

  doc.font('Helvetica').fontSize(10).fillColor('#0f172a');
  for (const c of clausulas) {
    // Antes de cada cláusula: si queda poco espacio, saltar de página para
    // que la cláusula no se solape con el pie (Generado + Página X de Y).
    const espacioNecesario = 60;
    const espacioDisponible = doc.page.height - doc.page.margins.bottom - doc.y;
    if (espacioDisponible < espacioNecesario) {
      doc.addPage();
    }

    // El espacio al final del título es CRÍTICO: con `continued: true`,
    // PDFKit a veces se trimea el whitespace inicial del siguiente `text()`.
    doc.font('Helvetica-Bold').text(`${c.titulo}. `, { continued: true });
    doc.font('Helvetica').text(c.cuerpo, { align: 'justify', lineGap: 1.5 });
    doc.moveDown(0.4);
  }

  lineaDivisoria(doc);

  // ── Cierre ──────────────────────────────────────────────────────────────────
  // El cierre narrativo se imprime desde la cláusula VIGÉSIMA PRIMERA;
  // aquí añadimos el contexto de "enterados" + las firmas.

  // Si no hay espacio suficiente (~110pt) en la página actual, saltar a una
  // nueva para que las firmas no se solapen con el pie ni se fragmenten.
  const espacioNecesarioFirmas = 110;
  const espacioDisponibleFirmas = doc.page.height - doc.page.margins.bottom - doc.y;
  if (espacioDisponibleFirmas < espacioNecesarioFirmas) {
    doc.addPage();
  }

  tituloSeccion(doc, 'FIRMAS');

  // ── Línea 1: ARRENDADOR / ARRENDATARIO / FIADOR ─────────────────────────────
  const anchoUtil = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const colAncho = anchoUtil / 3;
  const anchoFirma = colAncho - 20;
  const xArrendador = doc.page.margins.left;
  const xArrendatario = xArrendador + colAncho;
  const xFiador = xArrendatario + colAncho;

  const yLinea1 = doc.y + 22;
  doc
    .strokeColor('#94a3b8')
    .lineWidth(0.7)
    .moveTo(xArrendador, yLinea1).lineTo(xArrendador + anchoFirma, yLinea1).stroke()
    .moveTo(xArrendatario, yLinea1).lineTo(xArrendatario + anchoFirma, yLinea1).stroke()
    .moveTo(xFiador, yLinea1).lineTo(xFiador + anchoFirma, yLinea1).stroke();

  doc.fontSize(9).fillColor('#64748b');
  doc.text('ARRENDADOR', xArrendador, yLinea1 + 4, { width: anchoFirma, align: 'center', lineBreak: false });
  doc.text('ARRENDATARIO', xArrendatario, yLinea1 + 4, { width: anchoFirma, align: 'center', lineBreak: false });
  doc.text('FIADOR', xFiador, yLinea1 + 4, { width: anchoFirma, align: 'center', lineBreak: false });

  // ── Línea 2: TESTIGO 1 / TESTIGO 2 (centradas en columnas 1 y 2) ────────────
  const yLinea2 = yLinea1 + 36;
  const anchoTestigo = anchoFirma; // mismo ancho que las firmas principales
  doc
    .strokeColor('#94a3b8')
    .lineWidth(0.7)
    .moveTo(xArrendador, yLinea2).lineTo(xArrendador + anchoTestigo, yLinea2).stroke()
    .moveTo(xArrendatario, yLinea2).lineTo(xArrendatario + anchoTestigo, yLinea2).stroke();

  doc.text('TESTIGO', xArrendador, yLinea2 + 4, { width: anchoTestigo, align: 'center', lineBreak: false });
  doc.text('TESTIGO', xArrendatario, yLinea2 + 4, { width: anchoTestigo, align: 'center', lineBreak: false });

  doc.fontSize(8);
  doc.text('Nombre y firma', xArrendador, yLinea1 + 18, { width: anchoFirma, align: 'center', lineBreak: false });
  doc.text('Nombre y firma', xArrendatario, yLinea1 + 18, { width: anchoFirma, align: 'center', lineBreak: false });
  doc.text('Nombre y firma', xFiador, yLinea1 + 18, { width: anchoFirma, align: 'center', lineBreak: false });
  doc.text('Nombre y firma', xArrendador, yLinea2 + 18, { width: anchoTestigo, align: 'center', lineBreak: false });
  doc.text('Nombre y firma', xArrendatario, yLinea2 + 18, { width: anchoTestigo, align: 'center', lineBreak: false });

  // Reset x para futuros writes
  doc.x = doc.page.margins.left;

  // Metadatos residuales para referencia (la fecha y lugar de firma ya se
  // imprimen en la cláusula VIGÉSIMA PRIMERA y en el encabezado).
  void contrato;
  void formatearFechaLarga;
  void calcularAntiguedadMeses;
}
