// Rehace las dos figuras de esfera: la simple con su radio y la inscrita en el
// cilindro, donde la esfera toca tapas y pared.
//
// Uso: node --env-file=.env scripts/rehacer-esferas.mjs [--aplicar]

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

// --- esfera de radio r ------------------------------------------------------
figuras.push({
  codigo: '2M-MAT-GEO-001',
  primitivas: {
    ancho: 300,
    alto: 180,
    elementos: [
      { op: 'circle', cx: 150, cy: 84, r: 58, grosor: 1.3 },
      // arco del ecuador, para que se lea como esfera y no como circulo plano
      { op: 'path', d: 'M 92 84 A 58 16 0 0 0 208 84', grosor: 0.9 },
      { op: 'path', d: 'M 92 84 A 58 16 0 0 1 208 84', grosor: 0.9, punteada: true },
      { op: 'line', x1: 150, y1: 84, x2: 208, y2: 84, grosor: 1.1 },
      { op: 'text', x: 179, y: 78, texto: 'r', tam: 11, anclaje: 'medio', negrita: true },
      { op: 'text', x: 150, y: 168, texto: 'Esfera de radio r.', tam: 9, anclaje: 'medio' },
    ],
  },
});

// --- esfera inscrita en un cilindro de radio r y altura 2r -------------------
figuras.push({
  codigo: '2M-MAT-GEO-004',
  primitivas: {
    ancho: 300,
    alto: 200,
    elementos: [
      // cilindro en vista frontal: rectangulo de 2r por 2r
      { op: 'rect', x: 105, y: 45, w: 90, h: 90, grosor: 1.3 },
      // tapas, para que se lea como cilindro
      { op: 'path', d: 'M 105 45 A 45 11 0 0 0 195 45', grosor: 0.9 },
      { op: 'path', d: 'M 105 135 A 45 11 0 0 1 195 135', grosor: 0.9 },
      { op: 'path', d: 'M 105 135 A 45 11 0 0 0 195 135', grosor: 0.9, punteada: true },
      // esfera inscrita: diametro igual a la altura, tangente a tapas y pared
      { op: 'circle', cx: 150, cy: 90, r: 45, grosor: 1.4 },
      { op: 'line', x1: 150, y1: 90, x2: 195, y2: 90, grosor: 1 },
      { op: 'text', x: 170, y: 84, texto: 'r', tam: 10, anclaje: 'medio', negrita: true },
      // altura del cilindro
      { op: 'line', x1: 92, y1: 45, x2: 92, y2: 135, grosor: 0.9 },
      { op: 'line', x1: 88, y1: 45, x2: 96, y2: 45, grosor: 0.9 },
      { op: 'line', x1: 88, y1: 135, x2: 96, y2: 135, grosor: 0.9 },
      { op: 'text', x: 84, y: 94, texto: '2r', tam: 10, anclaje: 'fin', negrita: true },
      { op: 'text', x: 150, y: 186, texto: 'Esfera inscrita en el cilindro.', tam: 9, anclaje: 'medio' },
    ],
  },
});

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
  const col = indice % 2;
  celdas.push(
    `<g transform="translate(${12 + col * 330},${12})"><rect width="318" height="210" fill="none" stroke="#bbb"/><text x="6" y="13" font-size="10" font-family="Arial" fill="#444">${f.codigo}</text><g transform="translate(4,20)">${cuerpo}</g></g>`
  );
  indice += 1;
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${12 + 2 * 330}" height="240"><rect width="100%" height="100%" fill="#fff"/>${celdas.join('')}</svg>`;
const png = new Resvg(svg, {
  fitTo: { mode: 'width', value: 700 },
  font: { loadSystemFonts: true, fontFiles: ['C:/Windows/Fonts/arial.ttf'], defaultFontFamily: 'Arial' },
}).render().asPng();
fs.writeFileSync(path.join(dir, 'esferas-rehechas.png'), png);
console.log('png:', path.join(dir, 'esferas-rehechas.png'));

await prisma.$disconnect();
