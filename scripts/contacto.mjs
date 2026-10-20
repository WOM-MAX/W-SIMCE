// Hoja de contacto: varias figuras en una sola imagen para revisarlas de un golpe.
// Uso: node --env-file=.env scripts/contacto.mjs [desde] [cantidad]
//
// Filtra figuras con estructura de ejes o curvas, que son las sospechosas.

import fs from 'node:fs';
import path from 'node:path';
import { Resvg } from '@resvg/resvg-js';
import { PrismaClient } from '@prisma/client';
import { svgDePrimitivas } from './dibujo.mjs';

const prisma = new PrismaClient();
const desde = Number.parseInt(process.argv[2] ?? '0', 10) || 0;
const cantidad = Number.parseInt(process.argv[3] ?? '8', 10) || 8;

const CELDA_ANCHO = 300;
const CELDA_ALTO = 250;
const COLUMNAS = 2;
const MARGEN = 10;

const items = await prisma.item.findMany({
  where: { figuraId: { not: null } },
  select: { codigo: true, figura: { select: { codigo: true, primitivas: true } } },
  orderBy: { codigo: 'asc' },
});

const sospechosas = items.filter((i) => {
  const els = i.figura.primitivas?.elementos ?? [];
  const lineas = els.filter((e) => e.op === 'line').length;
  const rects = els.filter((e) => e.op === 'rect').length;
  const paths = els.filter((e) => e.op === 'path').length;
  return paths > 0 || (lineas >= 6 && rects <= 2);
});

const lote = sospechosas.slice(desde, desde + cantidad);
if (!lote.length) {
  console.log('No hay mas figuras en ese rango. Total sospechosas:', sospechosas.length);
  await prisma.$disconnect();
  process.exit(0);
}

const filas = Math.ceil(lote.length / COLUMNAS);
const ancho = COLUMNAS * CELDA_ANCHO + MARGEN * (COLUMNAS + 1);
const alto = filas * (CELDA_ALTO + 22) + MARGEN * (filas + 1);

const celdas = lote
  .map((item, indice) => {
    const { ancho: aw, alto: ah, cuerpo } = svgDePrimitivas(item.figura.primitivas);
    const escala = Math.min((CELDA_ANCHO - 16) / aw, (CELDA_ALTO - 16) / ah, 1);
    const col = indice % COLUMNAS;
    const fila = Math.floor(indice / COLUMNAS);
    const x = MARGEN + col * (CELDA_ANCHO + MARGEN) + (CELDA_ANCHO - aw * escala) / 2;
    const y = MARGEN + fila * (CELDA_ALTO + 22 + MARGEN) + 18;
    return `
      <rect x="${MARGEN + col * (CELDA_ANCHO + MARGEN)}" y="${MARGEN + fila * (CELDA_ALTO + 22 + MARGEN)}" width="${CELDA_ANCHO}" height="${CELDA_ALTO + 16}" fill="none" stroke="#bbb"/>
      <text x="${MARGEN + col * (CELDA_ANCHO + MARGEN) + 6}" y="${MARGEN + fila * (CELDA_ALTO + 22 + MARGEN) + 13}" font-size="10" font-family="Arial" fill="#444">${item.codigo} · ${item.figura.codigo}</text>
      <g transform="translate(${x.toFixed(1)},${y.toFixed(1)}) scale(${escala.toFixed(3)})">${cuerpo}</g>`;
  })
  .join('');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${ancho}" height="${alto}"><rect width="${ancho}" height="${alto}" fill="#ffffff"/>${celdas}</svg>`;

const dir = path.join(process.cwd(), 'tmp-figuras');
fs.mkdirSync(dir, { recursive: true });
const destino = path.join(dir, `contacto-${desde}.png`);
const png = new Resvg(svg, {
  fitTo: { mode: 'width', value: Math.round(ancho * 1.6) },
  font: { loadSystemFonts: true, fontFiles: ['C:/Windows/Fonts/arial.ttf'], defaultFontFamily: 'Arial' },
}).render().asPng();
fs.writeFileSync(destino, png);

console.log('sospechosas totales:', sospechosas.length);
console.log(`lote ${desde}..${desde + lote.length - 1}`);
for (const i of lote) console.log('  ' + i.codigo);
console.log('png:', destino);

await prisma.$disconnect();
