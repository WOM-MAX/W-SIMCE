// Figuras para el segundo lote de 4B matematicas.
// Uso: node --env-file=.env scripts/figuras-4b-mat-2.mjs [--aplicar]

import fs from 'node:fs';
import path from 'node:path';
import { Resvg } from '@resvg/resvg-js';
import { PrismaClient } from '@prisma/client';
import { svgDePrimitivas } from './dibujo.mjs';

const prisma = new PrismaClient();
const APLICAR = process.argv.includes('--aplicar');
const dir = path.join(process.cwd(), 'tmp-figuras');
fs.mkdirSync(dir, { recursive: true });

const r = (n) => Math.round(n * 10) / 10;
const lienzo = (ancho, alto) => ({ ancho, alto, elementos: [] });
const L = (c, x1, y1, x2, y2, grosor = 1.1) =>
  c.elementos.push({ op: 'line', x1: r(x1), y1: r(y1), x2: r(x2), y2: r(y2), grosor });
const R = (c, x, y, w, h, grosor = 1.2, relleno) =>
  c.elementos.push({ op: 'rect', x: r(x), y: r(y), w: r(w), h: r(h), grosor, ...(relleno ? { relleno } : {}) });
const T = (c, x, y, texto, tam = 9, anclaje = 'medio', negrita = false) =>
  c.elementos.push({ op: 'text', x: r(x), y: r(y), texto, tam, anclaje, ...(negrita ? { negrita: true } : {}) });
const P = (c, d, grosor = 1.2, punteada = false) =>
  c.elementos.push({ op: 'path', d, grosor, ...(punteada ? { punteada } : {}) });

const figuras = {};

// 21 rectangulo 10 por 4 cortado en dos de 5 por 4
{
  const c = lienzo(300, 120);
  R(c, 30, 25, 200, 70);
  L(c, 130, 25, 130, 95, 1, true);
  T(c, 130, 112, '10 cm', 9);
  T(c, 22, 64, '4 cm', 9, 'fin');
  T(c, 80, 64, '5 cm', 8);
  T(c, 180, 64, '5 cm', 8);
  figuras['N4B-MAT-21'] = c;
}

// 24 rectangulo 8 por 5
{
  const c = lienzo(260, 120);
  R(c, 30, 20, 180, 70);
  T(c, 120, 108, '8 cm', 9);
  T(c, 22, 58, '5 cm', 9, 'fin');
  figuras['N4B-MAT-24'] = c;
}

// 26 prisma de 3 por 3 por 2
{
  const c = lienzo(240, 170);
  const x0 = 50;
  const y0 = 60;
  const lado = 80;
  const dx = 40;
  const dy = -28;
  R(c, x0, y0, lado, lado);
  for (let k = 1; k < 3; k += 1) {
    L(c, x0 + (k * lado) / 3, y0, x0 + (k * lado) / 3, y0 + lado, 0.8);
    L(c, x0, y0 + (k * lado) / 3, x0 + lado, y0 + (k * lado) / 3, 0.8);
  }
  L(c, x0, y0, x0 + dx, y0 + dy);
  L(c, x0 + lado, y0, x0 + lado + dx, y0 + dy);
  L(c, x0 + dx, y0 + dy, x0 + lado + dx, y0 + dy);
  L(c, x0 + lado + dx, y0 + dy, x0 + lado + dx, y0 + lado + dy);
  L(c, x0 + lado, y0 + lado, x0 + lado + dx, y0 + lado + dy);
  L(c, x0, y0 + lado, x0 + dx, y0 + lado + dy, 0.8);
  L(c, x0 + dx, y0 + lado + dy, x0 + dx, y0 + dy, 0.8);
  L(c, x0 + dx, y0 + lado + dy, x0 + lado + dx, y0 + lado + dy, 0.8);
  T(c, 120, 160, '3 cm de largo, 3 cm de ancho y 2 cm de alto', 7.5);
  figuras['N4B-MAT-26'] = c;
}

// 27 cuadrado de 8 y rectangulo de 12 por 5
{
  const c = lienzo(320, 150);
  R(c, 20, 30, 96, 96);
  T(c, 68, 142, '8 cm', 9);
  T(c, 12, 82, '8 cm', 9, 'fin');
  R(c, 160, 50, 144, 60);
  T(c, 232, 130, '12 cm', 9);
  T(c, 152, 84, '5 cm', 9, 'fin');
  figuras['N4B-MAT-27'] = c;
}

// 29 mesas con sillas: una mesa y una fila de tres
{
  const c = lienzo(320, 160);
  const silla = 12;
  const mesa = 34;
  // una mesa con cuatro sillas
  const mx = 30;
  const my = 50;
  R(c, mx, my, mesa, mesa, 1.4);
  R(c, mx + 10, my - silla - 4, silla, silla, 1);
  R(c, mx + 10, my + mesa + 4, silla, silla, 1);
  R(c, mx - silla - 4, my + 10, silla, silla, 1);
  R(c, mx + mesa + 4, my + 10, silla, silla, 1);
  T(c, mx + mesa / 2, my + mesa + 40, '1 mesa: 4 sillas', 8);

  // tres mesas en fila
  const fx = 170;
  const fy = 56;
  for (let i = 0; i < 3; i += 1) R(c, fx + i * mesa, fy, mesa, mesa, 1.4);
  for (let i = 0; i < 3; i += 1) {
    R(c, fx + i * mesa + 10, fy - silla - 4, silla, silla, 1);
    R(c, fx + i * mesa + 10, fy + mesa + 4, silla, silla, 1);
  }
  R(c, fx - silla - 4, fy + 10, silla, silla, 1);
  R(c, fx + 3 * mesa + 4, fy + 10, silla, silla, 1);
  T(c, fx + (3 * mesa) / 2, fy + mesa + 40, '3 mesas en fila: 8 sillas', 8);
  figuras['N4B-MAT-29'] = c;
}

