import PDFDocument from 'pdfkit';
import { formatearFechaHoraActual } from './formatos';

/**
 * Dibuja el pie de página ("Generado el <fecha> · proyecto_modular · Página N de M")
 * en TODAS las páginas buffered del documento.
 *
 * Estrategia: en lugar de registrar un `pageAdded` (que interactúa con el
 * LineWrapper del documento y genera recursión), se itera el rango de páginas
 * buffered después de que el cuerpo terminó de escribirse, usando
 * `doc.switchToPage(i)`. Cada página recibe el pie con coordenadas absolutas.
 *
 * `agregarPie` debe llamarse UNA sola vez, DESPUÉS de que el cuerpo se haya
 * escrito y ANTES de `doc.end()`.
 */
export function agregarPie(doc: InstanceType<typeof PDFDocument>): void {
  const range = doc.bufferedPageRange(); // { start, count }
  const totalPaginas = range.count;
  const fechaGeneracion = `Generado el ${formatearFechaHoraActual()}`;

  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);

    const yPie = doc.page.height - doc.page.margins.bottom - 14;
    const ancho = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const paginaActual = i - range.start + 1;

    doc.save();
    try {
      doc.fontSize(8).fillColor('#94a3b8');

      doc.text(fechaGeneracion, doc.page.margins.left, yPie, {
        width: ancho,
        align: 'left',
        lineBreak: false,
      });

      doc.text(`Página ${paginaActual} de ${totalPaginas}`, doc.page.margins.left, yPie, {
        width: ancho,
        align: 'right',
        lineBreak: false,
      });
    } finally {
      doc.restore();
    }
  }

  // Reset estilos por si el caller sigue escribiendo (raro, pero defensivo)
  doc.fillColor('#0f172a').fontSize(11);
}