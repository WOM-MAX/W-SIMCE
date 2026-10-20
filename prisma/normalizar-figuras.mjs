// Normaliza figuras: mide la caja real de cada elemento y corrige lo que se sale
// del lienzo. Primero reancla los textos que se salen, despues desplaza todo y
// amplia el lienzo si aun no cabe.
//
// Uso: node --env-file=.env prisma/normalizar-figuras.mjs [--aplicar]

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const APLICAR = process.argv.includes('--aplicar');
const MARGEN = 3;
const FACTOR = 0.52; // el mismo que usa partirTexto en components/figura.tsx

function anchoTexto(e) {
  const tam = typeof e.tam === 'number' ? e.tam : 8;
  const texto = String(e.texto ?? '');
  if (typeof e.ancho === 'number' && e.ancho > 0) return e.ancho;
  return texto.length * tam * FACTOR;
}

function caja(e) {
  if (e.op === 'line') {
    return { x0: Math.min(e.x1, e.x2), x1: Math.max(e.x1, e.x2), y0: Math.min(e.y1, e.y2), y1: Math.max(e.y1, e.y2) };
  }
  if (e.op === 'rect') {
    return { x0: e.x, x1: e.x + e.w, y0: e.y, y1: e.y + e.h };
  }
  if (e.op === 'circle') {
    return { x0: e.cx - e.r, x1: e.cx + e.r, y0: e.cy - e.r, y1: e.cy + e.r };
  }
  if (e.op === 'poly' && typeof e.puntos === 'string') {
    const xs = [];
    const ys = [];
    for (const par of e.puntos.trim().split(/\s+/)) {
      const [x, y] = par.split(',').map(Number);
      if (Number.isFinite(x) && Number.isFinite(y)) {
        xs.push(x);
        ys.push(y);
      }
    }
    if (!xs.length) return null;
    return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) };
  }
  if (e.op === 'text') {
    const w = anchoTexto(e);
    const x = e.x;
    const y = e.y;
    const tam = typeof e.tam === 'number' ? e.tam : 8;
    let x0 = x;
    if (e.anclaje === 'medio') x0 = x - w / 2;
    else if (e.anclaje === 'fin') x0 = x - w;
    return { x0, x1: x0 + w, y0: y - tam, y1: y + tam * 0.35 };
  }
  return null;
}

function desplazar(e, dx, dy) {
  if (e.op === 'line') {
    e.x1 += dx;
    e.x2 += dx;
    e.y1 += dy;
    e.y2 += dy;
  } else if (e.op === 'rect') {
    e.x += dx;
    e.y += dy;
  } else if (e.op === 'circle') {
    e.cx += dx;
    e.cy += dy;
  } else if (e.op === 'poly' && typeof e.puntos === 'string') {
    e.puntos = e.puntos
      .trim()
      .split(/\s+/)
      .map((par) => {
        const [x, y] = par.split(',').map(Number);
        return `${Math.round((x + dx) * 10) / 10},${Math.round((y + dy) * 10) / 10}`;
      })
      .join(' ');
  } else if (e.op === 'text') {
    e.x += dx;
    e.y += dy;
  }
}

const figuras = await prisma.figura.findMany({ select: { id: true, codigo: true, ancho: true, alto: true, primitivas: true } });

let reanclados = 0;
let desplazadas = 0;
let ampliadas = 0;
const ejemplos = [];

for (const figura of figuras) {
  const p = figura.primitivas ?? {};
  const elementos = Array.isArray(p.elementos) ? p.elementos : [];
  if (!elementos.length) continue;

  let ancho = Number(p.ancho ?? figura.ancho);
  let alto = Number(p.alto ?? figura.alto);
  let cambio = false;

  // 1. Reanclar textos que se salen, si con otro anclaje caben.
  for (const e of elementos) {
    if (e.op !== 'text') continue;
    const c = caja(e);
    if (!c) continue;
    if (c.x0 >= MARGEN && c.x1 <= ancho - MARGEN) continue;

    const original = e.anclaje;
    const candidatos = ['izquierda', 'medio', 'fin'];
    let elegido = null;
    for (const cand of candidatos) {
      const prueba = { ...e, anclaje: cand };
      const cp = caja(prueba);
      if (cp.x0 >= MARGEN && cp.x1 <= ancho - MARGEN) {
        elegido = cand;
        break;
      }
    }
    if (elegido) {
      e.anclaje = elegido;
      reanclados += 1;
      cambio = true;
      if (ejemplos.length < 6) {
        ejemplos.push(`${figura.codigo}: "${String(e.texto).slice(0, 30)}" ${original ?? '(sin)'} -> ${elegido}`);
      }
    }
  }

  // 2. Si algo sigue fuera, desplazar todo y ampliar el lienzo.
  let minX = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const e of elementos) {
    const c = caja(e);
    if (!c) continue;
    minX = Math.min(minX, c.x0);
    maxX = Math.max(maxX, c.x1);
    maxY = Math.max(maxY, c.y1);
  }

  if (Number.isFinite(minX) && minX < 0) {
    const dx = -minX + MARGEN;
    for (const e of elementos) desplazar(e, dx, 0);
    ancho += dx;
    desplazadas += 1;
    cambio = true;
    maxX += dx;
  }

  if (Number.isFinite(maxX) && maxX > ancho) {
    ancho = Math.ceil(maxX + 0.5);
    ampliadas += 1;
    cambio = true;
  }

  if (Number.isFinite(maxY) && maxY > alto) {
    alto = Math.ceil(maxY + 0.5);
    ampliadas += 1;
    cambio = true;
  }

  if (!cambio) continue;

  if (APLICAR) {
    await prisma.figura.update({
      where: { id: figura.id },
      data: {
        primitivas: { ...p, ancho, alto, elementos },
        ancho: Math.round(ancho),
        alto: Math.round(alto),
      },
    });
  }
}

console.log('figuras revisadas:', figuras.length);
console.log('textos reanclados:', reanclados);
console.log('figuras desplazadas:', desplazadas);
console.log('lienzos ampliados:', ampliadas);
for (const e of ejemplos) console.log('  ' + e);
console.log(APLICAR ? 'CAMBIOS GUARDADOS' : 'SIMULACION: nada guardado, usa --aplicar');

await prisma.$disconnect();
