// Rehace las seis figuras de transformaciones isometricas con la original y su
// imagen dentro de la cuadricula.
// Uso: node --env-file=.env scripts/rehacer-transformaciones.mjs [--aplicar]

import fs from 'node:fs';
import path from 'node:path';
import { Resvg } from '@resvg/resvg-js';
import { PrismaClient } from '@prisma/client';
import { svgDePrimitivas } from './dibujo.mjs';

const prisma = new PrismaClient();
const APLICAR = process.argv.includes('--aplicar');
const dir = path.join(process.cwd(), 'tmp-figuras');
fs.mkdirSync(dir, { recursive: true });

function escena({ xmin, xmax, ymin, ymax, celda = 24, margen = 24 }) {
  const els = [];
  const ancho = margen * 2 + (xmax - xmin) * celda;
  const alto = margen * 2 + (ymax - ymin) * celda;
  const X = (c) => Math.round((margen + (c - xmin) * celda) * 10) / 10;
  const Y = (f) => Math.round((margen + (ymax - f) * celda) * 10) / 10;

  // cuadricula
  for (let c = xmin; c <= xmax; c += 1) {
    els.push({ op: 'line', x1: X(c), y1: Y(ymin), x2: X(c), y2: Y(ymax), grosor: 0.5 });
  }
  for (let f = ymin; f <= ymax; f += 1) {
    els.push({ op: 'line', x1: X(xmin), y1: Y(f), x2: X(xmax), y2: Y(f), grosor: 0.5 });
  }

  // ejes gruesos
  if (xmin <= 0 && xmax >= 0) {
    els.push({ op: 'line', x1: X(0), y1: Y(ymin), x2: X(0), y2: Y(ymax), grosor: 1.6 });
  }
  if (ymin <= 0 && ymax >= 0) {
    els.push({ op: 'line', x1: X(xmin), y1: Y(0), x2: X(xmax), y2: Y(0), grosor: 1.6 });
  }

  return { els, ancho: Math.round(ancho), alto: Math.round(alto), X, Y };
}

function tri(els, X, Y, puntos, relleno) {
  els.push({
    op: 'poly',
    puntos: puntos.map(([c, f]) => `${X(c)},${Y(f)}`).join(' '),
    grosor: 1.2,
    ...(relleno ? { relleno: 'gris' } : {}),
  });
}

function texto(els, x, y, t, tam = 8, anclaje = 'medio', negrita = false) {
  els.push({ op: 'text', x, y, texto: t, tam, anclaje, ...(negrita ? { negrita: true } : {}) });
}

const figuras = [];

// 011 traslacion de 7 a la derecha y 2 hacia abajo
{
  const e = escena({ xmin: 0, xmax: 12, ymin: 0, ymax: 8 });
  tri(e.els, e.X, e.Y, [[1, 5], [3, 5], [1, 7]], true);
  tri(e.els, e.X, e.Y, [[8, 3], [10, 3], [8, 5]]);
  // vector
  e.els.push({ op: 'path', d: `M ${e.X(3)} ${e.Y(6)} L ${e.X(9)} ${e.Y(4)}`, grosor: 1.2 });
  e.els.push({ op: 'poly', puntos: `${e.X(9)},${e.Y(4)} ${e.X(8.5)},${e.Y(4.05)} ${e.X(8.72)},${e.Y(4.5)}`, relleno: 'gris', grosor: 0.9 });
  figuras.push({ codigo: '8B-MAT-GEO-011', primitivas: { ancho: e.ancho, alto: e.alto, elementos: e.els } });
}

// 012 rotacion de 180 grados en torno al centro marcado
{
  const e = escena({ xmin: 0, xmax: 11, ymin: 0, ymax: 9 });
  tri(e.els, e.X, e.Y, [[1, 1], [3, 1], [1, 3]], true);
  tri(e.els, e.X, e.Y, [[9, 7], [7, 7], [9, 5]]);
  e.els.push({ op: 'circle', cx: e.X(5), cy: e.Y(4), r: 3, grosor: 1.2 });
  texto(e.els, e.X(5), e.Y(4) - 10, 'centro', 7.5);
  figuras.push({ codigo: '8B-MAT-GEO-012', primitivas: { ancho: e.ancho, alto: e.alto, elementos: e.els } });
}

