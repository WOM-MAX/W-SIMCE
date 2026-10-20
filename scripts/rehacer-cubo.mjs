// Rehace el cubo de 4 cm de arista construido con cubos de 1 cm3.
// La cuadricula debe mostrar 4 divisiones por lado, no 3.
//
// Uso: node --env-file=.env scripts/rehacer-cubo.mjs [--aplicar]

import fs from 'node:fs';
import path from 'node:path';
import { Resvg } from '@resvg/resvg-js';
import { PrismaClient } from '@prisma/client';
import { svgDePrimitivas } from './dibujo.mjs';

const prisma = new PrismaClient();
const APLICAR = process.argv.includes('--aplicar');
const CODIGO = '6B-MAT-MED-F2-003';

const e = [];
const lado = 100;
const x0 = 55;
const y0 = 55;
const dx = 46;
const dy = -34;
const paso = lado / 4;

const linea = (x1, y1, x2, y2, grosor = 1, punteada = false) =>
  e.push({ op: 'line', x1: r(x1), y1: r(y1), x2: r(x2), y2: r(y2), grosor, ...(punteada ? { punteada } : {}) });

// cara frontal
linea(x0, y0, x0 + lado, y0, 1.4);
linea(x0 + lado, y0, x0 + lado, y0 + lado, 1.4);
linea(x0 + lado, y0 + lado, x0, y0 + lado, 1.4);
linea(x0, y0 + lado, x0, y0, 1.4);

// cuadricula frontal: 4 por 4
for (let k = 1; k < 4; k += 1) {
  linea(x0 + k * paso, y0, x0 + k * paso, y0 + lado, 0.8);
  linea(x0, y0 + k * paso, x0 + lado, y0 + k * paso, 0.8);
}

// cara superior
linea(x0, y0, x0 + dx, y0 + dy, 1.4);
linea(x0 + lado, y0, x0 + lado + dx, y0 + dy, 1.4);
linea(x0 + dx, y0 + dy, x0 + lado + dx, y0 + dy, 1.4);
linea(x0 + lado + dx, y0 + dy, x0 + lado + dx, y0 + lado + dy, 1.4);
linea(x0 + lado, y0 + lado, x0 + lado + dx, y0 + lado + dy, 1.4);

// cuadricula superior: lineas de profundidad
for (let k = 1; k < 4; k += 1) {
  linea(x0 + k * paso, y0, x0 + k * paso + dx, y0 + dy, 0.8);
  const t = k / 4;
  linea(x0 + dx * t, y0 + dy * t, x0 + lado + dx * t, y0 + dy * t, 0.8);
}

// cuadricula lateral derecha
for (let k = 1; k < 4; k += 1) {
  linea(x0 + lado, y0 + k * paso, x0 + lado + dx, y0 + k * paso + dy, 0.8);
  const t = k / 4;
  linea(x0 + lado + dx * t, y0 + dy * t, x0 + lado + dx * t, y0 + lado + dy * t, 0.8);
}

// aristas ocultas
linea(x0, y0 + lado, x0 + dx, y0 + lado + dy, 0.8, true);
linea(x0 + dx, y0 + lado + dy, x0 + dx, y0 + dy, 0.8, true);
linea(x0 + dx, y0 + lado + dy, x0 + lado + dx, y0 + lado + dy, 0.8, true);

// rotulo de la arista
linea(x0, y0 + lado + 18, x0 + lado, y0 + lado + 18, 0.8);
linea(x0, y0 + lado + 14, x0, y0 + lado + 22, 0.8);
linea(x0 + lado, y0 + lado + 14, x0 + lado, y0 + lado + 22, 0.8);
e.push({ op: 'text', x: x0 + lado / 2, y: y0 + lado + 34, texto: '4 cm', tam: 10, anclaje: 'medio' });
e.push({ op: 'text', x: x0 + lado / 2, y: 20, texto: 'Cubo armado con cubos de 1 cm³', tam: 9, anclaje: 'medio', negrita: true });

const primitivas = { ancho: 260, alto: 215, elementos: e };

function r(n) {
  return Math.round(n * 10) / 10;
}

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
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${primitivas.ancho}" height="${primitivas.alto}"><rect width="100%" height="100%" fill="#fff"/>${cuerpo}</svg>`;
const png = new Resvg(svg, {
  fitTo: { mode: 'width', value: 660 },
  font: { loadSystemFonts: true, fontFiles: ['C:/Windows/Fonts/arial.ttf'], defaultFontFamily: 'Arial' },
}).render().asPng();
const dir = path.join(process.cwd(), 'tmp-figuras');
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, 'cubo.png'), png);
console.log('png:', path.join(dir, 'cubo.png'));

await prisma.$disconnect();
