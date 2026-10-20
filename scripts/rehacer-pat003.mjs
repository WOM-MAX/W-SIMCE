// Rehace la recta de la secuencia con marcas y flechas limpias.
// Uso: node --env-file=.env scripts/rehacer-pat003.mjs [--aplicar]

import fs from 'node:fs';
import path from 'node:path';
import { Resvg } from '@resvg/resvg-js';
import { PrismaClient } from '@prisma/client';
import { svgDePrimitivas } from './dibujo.mjs';

const prisma = new PrismaClient();
const APLICAR = process.argv.includes('--aplicar');
const CODIGO = '4B-MAT-PAT-003';

const e = [];
const x0 = 30;
const x1 = 300;
const y = 62;
const maximo = 25;
const escala = (x1 - x0) / maximo;
const X = (v) => Math.round((x0 + v * escala) * 10) / 10;

e.push({ op: 'line', x1: x0, y1: y, x2: x1, y2: y, grosor: 1.3 });
// punta de la recta
e.push({ op: 'poly', puntos: `${x1},${y} ${x1 - 7},${y - 4} ${x1 - 7},${y + 4}`, relleno: 'gris', grosor: 1 });

for (let v = 0; v <= maximo; v += 5) {
  const x = X(v);
  e.push({ op: 'line', x1: x, y1: y - 5, x2: x, y2: y + 5, grosor: 1 });
  e.push({ op: 'text', x, y: y + 20, texto: String(v), tam: 9, anclaje: 'medio' });
}

// marcas de la secuencia, con flecha hacia la recta
for (const v of [5, 10, 15, 20]) {
  const x = X(v);
  e.push({ op: 'line', x1: x, y1: y - 30, x2: x, y2: y - 10, grosor: 1.2 });
  e.push({ op: 'poly', puntos: `${x},${y - 8} ${x - 4},${y - 16} ${x + 4},${y - 16}`, relleno: 'gris', grosor: 1 });
}

e.push({ op: 'text', x: (x0 + x1) / 2, y: 20, texto: 'Secuencia numérica', tam: 9, anclaje: 'medio', negrita: true });

const primitivas = { ancho: 330, alto: 100, elementos: e };

const item = await prisma.item.findUnique({ where: { codigo: CODIGO }, include: { figura: true } });
if (!item || !item.figura) {
  console.error('No se encontro el item.');
  process.exit(1);
}

if (APLICAR) {
  await prisma.figura.update({
    where: { id: item.figura.id },
    data: { primitivas, ancho: primitivas.ancho, alto: primitivas.alto },
  });
  console.log('guardada');
} else {
  console.log('simulacion');
}

const { cuerpo } = svgDePrimitivas(primitivas);
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="330" height="100"><rect width="330" height="100" fill="#fff"/>${cuerpo}</svg>`;
const png = new Resvg(svg, {
  fitTo: { mode: 'width', value: 660 },
  font: { loadSystemFonts: true, fontFiles: ['C:/Windows/Fonts/arial.ttf'], defaultFontFamily: 'Arial' },
}).render().asPng();
const dir = path.join(process.cwd(), 'tmp-figuras');
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, 'pat003.png'), png);
console.log('png:', path.join(dir, 'pat003.png'));

await prisma.$disconnect();
