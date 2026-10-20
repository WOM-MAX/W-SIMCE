// Rehace la figura del item 2M-MAT-ALG-011 con coordenadas reales.
// f(x) = 2x + 1 pasa por (2, 5); su inversa es la reflejada respecto de y = x.
//
// Uso: node --env-file=.env scripts/rehacer-alg011.mjs [--aplicar]

import { Resvg } from '@resvg/resvg-js';
import fs from 'node:fs';
import path from 'node:path';
import { PrismaClient } from '@prisma/client';
import { pizarra } from './pizarra.mjs';

const prisma = new PrismaClient();
const APLICAR = process.argv.includes('--aplicar');
const CODIGO = '2M-MAT-ALG-011';

const p = pizarra({ ancho: 320, alto: 300, margen: 36, xmin: 0, xmax: 8, ymin: 0, ymax: 8 });

p.ejes({ paso: 2 });

// f(x) = 2x + 1, visible entre x = 0 y x = 3,5
p.recta(0, 1, 3.5, 8, { etiqueta: 'f', enX: 2.4, dy: -8, dx: 8 });

// La inversa: (x - 1) / 2, de (1,0) a (8,3.5)
p.recta(1, 0, 8, 3.5, { etiqueta: 'f^-1', enX: 7, dy: -10 });

// La recta y = x, de referencia
p.recta(0, 0, 8, 8, { punteada: true, etiqueta: 'y = x', enX: 5.2, dy: -14, dx: -6 });

// El punto que da el enunciado
p.punto(2, 5, { etiqueta: '(2, 5)', dx: 8, dy: -6 });

// La reflexion del punto, para que se vea la simetria
p.punto(5, 2, { etiqueta: '(5, 2)', dx: 8, dy: 12 });

const primitivas = { ancho: p.ancho, alto: p.alto, elementos: p.elementos };

const item = await prisma.item.findUnique({ where: { codigo: CODIGO }, include: { figura: true } });
if (!item || !item.figura) {
  console.error('No se encontro el item o su figura.');
  process.exit(1);
}

if (APLICAR) {
  await prisma.figura.update({
    where: { id: item.figura.id },
    data: { primitivas, ancho: p.ancho, alto: p.alto },
  });
  console.log('figura actualizada en la base');
} else {
  console.log('simulacion: usa --aplicar para guardar');
}

// Render de comprobacion, con el mismo criterio que el visor.
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${p.ancho}" height="${p.alto}" viewBox="0 0 ${p.ancho} ${p.alto}"><rect width="${p.ancho}" height="${p.alto}" fill="#ffffff"/>${p.elementos
  .map((e) => {
    if (e.op === 'line') return `<line x1="${e.x1}" y1="${e.y1}" x2="${e.x2}" y2="${e.y2}" stroke="#000" stroke-width="${e.grosor}"${e.punteada ? ' stroke-dasharray="3 2.4"' : ''}/>`;
    if (e.op === 'circle') return `<circle cx="${e.cx}" cy="${e.cy}" r="${e.r}" fill="#fff" stroke="#000" stroke-width="1"/>`;
    if (e.op === 'text') {
      return `<text x="${e.x}" y="${e.y}" font-size="${e.tam}" font-family="Helvetica, Arial, sans-serif" text-anchor="${e.anclaje === 'medio' ? 'middle' : e.anclaje === 'fin' ? 'end' : 'start'}" fill="#000">${String(e.texto).replace(/&/g, '&amp;').replace(/</g, '&lt;')}</text>`;
    }
    return '';
  })
  .join('')}</svg>`;

const dir = path.join(process.cwd(), 'tmp-figuras');
fs.mkdirSync(dir, { recursive: true });
const png = new Resvg(svg, {
  fitTo: { mode: 'width', value: p.ancho * 2 },
  font: { loadSystemFonts: true, fontFiles: ['C:/Windows/Fonts/arial.ttf'], defaultFontFamily: 'Arial' },
}).render().asPng();
fs.writeFileSync(path.join(dir, `${CODIGO}-nueva.png`), png);
console.log('png:', path.join(dir, `${CODIGO}-nueva.png`), png.length, 'bytes');

await prisma.$disconnect();
