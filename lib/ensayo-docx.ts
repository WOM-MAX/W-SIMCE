// Ensayo a Word (.docx) con la librería docx. Tamaño de hoja configurable.

import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  ImageRun,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx';
import { MARGEN_MM, TAMANOS, type Documento } from '@/lib/documento';
import { pngDeFigura } from '@/lib/figura-png';

// docx trabaja en twips: 1 mm = 56,6929 twips.
function mmATwips(mm: number): number {
  return Math.round(mm * 56.6929);
}

// 1 mm = 2,8346 puntos.
function mmAPuntos(mm: number): number {
  return Math.round(mm * 2.8346);
}

const LETRAS = ['A', 'B', 'C', 'D', 'E'];

function parrafo(texto: string, opciones: { negrita?: boolean; tam?: number; gris?: string; espacio?: number } = {}) {
  return new Paragraph({
    spacing: { after: opciones.espacio ?? 60 },
    children: [
      new TextRun({
        text: texto,
        bold: opciones.negrita,
        size: (opciones.tam ?? 10) * 2, // docx usa medios puntos
        color: opciones.gris ?? '111111',
      }),
    ],
  });
}

export async function documentoDocx(doc: Documento): Promise<Buffer> {
  const [anchoMm, altoMm] = TAMANOS[doc.tamano].mm;
  const utilMm = anchoMm - MARGEN_MM * 2;

  const hijos: Array<Paragraph | Table> = [];

  hijos.push(
    parrafo(doc.colegio.toUpperCase(), { tam: 9, gris: '666666' }),
    new Paragraph({
      spacing: { after: 40 },
      heading: HeadingLevel.HEADING_1,
      children: [new TextRun({ text: doc.titulo, bold: true, size: 36 })],
    }),
    parrafo(
      `${doc.asignatura} · ${doc.nivel} · ${doc.preguntas.length} preguntas · ` +
        (doc.tiempoMin === 0 ? 'sin límite de tiempo' : `${doc.tiempoMin} minutos`),
      { tam: 10, gris: '555555', espacio: 120 }
    ),
    parrafo('Nombre: ______________________________________     Curso: ____________     Fecha: ____________', {
      tam: 10,
      espacio: 120,
    }),
    parrafo(
      'Instrucciones: marca una sola alternativa por pregunta. Usa la hoja de respuestas del final. ' +
        'No se permite el uso de calculadora salvo que el profesor lo indique.',
      { tam: 9, gris: '555555', espacio: 240 }
    )
  );

  for (const p of doc.preguntas) {
    if (p.lectura) {
      hijos.push(
        new Paragraph({
          spacing: { before: 120, after: 60 },
          border: {
            top: { style: BorderStyle.SINGLE, size: 6, color: 'CCCCCC' },
            bottom: { style: BorderStyle.SINGLE, size: 6, color: 'CCCCCC' },
            left: { style: BorderStyle.SINGLE, size: 6, color: 'CCCCCC' },
            right: { style: BorderStyle.SINGLE, size: 6, color: 'CCCCCC' },
          },
          children: [new TextRun({ text: p.lectura.titulo, bold: true, size: 20 })],
        }),
        parrafo(p.lectura.cuerpo, { tam: 10, espacio: 60 }),
        ...(p.lectura.fuente
          ? [parrafo(`Fuente: ${p.lectura.fuente}`, { tam: 8, gris: '777777', espacio: 120 })]
          : [])
      );
    }

    hijos.push(
      new Paragraph({
        spacing: { before: 160, after: 60 },
        children: [
          new TextRun({ text: `${p.numero}. `, bold: true, size: 20 }),
          new TextRun({ text: p.enunciado, size: 20 }),
        ],
      })
    );

    if (p.figura) {
      const png = pngDeFigura(p.figura.primitivas, p.figura.anchoMm);
      if (png) {
        const primitivas = p.figura.primitivas as Record<string, unknown>;
        const anchoOrig = Number(primitivas?.ancho) || 400;
        const altoOrig = Number(primitivas?.alto) || 200;
        const anchoPuntos = mmAPuntos(p.figura.anchoMm);
        const altoPuntos = Math.round((anchoPuntos * altoOrig) / anchoOrig);
        hijos.push(
          new Paragraph({
            spacing: { before: 60, after: 120 },
            children: [
              new ImageRun({
                type: 'png',
                data: png,
                transformation: { width: anchoPuntos, height: altoPuntos },
              }),
            ],
          })
        );
      }
    }

    for (const a of p.alternativas) {
      const esClave = doc.conClave && a.letra === p.clave;
      hijos.push(
        new Paragraph({
          spacing: { after: 40 },
          indent: { left: mmATwips(6) },
          children: [
            new TextRun({ text: `${a.letra}) `, bold: true, size: 20 }),
            new TextRun({ text: a.texto, size: 20 }),
            ...(esClave
              ? [new TextRun({ text: '   CLAVE', bold: true, size: 16, color: 'B02A0E' })]
              : []),
          ],
        })
      );
    }
  }

  // Hoja de respuestas
  hijos.push(
    new Paragraph({
      pageBreakBefore: true,
      spacing: { after: 120 },
      heading: HeadingLevel.HEADING_2,
      children: [new TextRun({ text: 'Hoja de respuestas', bold: true, size: 28 })],
    }),
    parrafo('Nombre: ______________________________________     Curso: ______________', {
      tam: 10,
      espacio: 200,
    })
  );

  const filas: TableRow[] = [];
  const cabecera = new TableRow({
    children: [
      new TableCell({ children: [parrafo('N.º', { tam: 8, gris: '666666', negrita: true })] }),
      ...LETRAS.map(
        (l) => new TableCell({ children: [parrafo(l, { tam: 8, gris: '666666', negrita: true })] })
      ),
      new TableCell({ children: [parrafo('N.º', { tam: 8, gris: '666666', negrita: true })] }),
      ...LETRAS.map(
        (l) => new TableCell({ children: [parrafo(l, { tam: 8, gris: '666666', negrita: true })] })
      ),
    ],
  });
  filas.push(cabecera);

  const mitad = Math.ceil(doc.preguntas.length / 2);
  for (let i = 0; i < mitad; i += 1) {
    const a = i + 1;
    const b = i + 1 + mitad;
    filas.push(
      new TableRow({
        children: [
          new TableCell({ children: [parrafo(String(a), { tam: 9, negrita: true })] }),
          ...LETRAS.map(() => new TableCell({ children: [parrafo('○', { tam: 10, gris: '999999' })] })),
          new TableCell({
            children: [parrafo(b <= doc.preguntas.length ? String(b) : '', { tam: 9, negrita: true })],
          }),
          ...LETRAS.map(
            () =>
              new TableCell({
                children: [
                  parrafo(b <= doc.preguntas.length ? '○' : '', { tam: 10, gris: '999999' }),
                ],
              })
          ),
        ],
      })
    );
  }

  hijos.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: filas,
    })
  );

  if (doc.conClave) {
    hijos.push(
      new Paragraph({
        spacing: { before: 240, after: 80 },
        children: [new TextRun({ text: 'Clave de corrección', bold: true, size: 22 })],
      }),
      parrafo(doc.preguntas.map((p) => `${p.numero}:${p.clave}`).join('   '), { tam: 9 })
    );
  }

  hijos.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 240 },
      children: [
        new TextRun({
          text: `${doc.colegio} · W-SIMCE`,
          size: 16,
          color: '888888',
        }),
      ],
    })
  );

  const documento = new Document({
    creator: 'W-SIMCE',
    title: doc.titulo,
    description: `${doc.asignatura} · ${doc.nivel}`,
    sections: [
      {
        properties: {
          page: {
            size: { width: mmATwips(anchoMm), height: mmATwips(altoMm) },
            margin: {
              top: mmATwips(MARGEN_MM),
              bottom: mmATwips(MARGEN_MM),
              left: mmATwips(MARGEN_MM),
              right: mmATwips(MARGEN_MM),
            },
          },
        },
        children: hijos,
      },
    ],
  });

  return Packer.toBuffer(documento);
}
