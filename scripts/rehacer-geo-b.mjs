// Rehace cuatro figuras de geometria con elementos flotantes.
// Uso: node --env-file=.env scripts/rehacer-geo-b.mjs [--aplicar]

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

// --- estanque esferico: esfera con su radio ---------------------------------
figuras.push({
  codigo: '2M-MAT-GEO-F2-001',
  primitivas: {
    ancho: 300,
    alto: 180,
    elementos: [
      { op: 'circle', cx: 150, cy: 80, r: 55, grosor: 1.3 },
      { op: 'path', d: 'M 95 80 A 55 15 0 0 0 205 80', grosor: 0.9 },
      { op: 'path', d: 'M 95 80 A 55 15 0 0 1 205 80', grosor: 0.9, punteada: true },
      { op: 'line', x1: 150, y1: 80, x2: 205, y2: 80, grosor: 1.1 },
      { op: 'text', x: 177, y: 73, texto: 'r', tam: 11, anclaje: 'medio', negrita: true },
      { op: 'text', x: 150, y: 166, texto: 'Estanque esférico de radio r.', tam: 9, anclaje: 'medio' },
    ],
  },
});

// --- semiesfera: arco apoyado y radio desde el centro ------------------------
figuras.push({
  codigo: '2M-MAT-GEO-F2-002',
  primitivas: {
    ancho: 300,
    alto: 180,
    elementos: [
      { op: 'line', x1: 40, y1: 120, x2: 262, y2: 120, grosor: 1.2 },
      { op: 'path', d: 'M 60 120 A 90 90 0 0 1 240 120', grosor: 1.4 },
      { op: 'circle', cx: 150, cy: 120, r: 1.8 },
      { op: 'line', x1: 150, y1: 120, x2: 240, y2: 120, grosor: 1 },
      { op: 'text', x: 195, y: 112, texto: 'r', tam: 11, anclaje: 'medio', negrita: true },
      { op: 'text', x: 150, y: 162, texto: 'Semiesfera de radio r.', tam: 9, anclaje: 'medio' },
    ],
  },
});

// --- triangulo rectangulo en C, con sus lados rotulados ---------------------
figuras.push({
  codigo: '2M-MAT-GEO-F2-007',
  primitivas: {
    ancho: 300,
    alto: 200,
    elementos: [
      { op: 'poly', puntos: '70,160 210,60 70,60', grosor: 1.3 },
      // angulo recto en C, arriba a la izquierda
      { op: 'line', x1: 70, y1: 72, x2: 82, y2: 72, grosor: 0.9 },
      { op: 'line', x1: 82, y1: 72, x2: 82, y2: 60, grosor: 0.9 },
      // arco del angulo en A
      { op: 'path', d: 'M 70 134 A 26 26 0 0 1 91.2 144.9', grosor: 0.9 },
      // arco del angulo en B
      { op: 'path', d: 'M 184 60 A 26 26 0 0 0 188.8 75.1', grosor: 0.9 },
      { op: 'text', x: 60, y: 172, texto: 'A', tam: 10, anclaje: 'fin', negrita: true },
      { op: 'text', x: 216, y: 58, texto: 'B', tam: 10, anclaje: 'izquierda', negrita: true },
      { op: 'text', x: 60, y: 58, texto: 'C', tam: 10, anclaje: 'fin', negrita: true },
      { op: 'text', x: 58, y: 114, texto: 'b', tam: 10, anclaje: 'fin' },
      { op: 'text', x: 140, y: 52, texto: 'a', tam: 10, anclaje: 'medio' },
      { op: 'text', x: 148, y: 122, texto: 'c', tam: 10, anclaje: 'medio' },
      { op: 'text', x: 150, y: 190, texto: 'Los ángulos agudos están en los vértices A y B.', tam: 8, anclaje: 'medio' },
    ],
  },
});

// --- dos triangulos con la misma hipotenusa y el mismo angulo ---------------
figuras.push({
  codigo: '2M-MAT-GEO-F2-010',
  primitivas: {
    ancho: 320,
    alto: 190,
    elementos: [
      { op: 'poly', puntos: '30,140 100,140 100,70', grosor: 1.2 },
      { op: 'line', x1: 88, y1: 140, x2: 88, y2: 128, grosor: 0.8 },
      { op: 'line', x1: 88, y1: 128, x2: 100, y2: 128, grosor: 0.8 },
      { op: 'path', d: 'M 52 140 A 22 22 0 0 1 45.6 124.4', grosor: 0.8 },
      { op: 'text', x: 26, y: 118, texto: '45°', tam: 8, anclaje: 'fin' },
      { op: 'text', x: 52, y: 104, texto: '10 cm', tam: 8, anclaje: 'fin' },

      { op: 'poly', puntos: '180,140 250,140 250,70', grosor: 1.2 },
      { op: 'line', x1: 238, y1: 140, x2: 238, y2: 128, grosor: 0.8 },
      { op: 'line', x1: 238, y1: 128, x2: 250, y2: 128, grosor: 0.8 },
      { op: 'path', d: 'M 202 140 A 22 22 0 0 1 195.6 124.4', grosor: 0.8 },
      { op: 'text', x: 176, y: 118, texto: '45°', tam: 8, anclaje: 'fin' },
      { op: 'text', x: 202, y: 104, texto: '10 cm', tam: 8, anclaje: 'fin' },

      { op: 'text', x: 160, y: 164, texto: 'Los dos triángulos tienen una hipotenusa de 10 cm.', tam: 8, anclaje: 'medio' },
      { op: 'text', x: 160, y: 178, texto: 'En los dos, el ángulo marcado mide 45°.', tam: 8, anclaje: 'medio' },
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
  const fila = Math.floor(indice / 2);
  celdas.push(
    `<g transform="translate(${12 + col * 340},${12 + fila * 230})"><rect width="326" height="214" fill="none" stroke="#bbb"/><text x="6" y="13" font-size="10" font-family="Arial" fill="#444">${f.codigo}</text><g transform="translate(6,18)">${cuerpo}</g></g>`
  );
  indice += 1;
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${12 + 2 * 340}" height="${12 + Math.ceil(indice / 2) * 230}"><rect width="100%" height="100%" fill="#fff"/>${celdas.join('')}</svg>`;
const png = new Resvg(svg, {
  fitTo: { mode: 'width', value: 760 },
  font: { loadSystemFonts: true, fontFiles: ['C:/Windows/Fonts/arial.ttf'], defaultFontFamily: 'Arial' },
}).render().asPng();
fs.writeFileSync(path.join(dir, 'geo-b.png'), png);
console.log('png:', path.join(dir, 'geo-b.png'));

await prisma.$disconnect();