// 36 parcela de 20 por 15 con la mitad sembrada
{
  const c = lienzo(280, 130);
  R(c, 30, 20, 200, 80);
  R(c, 30, 20, 100, 80, 1, 'gris');
  T(c, 80, 64, 'sembrado', 8);
  T(c, 180, 64, 'sin sembrar', 8);
  T(c, 130, 118, '20 m', 9);
  T(c, 22, 64, '15 m', 9, 'fin');
  figuras['N4B-MAT-36'] = c;
}

// 38 tabla de notas, con dos filas
{
  const c = lienzo(300, 100);
  const notas = ['3', '5', '5', '7', '5'];
  const ancho = 42;
  const x0 = 80;
  T(c, x0 - 10, 36, 'Estudiante', 8, 'fin', true);
  T(c, x0 - 10, 68, 'Nota', 8, 'fin', true);
  for (let i = 0; i < notas.length; i += 1) {
    R(c, x0 + i * ancho, 20, ancho, 24, 1);
    T(c, x0 + i * ancho + ancho / 2, 37, String(i + 1), 9);
    R(c, x0 + i * ancho, 52, ancho, 24, 1);
    T(c, x0 + i * ancho + ancho / 2, 69, notas[i], 10, 'medio', true);
  }
  figuras['N4B-MAT-38'] = c;
}

// 39 tabla de frecuencias
{
  const c = lienzo(280, 120);
  const filas = [
    ['Deporte', 'Estudiantes'],
    ['Fútbol', '8'],
    ['Básquetbol', '6'],
    ['Tenis', '6'],
  ];
  for (let i = 0; i < filas.length; i += 1) {
    const y = 14 + i * 24;
    T(c, 90, y + 14, filas[i][0], 9, 'fin', i === 0);
    T(c, 150, y + 14, filas[i][1], 9, 'medio', i === 0);
    L(c, 20, y + 20, 190, y + 20, 0.8);
  }
  L(c, 20, 14, 20, 14 + 4 * 24, 0.8);
  L(c, 120, 14, 120, 14 + 4 * 24, 0.8);
  L(c, 190, 14, 190, 14 + 4 * 24, 0.8);
  figuras['N4B-MAT-39'] = c;
}

// 40 pictograma de natacion: 5 simbolos
{
  const c = lienzo(300, 100);
  T(c, 20, 24, 'Natación', 9, 'izquierda', true);
  for (let i = 0; i < 5; i += 1) {
    c.elementos.push({ op: 'circle', cx: 36 + i * 30, cy: 52, r: 10, grosor: 1.2, relleno: 'gris' });
  }
  T(c, 36, 84, 'cada símbolo representa 4 estudiantes', 7.5, 'izquierda');
  figuras['N4B-MAT-40'] = c;
}

const codigos = Object.keys(figuras);
const celdas = [];
let indice = 0;

for (const codigo of codigos) {
  const primitivas = figuras[codigo];
  const item = await prisma.item.findUnique({ where: { codigo }, include: { figura: true } });
  if (!item) {
    console.log(`${codigo}: no existe`);
    continue;
  }
  if (APLICAR) {
    const codigoFigura = `FIG-${codigo}`;
    const existente = await prisma.figura.findUnique({ where: { codigo: codigoFigura } });
    const figura = existente
      ? await prisma.figura.update({
          where: { id: existente.id },
          data: { primitivas, ancho: primitivas.ancho, alto: primitivas.alto },
        })
      : await prisma.figura.create({
          data: { codigo: codigoFigura, primitivas, ancho: primitivas.ancho, alto: primitivas.alto },
        });
    await prisma.item.update({ where: { id: item.id }, data: { figuraId: figura.id } });
    console.log(`${codigo}: figura enlazada`);
  }
  const { cuerpo } = svgDePrimitivas(primitivas);
  const col = indice % 3;
  const fila = Math.floor(indice / 3);
  celdas.push(
    `<g transform="translate(${12 + col * 330},${12 + fila * 190})"><rect width="318" height="176" fill="none" stroke="#bbb"/><text x="5" y="12" font-size="9" font-family="Arial" fill="#444">${codigo}</text><g transform="translate(4,16)">${cuerpo}</g></g>`
  );
  indice += 1;
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${12 + 3 * 330}" height="${12 + Math.ceil(indice / 3) * 190}"><rect width="100%" height="100%" fill="#fff"/>${celdas.join('')}</svg>`;
const png = new Resvg(svg, {
  fitTo: { mode: 'width', value: 1010 },
  font: { loadSystemFonts: true, fontFiles: ['C:/Windows/Fonts/arial.ttf'], defaultFontFamily: 'Arial' },
}).render().asPng();
fs.writeFileSync(path.join(dir, 'figuras-4b-mat-2.png'), png);
console.log('figuras:', codigos.length, '| png:', path.join(dir, 'figuras-4b-mat-2.png'));
console.log(APLICAR ? 'APLICADO' : 'simulacion: usa --aplicar');

await prisma.$disconnect();
