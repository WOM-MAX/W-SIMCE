// Figuras para el primer lote de cierre de 4B matematicas.
// Uso: node --env-file=.env scripts/figuras-4b-mat-1.mjs [--aplicar]

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

function lienzo(ancho, alto) {
  return { ancho, alto, elementos: [] };
}

const L = (c, x1, y1, x2, y2, grosor = 1.2) =>
  c.elementos.push({ op: 'line', x1: r(x1), y1: r(y1), x2: r(x2), y2: r(y2), grosor });
const R = (c, x, y, w, h, grosor = 1.2, relleno) =>
  c.elementos.push({ op: 'rect', x: r(x), y: r(y), w: r(w), h: r(h), grosor, ...(relleno ? { relleno } : {}) });
const C = (c, cx, cy, radio, grosor = 1.2, relleno) =>
  c.elementos.push({ op: 'circle', cx: r(cx), cy: r(cy), r: radio, grosor, ...(relleno ? { relleno } : {}) });
const T = (c, x, y, texto, tam = 9, anclaje = 'medio', negrita = false) =>
  c.elementos.push({ op: 'text', x: r(x), y: r(y), texto, tam, anclaje, ...(negrita ? { negrita: true } : {}) });
const P = (c, d, grosor = 1.2, punteada = false) =>
  c.elementos.push({ op: 'path', d, grosor, ...(punteada ? { punteada } : {}) });
const POLY = (c, puntos, grosor = 1.2, relleno) =>
  c.elementos.push({ op: 'poly', puntos, grosor, ...(relleno ? { relleno } : {}) });

function marcaRecto(c, x, y, dx, dy, lado = 11) {
  L(c, x + dx * lado, y, x + dx * lado, y + dy * lado, 0.9);
  L(c, x + dx * lado, y + dy * lado, x, y + dy * lado, 0.9);
}

const figuras = {};

// 01 cuadrado de 6 cm y rectangulo de 4 cm de ancho
{
  const c = lienzo(300, 150);
  R(c, 20, 34, 90, 90);
  T(c, 65, 140, '6 cm', 9);
  T(c, 65, 30, 'cuadrado', 8);
  R(c, 150, 49, 60, 60);
  T(c, 180, 140, '4 cm', 9);
  T(c, 180, 45, 'rectángulo', 8);
  T(c, 222, 83, '?', 12, 'izquierda', true);
  figuras['N4B-MAT-01'] = c;
}

// 02 cuadrado y rectangulo con el mismo perimetro
{
  const c = lienzo(280, 150);
  R(c, 20, 40, 70, 70);
  T(c, 55, 128, '5 cm', 9);
  T(c, 55, 36, '5 cm', 9);
  R(c, 140, 55, 112, 28);
  T(c, 196, 100, '8 cm', 9);
  T(c, 258, 72, '2 cm', 9, 'izquierda');
  T(c, 196, 128, 'mismo perímetro: 20 cm', 9);
  figuras['N4B-MAT-02'] = c;
}

// 03 triangulo rectangulo 5, 12, 13
{
  const c = lienzo(260, 160);
  POLY(c, '30,130 230,130 30,50');
  marcaRecto(c, 30, 130, 1, -1);
  T(c, 130, 146, '12 cm', 9);
  T(c, 20, 92, '5 cm', 9, 'fin');
  T(c, 140, 78, '13 cm', 9);
  figuras['N4B-MAT-03'] = c;
}

// 04 rectangulo 7 por 3
{
  const c = lienzo(240, 130);
  R(c, 30, 30, 160, 70);
  T(c, 110, 122, '7 cm', 9);
  T(c, 22, 68, '3 cm', 9, 'fin');
  figuras['N4B-MAT-04'] = c;
}

// 06 cubo con caras, aristas y vertices
{
  const c = lienzo(240, 170);
  const x0 = 60;
  const y0 = 55;
  const lado = 90;
  const dx = 42;
  const dy = -30;
  R(c, x0, y0, lado, lado);
  L(c, x0, y0, x0 + dx, y0 + dy);
  L(c, x0 + lado, y0, x0 + lado + dx, y0 + dy);
  L(c, x0 + dx, y0 + dy, x0 + lado + dx, y0 + dy);
  L(c, x0 + lado + dx, y0 + dy, x0 + lado + dx, y0 + lado + dy);
  L(c, x0 + lado, y0 + lado, x0 + lado + dx, y0 + lado + dy);
  L(c, x0, y0 + lado, x0 + dx, y0 + lado + dy, 0.8);
  L(c, x0 + dx, y0 + lado + dy, x0 + dx, y0 + dy, 0.8);
  L(c, x0 + dx, y0 + lado + dy, x0 + lado + dx, y0 + lado + dy, 0.8);
  T(c, 120, 160, 'cubo', 9);
  figuras['N4B-MAT-06'] = c;
}

// 07 triangulo con 90 grados y 45 grados
{
  const c = lienzo(260, 160);
  POLY(c, '40,130 210,130 40,40');
  marcaRecto(c, 40, 130, 1, -1);
  T(c, 56, 116, '90°', 9, 'izquierda');
  T(c, 50, 46, '45°', 9, 'izquierda');
  T(c, 188, 122, '45°', 9, 'fin');
  figuras['N4B-MAT-07'] = c;
}

// 09 cuadrados con palitos: 4, 7 y 10
{
  const c = lienzo(320, 134);
  const lado = 46;
  const y = 40;
  let x = 20;
  for (let i = 0; i < 3; i += 1) {
    R(c, x, y, lado, lado, 1.4);
    T(c, x + lado / 2, y + lado + 20, `${4 + i * 3} palitos`, 8);
    x += lado + 40;
  }
  T(c, 160, 128, 'así se sigue agregando un cuadrado por vez', 7.5);
  figuras['N4B-MAT-09'] = c;
}

