// Rehace la reflexion en la cuadricula y la region de la inecuacion.
// Uso: node --env-file=.env scripts/rehacer-geo-e.mjs [--aplicar]

import fs from 'node:fs';
import path from 'node:path';
import { Resvg } from '@resvg/resvg-js';
import { PrismaClient } from '@prisma/client';
import { svgDePrimitivas } from './dibujo.mjs';

const prisma = new PrismaClient();
const APLICAR = process.argv.includes('--aplicar');
const dir = path.join(process.cwd(), 'tmp-figuras');
fs.mkdirSync(dir, { recursive: true });

const figuras = [];

// --- reflexion respecto del eje vertical, con la original y su imagen -------
{
  const e = [];
  const x0 = 30;
  const y0 = 26;
  const celda = 26;
  const cols = 10;
  const filas = 8;
  const ancho = cols * celda;
  const alto = filas * celda;
  const X = (c) => x0 + c * celda;
  const Y = (f) => y0 + f * celda;

  // cuadricula
  for (let c = 0; c <= cols; c += 1) {
    e.push({ op: 'line', x1: X(c), y1: Y(0), x2: X(c), y2: Y(filas), grosor: 0.6 });
  }
  for (let f = 0; f <= filas; f += 1) {
    e.push({ op: 'line', x1: X(0), y1: Y(f), x2: X(cols), y2: Y(f), grosor: 0.6 });
  }

  // eje de reflexion
  e.push({ op: 'line', x1: X(5), y1: Y(0) - 8, x2: X(5), y2: Y(filas) + 8, grosor: 1.2, punteada: true });

  // original sombreado e imagen sin sombrear
  e.push({ op: 'poly', puntos: `${X(2)},${Y(2)} ${X(4)},${Y(2)} ${X(2)},${Y(4)}`, relleno: 'gris', grosor: 1.2 });
  e.push({ op: 'poly', puntos: `${X(8)},${Y(2)} ${X(6)},${Y(2)} ${X(8)},${Y(4)}`, grosor: 1.2 });

  e.push({ op: 'text', x: X(3), y: Y(4) + 14, texto: 'original', tam: 8, anclaje: 'medio' });
  e.push({ op: 'text', x: X(7), y: Y(4) + 14, texto: 'imagen', tam: 8, anclaje: 'medio' });
  e.push({ op: 'text', x: X(5) + 4, y: Y(0) - 12, texto: 'eje', tam: 8, anclaje: 'izquierda' });

  figuras.push({
    codigo: '8B-MAT-GEO-009',
    primitivas: { ancho: x0 + ancho + 20, alto: y0 + alto + 30, elementos: e },
  });
}

// --- region y < 2x + 3, con la recta segmentada y el punto (0, 3) -----------
{
  const e = [];
  const x0 = 44;
  const y0 = 26;
  const ancho = 250;
  const alto = 170;
  const xmax = 5;
  const ymax = 15;
  const X = (x) => Math.round((x0 + (x / xmax) * ancho) * 10) / 10;
  const Y = (y) => Math.round((y0 + alto - (y / ymax) * alto) * 10) / 10;

  // region sombreada por debajo de la recta
  e.push({
    op: 'poly',
    puntos: `${X(0)},${Y(0)} ${X(0)},${Y(3)} ${X(5)},${Y(13)} ${X(5)},${Y(0)}`,
    relleno: 'gris',
    grosor: 0.8,
  });

  // ejes
  e.push({ op: 'line', x1: X(0), y1: Y(0), x2: X(xmax) + 8, y2: Y(0), grosor: 1.2 });
  e.push({ op: 'line', x1: X(0), y1: Y(0), x2: X(0), y2: Y(ymax) - 8, grosor: 1.2 });

  for (let x = 1; x <= xmax; x += 1) {
    e.push({ op: 'line', x1: X(x), y1: Y(0) - 3, x2: X(x), y2: Y(0) + 3, grosor: 0.8 });
    e.push({ op: 'text', x: X(x), y: Y(0) + 14, texto: String(x), tam: 8, anclaje: 'medio' });
  }
  for (const y of [3, 6, 9, 12]) {
    e.push({ op: 'line', x1: X(0) - 3, y1: Y(y), x2: X(0) + 3, y2: Y(y), grosor: 0.8 });
    e.push({ op: 'text', x: X(0) - 6, y: Y(y) + 3, texto: String(y), tam: 8, anclaje: 'fin' });
  }

  // recta segmentada y = 2x + 3
  e.push({ op: 'line', x1: X(0), y1: Y(3), x2: X(5), y2: Y(13), grosor: 1.4, punteada: true });

  // punto (0, 3)
  e.push({ op: 'circle', cx: X(0), cy: Y(3), r: 2.6, grosor: 1.1 });
  e.push({ op: 'text', x: X(0) + 8, y: Y(3) - 6, texto: '(0, 3)', tam: 8, anclaje: 'izquierda' });

  e.push({ op: 'text', x: X(3.4), y: Y(9.4), texto: 'y = 2x + 3', tam: 9, anclaje: 'izquierda', negrita: true });
  e.push({ op: 'text', x: X(0) + ancho / 2, y: Y(0) + 30, texto: 'Los valores del eje y están en miles de pesos.', tam: 7.5, anclaje: 'medio' });

  figuras.push({ codigo: '8B-MAT-ALG-F3-015', primitivas: { ancho: x0 + ancho + 30, alto: y0 + alto + 46, elementos: e } });
}

const celdas = [];
let indice = 0;

for (const f of figuras) {
  const item = await prisma.item.findUnique({ where: { codigo: f.codigo }, include: { figura: true } });
  if (!item || !item.figura) {
    console.log(`${f.codigo}: sin figura`);
    continue;
  }
  if (APLICAR) {
    await prisma.figura.update({
      where: { id: item.figura.id },
      data: { primitivas: f.primitivas, ancho: f.primitivas.ancho, alto: f.primitivas.alto },
    });
    console.log(`${f.codigo}: guardada`);
  } else {
    console.log(`${f.codigo}: simulacion`);
  }
  const { cuerpo } = svgDePrimitivas(f.primitivas);
  celdas.push(
    `<g transform="translate(${12 + indice * 360},12)"><rect width="346" height="270" fill="none" stroke="#bbb"/><text x="6" y="13" font-size="10" font-family="Arial" fill="#444">${f.codigo}</text><g transform="translate(6,18)">${cuerpo}</g></g>`
  );
  indice += 1;
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${12 + 2 * 360}" height="300"><rect width="100%" height="100%" fill="#fff"/>${celdas.join('')}</svg>`;
const png = new Resvg(svg, {
  fitTo: { mode: 'width', value: 800 },
  font: { loadSystemFonts: true, fontFiles: ['C:/Windows/Fonts/arial.ttf'], defaultFontFamily: 'Arial' },
}).render().asPng();
fs.writeFileSync(path.join(dir, 'geo-e.png'), png);
console.log('png:', path.join(dir, 'geo-e.png'));

await prisma.$disconnect();
