// Rehace el arbol de probabilidad, el transportador vacio y los dos angulos.
// Uso: node --env-file=.env scripts/rehacer-geo-c.mjs [--aplicar]

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

// --- arbol de dos controles: 0,9 / 0,1 y luego 0,8 / 0,2 --------------------
{
  const e = [];
  const linea = (x1, y1, x2, y2) => e.push({ op: 'line', x1, y1, x2, y2, grosor: 1.1 });
  const nodo = (x, y) => e.push({ op: 'circle', cx: x, cy: y, r: 2.6, grosor: 1 });
  const texto = (x, y, t, tam = 9, anclaje = 'medio', negrita = false) =>
    e.push({ op: 'text', x, y, texto: t, tam, anclaje, ...(negrita ? { negrita: true } : {}) });

  const raiz = [40, 110];
  const n1 = [165, 60];
  const n1b = [165, 160];
  const hojas = [
    [305, 28],
    [305, 92],
    [305, 128],
    [305, 192],
  ];

  linea(raiz[0], raiz[1], n1[0], n1[1]);
  linea(raiz[0], raiz[1], n1b[0], n1b[1]);
  linea(n1[0], n1[1], hojas[0][0], hojas[0][1]);
  linea(n1[0], n1[1], hojas[1][0], hojas[1][1]);
  linea(n1b[0], n1b[1], hojas[2][0], hojas[2][1]);
  linea(n1b[0], n1b[1], hojas[3][0], hojas[3][1]);

  nodo(raiz[0], raiz[1]);
  nodo(n1[0], n1[1]);
  nodo(n1b[0], n1b[1]);
  for (const h of hojas) nodo(h[0], h[1]);

  texto(36, 114, 'Inicio', 9, 'fin');
  texto(100, 78, '0,9', 10, 'medio', true);
  texto(100, 145, '0,1', 10, 'medio', true);
  texto(232, 36, '0,8', 10, 'medio', true);
  texto(232, 82, '0,2', 10, 'medio', true);
  texto(232, 138, '0,8', 10, 'medio', true);
  texto(232, 186, '0,2', 10, 'medio', true);

  texto(165, 14, 'Control 1', 9, 'medio', true);
  texto(305, 14, 'Control 2', 9, 'medio', true);

  texto(314, 32, 'aprueba y aprueba', 8, 'izquierda');
  texto(314, 96, 'aprueba y no aprueba', 8, 'izquierda');
  texto(314, 132, 'no aprueba y aprueba', 8, 'izquierda');
  texto(314, 196, 'no aprueba y no aprueba', 8, 'izquierda');

  figuras.push({ codigo: '2M-MAT-PRO-011', primitivas: { ancho: 450, alto: 210, elementos: e } });
}

// --- transportador vacio: solo la escala ------------------------------------
{
  const e = [];
  const cx = 150;
  const cy = 145;
  const r = 112;

  e.push({ op: 'line', x1: cx - r, y1: cy, x2: cx + r, y2: cy, grosor: 1.3 });
  e.push({ op: 'path', d: `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`, grosor: 1.3 });

  for (let grados = 0; grados <= 180; grados += 5) {
    const t = ((180 - grados) * Math.PI) / 180;
    const largo = grados % 30 === 0 ? 16 : grados % 10 === 0 ? 11 : 7;
    const x1 = cx + r * Math.cos(t);
    const y1 = cy - r * Math.sin(t);
    const x2 = cx + (r - largo) * Math.cos(t);
    const y2 = cy - (r - largo) * Math.sin(t);
    e.push({ op: 'line', x1: red(x1), y1: red(y1), x2: red(x2), y2: red(y2), grosor: grados % 30 === 0 ? 1 : 0.7 });
  }

  for (const grados of [0, 30, 60, 90, 120, 150, 180]) {
    const t = ((180 - grados) * Math.PI) / 180;
    e.push({
      op: 'text',
      x: red(cx + (r - 30) * Math.cos(t)),
      y: red(cy - (r - 30) * Math.sin(t) + 4),
      texto: String(grados),
      tam: 10,
      anclaje: 'medio',
    });
  }

  e.push({ op: 'circle', cx, cy, r: 2.6, grosor: 1 });
  figuras.push({ codigo: '4B-MAT-GEO-F2-008', primitivas: { ancho: 300, alto: 175, elementos: e } });
}

// --- dos angulos iguales con lados de distinto largo ------------------------
{
  const e = [];
  const abrir = (vx, vy, largo, radio) => {
    const rad = (50 * Math.PI) / 180;
    e.push({ op: 'line', x1: vx, y1: vy, x2: vx + largo, y2: vy, grosor: 1.3 });
    e.push({
      op: 'line',
      x1: vx,
      y1: vy,
      x2: red(vx + largo * Math.cos(rad)),
      y2: red(vy - largo * Math.sin(rad)),
      grosor: 1.3,
    });
    e.push({
      op: 'path',
      d: `M ${vx + radio} ${vy} A ${radio} ${radio} 0 0 0 ${red(vx + radio * Math.cos(rad))} ${red(vy - radio * Math.sin(rad))}`,
      grosor: 1,
    });
  };

  abrir(50, 130, 70, 24);
  abrir(230, 130, 130, 34);

  e.push({ op: 'text', x: 88, y: 150, texto: 'Ángulo 1', tam: 10, anclaje: 'medio' });
  e.push({ op: 'text', x: 296, y: 150, texto: 'Ángulo 2', tam: 10, anclaje: 'medio' });

  figuras.push({ codigo: '4B-MAT-GEO-F2-009', primitivas: { ancho: 380, alto: 165, elementos: e } });
}

function red(n) {
  return Math.round(n * 10) / 10;
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
  const escala = Math.min(1, 420 / ancho);
  const col = indice % 2;
  const fila = Math.floor(indice / 2);
  celdas.push(
    `<g transform="translate(${10 + col * 440},${10 + fila * 230})"><rect width="430" height="220" fill="none" stroke="#bbb"/><text x="6" y="13" font-size="10" font-family="Arial" fill="#444">${f.codigo}</text><g transform="translate(5,20) scale(${escala.toFixed(2)})">${cuerpo}</g></g>`
  );
  indice += 1;
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${10 + 2 * 440}" height="${10 + Math.ceil(indice / 2) * 230}"><rect width="100%" height="100%" fill="#fff"/>${celdas.join('')}</svg>`;
const png = new Resvg(svg, {
  fitTo: { mode: 'width', value: 900 },
  font: { loadSystemFonts: true, fontFiles: ['C:/Windows/Fonts/arial.ttf'], defaultFontFamily: 'Arial' },
}).render().asPng();
fs.writeFileSync(path.join(dir, 'geo-c.png'), png);
console.log('png:', path.join(dir, 'geo-c.png'));

await prisma.$disconnect();
