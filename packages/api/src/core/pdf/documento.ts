import PDFDocument from 'pdfkit';
import { formatearFechaHoraActual } from './formatos';

/**
 * Opciones para `crearDocumentoPDF`. El encabezado se imprime
 * automáticamente en la primera página (y `pie.agregarPie` se
 * encarga del pie en cada página).
 */
export interface OpcionesDocumento {
  titulo: string;
  subtitulo?: string;
}

/**
 * Crea un `PDFKit.Document` con márgenes A4 estándar, fuente
 * Helvetica (incluida en PDFKit — no requiere asset externo) y
 * un encabezado con título grande + subtítulo + línea divisoria.
 *
 * El caller debe:
 *   1. Llamar `agregarPie(doc)` después para el pie de página.
 *   2. Llamar `doc.end()` cuando termine de escribir contenido.
 *   3. Leer `doc` como Buffer o pipe a un stream de respuesta.
 */
export function crearDocumentoPDF(opciones: OpcionesDocumento): PDFKit.PDFDocument {
  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 90, bottom: 80, left: 60, right: 60 },
    info: {
      Title: opciones.titulo,
      Producer: 'proyecto_modular',
      CreationDate: new Date(),
    },
    bufferPages: true, // necesario para enumerar páginas en el pie
  });

  doc.font('Helvetica');

  // ── Encabezado ────────────────────────────────────────────────────────────
  doc.fontSize(20).font('Helvetica-Bold').fillColor('#1e293b').text(opciones.titulo, {
    align: 'center',
  });

  if (opciones.subtitulo) {
    doc.moveDown(0.3);
    doc.fontSize(10).font('Helvetica-Oblique').fillColor('#64748b').text(opciones.subtitulo, {
      align: 'center',
    });
  }

  // Línea divisoria gris bajo el encabezado
  doc.moveDown(0.6);
  const yLinea = doc.y;
  doc
    .strokeColor('#cbd5e1')
    .lineWidth(0.7)
    .moveTo(doc.page.margins.left, yLinea)
    .lineTo(doc.page.width - doc.page.margins.right, yLinea)
    .stroke();
  doc.moveDown(0.8);

  // Reset estilos para el cuerpo
  doc.font('Helvetica').fontSize(11).fillColor('#0f172a');

  return doc;
}

/** Helper para dibujar un título de sección en negritas */
export function tituloSeccion(doc: PDFKit.PDFDocument, texto: string): void {
  doc.moveDown(0.8);
  doc.font('Helvetica-Bold').fontSize(13).fillColor('#0f172a').text(texto);
  doc.moveDown(0.3);
  doc.font('Helvetica').fontSize(11).fillColor('#0f172a');
}

/** Helper para dibujar un par etiqueta-valor con etiqueta en gris y valor en negro */
export function parEtiquetaValor(
  doc: PDFKit.PDFDocument,
  etiqueta: string,
  valor: string,
): void {
  doc.font('Helvetica-Bold').fontSize(10).fillColor('#64748b').text(etiqueta, { continued: false });
  doc.font('Helvetica').fontSize(11).fillColor('#0f172a').text(valor || '—');
  doc.moveDown(0.3);
}

/** Helper para línea divisoria fina horizontal */
export function lineaDivisoria(doc: PDFKit.PDFDocument): void {
  const y = doc.y;
  doc
    .strokeColor('#e2e8f0')
    .lineWidth(0.5)
    .moveTo(doc.page.margins.left, y)
    .lineTo(doc.page.width - doc.page.margins.right, y)
    .stroke();
  doc.moveDown(0.5);
}

/**
 * Dibuja un recuadro con coordenadas absolutas (no avanza el cursor).
 * Usado para cajas de firma, contenedores de "TOTAL", recuadros
 * de la zona derecha del recibo.
 *
 * Si se pasa `etiqueta`, la dibuja centrada arriba del recuadro.
 */
export interface OpcionesRecuadro {
  etiqueta?: string;
  grosor?: number;
  colorBorde?: string;
  colorEtiqueta?: string;
  fontSizeEtiqueta?: number;
}

export function recuadro(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  ancho: number,
  alto: number,
  opciones: OpcionesRecuadro = {},
): void {
  const grosor = opciones.grosor ?? 0.7;
  const colorBorde = opciones.colorBorde ?? '#94a3b8';
  const colorEtiqueta = opciones.colorEtiqueta ?? '#475569';
  const fontSize = opciones.fontSizeEtiqueta ?? 8;

  doc.save();
  try {
    doc
      .strokeColor(colorBorde)
      .lineWidth(grosor)
      .rect(x, y, ancho, alto)
      .stroke();

    if (opciones.etiqueta) {
      doc
        .font('Helvetica-Bold')
        .fontSize(fontSize)
        .fillColor(colorEtiqueta)
        .text(opciones.etiqueta, x, y - fontSize - 1, {
          width: ancho,
          align: 'center',
          lineBreak: false,
        });
    }
  } finally {
    doc.restore();
  }
}

/** Re-export del formateador de fecha de generación para evitar import circular */
export { formatearFechaHoraActual };