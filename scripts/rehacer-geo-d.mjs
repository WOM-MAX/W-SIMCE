// Rehace los cuatro angulos y la recta con la flecha en 3/5.
// Uso: node --env-file=.env scripts/rehacer-geo-d.mjs [--aplicar]

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

// --- cuatro angulos: solo uno entre 90 y 120 grados -------------------------
{
  const e = [];
  const casos = [
    { etiqueta: 'A', grados: 40, vx: 55, vy: 95 },
    { etiqueta: 'B', grados: 90, vx: 215, vy: 95 },
    { etiqueta: 'C', grados: 140, vx: 55, vy: 205 },
    { etiqueta: 'D', grados: 105, vx: 215, vy: 205 },
  ];
  const largo = 62;
  const radio = 22;

  for (const c of casos) {
    const rad = (c.grados * Math.PI) / 180;
    e.push({ op: 'line', x1: c.vx, y1: c.vy, x2: c.vx + largo, y2: c.vy, grosor: 1.3 });
    e.push({
      op: 'line',
      x1: c.vx,
      y1: c.vy,
      x2: Math.round((c.vx + largo * Math.cos(rad)) * 10) / 10,
      y2: Math.round((c.vy - largo * Math.sin(rad)) * 10) / 10,
      grosor: 1.3,
    });
    e.push({
      op: 'path',
      d: `M ${c.vx + radio} ${c.vy} A ${radio} ${radio} 0 0 0 ${Math.round((c.vx + radio * Math.cos(rad)) * 10) / 10} ${Math.round((c.vy - radio * Math.sin(rad)) * 10) / 10}`,
      grosor: 1,
    });
    e.push({ op: 'circle', cx: c.vx, cy: c.vy, r: 1.8, grosor: 0.9 });
    e.push({ op: 'text', x: c.vx, y: c.vy + 22, texto: `Ángulo ${c.etiqueta}`, tam: 10, anclaje: 'medio' });
  }

  figuras.push({ codigo: '4B-MAT-GEO-F3-009', primitivas: { ancho: 320, alto: 240, elementos: e } });
}

// --- recta dividida en quintos, con la flecha en 3/5 ------------------------
{
  const e = [];
  const x0 = 30;
  const x1 = 290;
  const y = 46;
  const paso = (x1 - x0) / 5;

  e.push({ op: 'line', x1: x0, y1: y, x2: x1, y2: y, grosor: 1.2 });

  const rotulados = { 0: '0', 1: '1/5', 2: '2/5', 4: '4/5', 5: '1' };
  for (let k = 0; k <= 5; k += 1) {
    const x = x0 + k * paso;
    e.push({ op: 'line', x1: x, y1: y - 5, x2: x, y2: y + 5, grosor: 1 });
    if (rotulados[k]) {
      e.push({ op: 'text', x, y: y + 20, texto: rotulados[k], tam: 9, anclaje: 'medio' });
    }
  }

  // flecha que señala el tercer quinto
  const objetivo = x0 + 3 * paso;
  e.push({ op: 'line', x1: objetivo, y1: y - 34, x2: objetivo, y2: y - 8, grosor: 1.2 });
  e.push({ op: 'path', d: `M ${objetivo - 4} ${y - 14} L ${objetivo} ${y - 6} L ${objetivo + 4} ${y - 14}`, grosor: 1.2 });
  e.push({ op: 'text', x: objetivo, y: y - 40, texto: '?', tam: 11, anclaje: 'medio', negrita: true });

  figuras.push({ codigo: '4B-MAT-NUM-F2-022', primitivas: { ancho: 320, alto: 90, elementos: e } });
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

  const { ancho, alto, cuerpo } = svgDePrimitivas(f.primitivas);
  const col = indice % 2;
  celdas.push(
    `<g transform="translate(${12 + col * 350},${12})"><rect width="336" height="${alto + 24}" fill="none" stroke="#bbb"/><text x="6" y="13" font-size="10" font-family="Arial" fill="#444">${f.codigo}</text><g transform="translate(6,18)">${cuerpo}</g></g>`
  );
  indice += 1;
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${12 + 2 * 350}" height="290"><rect width="100%" height="100%" fill="#fff"/>${celdas.join('')}</svg>`;
const png = new Resvg(svg, {
  fitTo: { mode: 'width', value: 760 },
  font: { loadSystemFonts: true, fontFiles: ['C:/Windows/Fonts/arial.ttf'], defaultFontFamily: 'Arial' },
}).render().asPng();
fs.writeFileSync(path.join(dir, 'geo-d.png'), png);
console.log('png:', path.join(dir, 'geo-d.png'));

await prisma.$disconnect();