// 013 dos reflexiones = traslacion de 8 a la derecha
{
  const e = escena({ xmin: 0, xmax: 12, ymin: 0, ymax: 7 });
  tri(e.els, e.X, e.Y, [[1, 2], [3, 2], [1, 4]], true);
  tri(e.els, e.X, e.Y, [[9, 2], [11, 2], [9, 4]]);
  e.els.push({ op: 'line', x1: e.X(4), y1: e.Y(0), x2: e.X(4), y2: e.Y(7), grosor: 1.1, punteada: true });
  e.els.push({ op: 'line', x1: e.X(8), y1: e.Y(0), x2: e.X(8), y2: e.Y(7), grosor: 1.1, punteada: true });
  figuras.push({ codigo: '8B-MAT-GEO-013', primitivas: { ancho: e.ancho, alto: e.alto, elementos: e.els } });
}

// F2-009 reflexion respecto de la recta horizontal 4 unidades sobre el eje x
{
  const e = escena({ xmin: 0, xmax: 8, ymin: 0, ymax: 8 });
  tri(e.els, e.X, e.Y, [[1, 1], [3, 1], [1, 3]], true);
  tri(e.els, e.X, e.Y, [[1, 7], [3, 7], [1, 5]]);
  texto(e.els, e.X(4), e.Y(0) + 14, 'eje x', 8, 'medio', true);
  figuras.push({ codigo: '8B-MAT-GEO-F2-009', primitivas: { ancho: e.ancho, alto: e.alto, elementos: e.els } });
}

// F3-010 triangulo (2,1) (6,1) (2,5) para reflejar respecto del eje y
{
  const e = escena({ xmin: -1, xmax: 8, ymin: -1, ymax: 7 });
  tri(e.els, e.X, e.Y, [[2, 1], [6, 1], [2, 5]], true);
  figuras.push({ codigo: '8B-MAT-GEO-F3-010', primitivas: { ancho: e.ancho, alto: e.alto, elementos: e.els } });
}

// F3-015 reflexion en el eje y y luego 3 unidades hacia abajo
{
  const e = escena({ xmin: -5, xmax: 5, ymin: 0, ymax: 7 });
  tri(e.els, e.X, e.Y, [[1, 4], [3, 4], [1, 6]], true);
  tri(e.els, e.X, e.Y, [[-1, 1], [-3, 1], [-1, 3]]);
  figuras.push({ codigo: '8B-MAT-GEO-F3-015', primitivas: { ancho: e.ancho, alto: e.alto, elementos: e.els } });
}

// --- guardar y armar la hoja ------------------------------------------------
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
  const col = indice % 3;
  const fila = Math.floor(indice / 3);
  celdas.push(
    `<g transform="translate(${10 + col * 320},${10 + fila * 260})"><rect width="308" height="248" fill="none" stroke="#bbb"/><text x="5" y="12" font-size="9" font-family="Arial" fill="#444">${f.codigo}</text><g transform="translate(4,16)">${cuerpo}</g></g>`
  );
  indice += 1;
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${10 + 3 * 320}" height="${10 + Math.ceil(indice / 3) * 260}"><rect width="100%" height="100%" fill="#fff"/>${celdas.join('')}</svg>`;
const png = new Resvg(svg, {
  fitTo: { mode: 'width', value: 980 },
  font: { loadSystemFonts: true, fontFiles: ['C:/Windows/Fonts/arial.ttf'], defaultFontFamily: 'Arial' },
}).render().asPng();
fs.writeFileSync(path.join(dir, 'transformaciones.png'), png);
console.log('png:', path.join(dir, 'transformaciones.png'));

await prisma.$disconnect();
