// Hoja de contacto con las figuras de los items indicados.
// Uso: node --env-file=.env scripts/hoja.mjs CODIGO [CODIGO...]

import fs from 'node:fs';
import path from 'node:path';
import { Resvg } from '@resvg/resvg-js';
import { PrismaClient } from '@prisma/client';
import { svgDePrimitivas } from './dibujo.mjs';

const prisma = new PrismaClient();
const codigos = process.argv.slice(2);

if (!codigos.length) {
  console.error('Falta al menos un codigo.');
  process.exit(1);
}

const items = await prisma.item.findMany({
  where: { codigo: { in: codigos } },
  select: { codigo: true, figura: { select: { primitivas: true } } },
});

const porCodigo = new Map(items.map((i) => [i.codigo, i]));
const conFigura = codigos.filter((c) => porCodigo.get(c)?.figura);

if (!conFigura.length) {
  console.log('Ninguno de esos items tiene figura.');
  await prisma.$disconnect();
  process.exit(0);
}

const COLUMNAS = Math.min(3, conFigura.length);
const CELDA_ANCHO = 300;
const CELDA_ALTO = 240;
const MARGEN = 10;

const celdas = conFigura.map((codigo, indice) => {
  const { ancho, alto, cuerpo } = svgDePrimitivas(porCodigo.get(codigo).figura.primitivas);
  const escala = Math.min((CELDA_ANCHO - 20) / ancho, (CELDA_ALTO - 26) / alto, 1);
  const col = indice % COLUMNAS;
  const fila = Math.floor(indice / COLUMNAS);
  const x = MARGEN + col * (CELDA_ANCHO + MARGEN) + (CELDA_ANCHO - ancho * escala) / 2;
  const y = MARGEN + fila * (CELDA_ALTO + MARGEN) + 20;
  return `<rect x="${MARGEN + col * (CELDA_ANCHO + MARGEN)}" y="${MARGEN + fila * (CELDA_ALTO + MARGEN)}" width="${CELDA_ANCHO}" height="${CELDA_ALTO}" fill="none" stroke="#bbb"/><text x="${MARGEN + col * (CELDA_ANCHO + MARGEN) + 5}" y="${MARGEN + fila * (CELDA_ALTO + MARGEN) + 13}" font-size="9" font-family="Arial" fill="#444">${codigo}</text><g transform="translate(${x.toFixed(1)},${y.toFixed(1)}) scale(${escala.toFixed(3)})">${cuerpo}</g>`;
});

const filas = Math.ceil(conFigura.length / COLUMNAS);
const anchoHoja = MARGEN + COLUMNAS * (CELDA_ANCHO + MARGEN);
const altoHoja = MARGEN + filas * (CELDA_ALTO + MARGEN);

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${anchoHoja}" height="${altoHoja}"><rect width="100%" height="100%" fill="#fff"/>${celdas.join('')}</svg>`;

const dir = path.join(process.cwd(), 'tmp-figuras');
fs.mkdirSync(dir, { recursive: true });
const destino = path.join(dir, `hoja-${conFigura[0]}.png`);
const png = new Resvg(svg, {
  fitTo: { mode: 'width', value: Math.min(1100, Math.round(anchoHoja * 1.5)) },
  font: { loadSystemFonts: true, fontFiles: ['C:/Windows/Fonts/arial.ttf'], defaultFontFamily: 'Arial' },
}).render().asPng();
fs.writeFileSync(destino, png);

console.log('figuras:', conFigura.join(', '));
console.log('png:', destino);

await prisma.$disconnect();