// 13 balanza en equilibrio: 3 cubos contra 1 cubo y una pesa de 8 g
{
  const c = lienzo(280, 160);
  L(c, 140, 20, 140, 96, 1.4);
  L(c, 40, 40, 240, 40, 1.6);
  P(c, 'M 40 40 A 26 26 0 0 0 92 40', 1.2);
  P(c, 'M 188 40 A 26 26 0 0 0 240 40', 1.2);
  L(c, 140, 96, 110, 130, 1.2);
  L(c, 140, 96, 170, 130, 1.2);
  // tres cubos
  for (let i = 0; i < 3; i += 1) R(c, 48 + i * 16, 16, 14, 14, 1);
  // un cubo y la pesa
  R(c, 196, 16, 14, 14, 1);
  R(c, 214, 12, 20, 18, 1, 'gris');
  T(c, 224, 26, '8 g', 7);
  figuras['N4B-MAT-13'] = c;
}

// 15 reloj marcando las 3:00
{
  const c = lienzo(200, 200);
  const cx = 100;
  const cy = 100;
  const radio = 78;
  C(c, cx, cy, radio, 1.4);
  for (let h = 0; h < 12; h += 1) {
    const ang = (h * 30 * Math.PI) / 180;
    const x1 = cx + Math.sin(ang) * (radio - 8);
    const y1 = cy - Math.cos(ang) * (radio - 8);
    const x2 = cx + Math.sin(ang) * radio;
    const y2 = cy - Math.cos(ang) * radio;
    L(c, x1, y1, x2, y2, 1);
  }
  T(c, cx, cy - radio + 22, '12', 8);
  T(c, cx + radio - 18, cy + 4, '3', 8);
  T(c, cx, cy + radio - 8, '6', 8);
  T(c, cx - radio + 16, cy + 4, '9', 8);
  // manecilla de las horas al 3, minutero al 12
  L(c, cx, cy, cx + 40, cy, 2);
  L(c, cx, cy, cx, cy - 58, 1.4);
  C(c, cx, cy, 3, 1);
  figuras['N4B-MAT-15'] = c;
}

// 16 terreno de 12 por 8
{
  const c = lienzo(260, 140);
  R(c, 30, 26, 180, 88);
  T(c, 120, 130, '12 m', 9);
  T(c, 22, 74, '8 m', 9, 'fin');
  figuras['N4B-MAT-16'] = c;
}

// 19 grafico de barras: lunes 20, martes 30, miercoles 25
{
  const c = lienzo(300, 190);
  const x0 = 50;
  const y0 = 150;
  const alto = 110;
  const escala = alto / 35;
  L(c, x0, y0 - alto, x0, y0, 1.2);
  L(c, x0, y0, 270, y0, 1.2);
  for (const v of [10, 20, 30]) {
    L(c, x0 - 4, y0 - v * escala, x0 + 4, y0 - v * escala, 0.8);
    T(c, x0 - 8, y0 - v * escala + 3, String(v), 8, 'fin');
  }
  const barras = [
    { dia: 'lunes', valor: 20, x: 80 },
    { dia: 'martes', valor: 30, x: 140 },
    { dia: 'miércoles', valor: 25, x: 200 },
  ];
  for (const b of barras) {
    R(c, b.x, y0 - b.valor * escala, 40, b.valor * escala, 1.2, 'gris');
    T(c, b.x + 20, y0 + 16, b.dia, 8);
    T(c, b.x + 20, y0 - b.valor * escala - 6, String(b.valor), 8);
  }
  T(c, 150, 16, 'Unidades vendidas', 9, 'medio', true);
  figuras['N4B-MAT-19'] = c;
}

// 20 tabla de conteo: 4 grupos de 5 y 3 sueltas
{
  const c = lienzo(280, 100);
  let x = 24;
  for (let g = 0; g < 4; g += 1) {
    for (let i = 0; i < 4; i += 1) L(c, x + i * 7, 30, x + i * 7, 70, 1.6);
    L(c, x - 6, 66, x + 27, 34, 1.6);
    x += 48;
  }
  for (let i = 0; i < 3; i += 1) L(c, x + i * 7, 30, x + i * 7, 70, 1.6);
  T(c, 140, 92, 'cada marca representa un estudiante', 8);
  figuras['N4B-MAT-20'] = c;
}

// --- guardar y armar la hoja -----------------------------------------------
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
    `<g transform="translate(${12 + col * 320},${12 + fila * 210})"><rect width="306" height="196" fill="none" stroke="#bbb"/><text x="5" y="12" font-size="9" font-family="Arial" fill="#444">${codigo}</text><g transform="translate(4,16)">${cuerpo}</g></g>`
  );
  indice += 1;
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${12 + 3 * 320}" height="${12 + Math.ceil(indice / 3) * 210}"><rect width="100%" height="100%" fill="#fff"/>${celdas.join('')}</svg>`;
const png = new Resvg(svg, {
  fitTo: { mode: 'width', value: 990 },
  font: { loadSystemFonts: true, fontFiles: ['C:/Windows/Fonts/arial.ttf'], defaultFontFamily: 'Arial' },
}).render().asPng();
fs.writeFileSync(path.join(dir, 'figuras-4b-mat-1.png'), png);
console.log('figuras:', codigos.length, '| png:', path.join(dir, 'figuras-4b-mat-1.png'));
console.log(APLICAR ? 'APLICADO' : 'simulacion: usa --aplicar');

await prisma.$disconnect();
