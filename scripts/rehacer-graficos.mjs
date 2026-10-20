// Rehace las dos figuras de parabola con coordenadas reales.
// Uso: node --env-file=.env scripts/rehacer-graficos.mjs [--aplicar]

import fs from 'node:fs';
import path from 'node:path';
import { Resvg } from '@resvg/resvg-js';
import { PrismaClient } from '@prisma/client';
import { pizarra } from './pizarra.mjs';
import { svgDePrimitivas } from './dibujo.mjs';

const prisma = new PrismaClient();
const APLICAR = process.argv.includes('--aplicar');
const dir = path.join(process.cwd(), 'tmp-figuras');
fs.mkdirSync(dir, { recursive: true });

const figuras = [];

// --- 2M-MAT-ALG-002: f(x) = x^2 y g(x) = -x^2 ------------------------------
{
  const p = pizarra({ ancho: 320, alto: 300, margen: 34, xmin: -3, xmax: 3, ymin: -9, ymax: 9 });
  p.ejes({ paso: 3 });
  p.curva((x) => x * x, -3, 3);
  p.curva((x) => -x * x, -3, 3);
  p.texto(0, 0, 'f', { px: p.X(2.5), py: p.Y(7.4), tam: 10, anclaje: 'izquierda' });
  p.texto(0, 0, 'g', { px: p.X(2.5), py: p.Y(-7), tam: 10, anclaje: 'izquierda' });
  p.texto(0, 0, 'f(x) = x^2  y  g(x) = -x^2', { px: 160, py: 16, tam: 9, anclaje: 'medio', negrita: true });
  figuras.push({ codigo: '2M-MAT-ALG-002', primitivas: { ancho: p.ancho, alto: p.alto, elementos: p.elementos } });
}

// --- 2M-MAT-ALG-F2-006: f(x) = x^2 - 6x + 9 = (x - 3)^2 --------------------
{
  const p = pizarra({ ancho: 320, alto: 300, margen: 40, xmin: 0, xmax: 6, ymin: 0, ymax: 9 });
  p.ejes({ paso: 1 });
  p.curva((x) => (x - 3) * (x - 3), 0, 6);
  p.punto(3, 0, { etiqueta: '(3, 0)', dx: 6, dy: -9 });
  p.texto(0, 0, 'f', { px: p.X(5.4), py: p.Y(7.6), tam: 10, anclaje: 'izquierda' });
  p.texto(0, 0, 'f(x) = x^2 - 6x + 9', { px: 160, py: 16, tam: 9, anclaje: 'medio', negrita: true });
  figuras.push({ codigo: '2M-MAT-ALG-F2-006', primitivas: { ancho: p.ancho, alto: p.alto, elementos: p.elementos } });
}

// --- guardar y renderizar ---------------------------------------------------
const celdas = [];
let indice = 0;

for (const f of figuras) {
  const item = await prisma.item.findUnique({ where: { codigo: f.codigo }, include: { figura: true } });
  if (!item || !item.figura) {
    console.log(`${f.codigo}: sin figura, se omite`);
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

  const { ancho, alto, cuerpo } = svgDePrimitivas(f.primitivas);
  const col = indice % 2;
  const fila = Math.floor(indice / 2);
  celdas.push(
    `<g transform="translate(${10 + col * 340},${10 + fila * 340})"><rect x="0" y="0" width="330" height="330" fill="none" stroke="#bbb"/><text x="6" y="14" font-size="11" font-family="Arial" fill="#444">${f.codigo}</text><g transform="translate(5,20)">${cuerpo}</g></g>`
  );
  indice += 1;
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${10 + 2 * 340}" height="${10 + Math.ceil(indice / 2) * 340}"><rect width="100%" height="100%" fill="#fff"/>${celdas.join('')}</svg>`;
const png = new Resvg(svg, {
  fitTo: { mode: 'width', value: 700 },
  font: { loadSystemFonts: true, fontFiles: ['C:/Windows/Fonts/arial.ttf'], defaultFontFamily: 'Arial' },
}).render().asPng();
fs.writeFileSync(path.join(dir, 'graficos-rehechos.png'), png);
console.log('png:', path.join(dir, 'graficos-rehechos.png'));

await prisma.$disconnect();
