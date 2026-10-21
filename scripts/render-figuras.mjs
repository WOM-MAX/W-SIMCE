// Convierte las figuras de uno o varios items a PNG para poder mirarlas.
// Uso: node --env-file=.env scripts/render-figuras.mjs CODIGO [CODIGO...]
//
// Replica las reglas de components/figura.tsx: mismas primitivas, mismo corte de
// texto y mismos anclajes. Si el PNG se ve mal, la figura se ve mal.

import fs from 'node:fs';
import path from 'node:path';
import { Resvg } from '@resvg/resvg-js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const salida = path.join(process.cwd(), 'tmp-figuras');
fs.mkdirSync(salida, { recursive: true });

const FACTOR = 0.52;

function numero(valor, defecto = 0) {
  const n = typeof valor === 'number' ? valor : Number(valor);
  return Number.isFinite(n) ? n : defecto;
}

function ancla(valor) {
  if (valor === 'medio') return 'middle';
  if (valor === 'fin') return 'end';
  return 'start';
}

function escapar(t) {
  return String(t)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// gris viene en 0..1 (0 negro). Es el tono del trazo y del texto; sin gris, negro.
function tono(gris, defecto = 0) {
  let v = numero(gris, defecto);
  if (v > 1) v = v / 100;
  v = Math.max(0, Math.min(1, v));
  const c = Math.round(v * 255);
  return `rgb(${c},${c},${c})`;
}

function color(e) {
  const g = e.gris;
  return g === undefined || g === null ? '#000' : tono(g);
}

function partirTexto(texto, ancho, tam) {
  if (!texto) return [''];
  if (!ancho || ancho <= 0) return [texto];
  const porLinea = Math.max(8, Math.floor(ancho / (tam * FACTOR)));
  const palabras = texto.split(/\s+/);
  const lineas = [];
  let actual = '';
  for (const palabra of palabras) {
    const prueba = actual ? `${actual} ${palabra}` : palabra;
    if (prueba.length > porLinea) {
      if (actual) lineas.push(actual);
      actual = palabra;
    } else {
      actual = prueba;
    }
  }
  if (actual) lineas.push(actual);
  return lineas.length ? lineas : [''];
}

function partirConPotencia(entrada) {
  const tramos = [];
  let resto = entrada;
  while (resto.length > 0) {
    const i = resto.indexOf('^');
    if (i === -1) {
      tramos.push({ texto: resto, supra: false });
      break;
    }
    if (i > 0) tramos.push({ texto: resto.slice(0, i), supra: false });
    let j = i + 1;
    let supra = '';
    if (resto[j] === '{') {
      const fin = resto.indexOf('}', j);
      if (fin === -1) {
        supra = resto.slice(j + 1);
        j = resto.length;
      } else {
        supra = resto.slice(j + 1, fin);
        j = fin + 1;
      }
    } else {
      if (resto[j] === '-') {
        supra = '-';
        j += 1;
      }
      while (j < resto.length && /[0-9a-zA-Z]/.test(resto[j])) {
        supra += resto[j];
        j += 1;
      }
    }
    if (!supra || supra === '-') {
      tramos.push({ texto: '^', supra: false });
      resto = resto.slice(i + 1);
      continue;
    }
    tramos.push({ texto: supra, supra: true });
    resto = resto.slice(j);
  }
  return tramos;
}

function dibujar(e) {
  const grosor = numero(e.grosor, 0.9);
  const trazo = e.punteada ? ' stroke-dasharray="2.5 2"' : '';

  if (e.op === 'rect') {
    const relleno = e.relleno === 'gris' ? '#d9d9d9' : 'none';
    return `<rect x="${numero(e.x)}" y="${numero(e.y)}" width="${numero(e.w)}" height="${numero(e.h)}" fill="${relleno}" stroke="${color(e)}" stroke-width="${grosor}"${trazo}/>`;
  }
  if (e.op === 'line') {
    return `<line x1="${numero(e.x1)}" y1="${numero(e.y1)}" x2="${numero(e.x2)}" y2="${numero(e.y2)}" stroke="${color(e)}" stroke-width="${grosor}"${trazo}/>`;
  }
  if (e.op === 'circle') {
    const relleno = e.relleno === 'gris' ? '#d9d9d9' : 'none';
    return `<circle cx="${numero(e.cx)}" cy="${numero(e.cy)}" r="${numero(e.r)}" fill="${relleno}" stroke="${color(e)}" stroke-width="${grosor}"${trazo}/>`;
  }
  if (e.op === 'poly') {
    const relleno = e.relleno === 'gris' ? '#d9d9d9' : 'none';
    return `<polygon points="${escapar(e.puntos ?? '')}" fill="${relleno}" stroke="${color(e)}" stroke-width="${grosor}"${trazo}/>`;
  }
  if (e.op === 'path') {
    return `<path d="${escapar(e.d ?? '')}" fill="none" stroke="${color(e)}" stroke-width="${grosor}"${trazo}/>`;
  }
  if (e.op === 'text') {
    const tam = numero(e.tam, 8);
    const lineas = partirTexto(String(e.texto ?? ''), typeof e.ancho === 'number' ? e.ancho : undefined, tam);
    const x = numero(e.x);
    const y = numero(e.y);
    const peso = e.negrita ? 700 : 400;
    const anclaje = ancla(e.anclaje);

    // resvg no pinta texto dentro de <g>: una <text> por linea, con sus tspans.
    return lineas
      .map((linea, i) => {
        const base = y + i * tam * 1.25;
        const contenido = partirConPotencia(linea)
          .map((tramo) =>
            tramo.supra
              ? `<tspan baseline-shift="super" font-size="${(tam * 0.72).toFixed(2)}">${escapar(tramo.texto)}</tspan>`
              : `<tspan>${escapar(tramo.texto)}</tspan>`
          )
          .join('');
        return `<text x="${x}" y="${base}" font-size="${tam}" font-weight="${peso}" font-family="Helvetica, Arial, sans-serif" text-anchor="${anclaje}" fill="${color(e)}">${contenido}</text>`;
      })
      .join('');
  }
  return '';
}

// Uso:
//   node --env-file=.env scripts/render-figuras.mjs CODIGO_ITEM [CODIGO_ITEM...]
//   node --env-file=.env scripts/render-figuras.mjs --figura=CODIGO_FIGURA [...]
// El segundo modo sirve para figuras que todavia no estan enlazadas a un item.

const argumentos = process.argv.slice(2);
if (!argumentos.length) {
  console.error('Falta al menos un codigo de item, o --figura=CODIGO.');
  process.exit(1);
}

function pintar(etiqueta, primitivas, nota) {
  const p = primitivas ?? {};
  const ancho = numero(p.ancho, 400);
  const alto = numero(p.alto, 200);
  const elementos = Array.isArray(p.elementos) ? p.elementos : [];

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${ancho}" height="${alto}" viewBox="0 0 ${ancho} ${alto}"><rect width="${ancho}" height="${alto}" fill="#ffffff"/>${elementos.map(dibujar).join('')}</svg>`;

  const svgPath = path.join(salida, `${etiqueta}.svg`);
  const pngPath = path.join(salida, `${etiqueta}.png`);
  fs.writeFileSync(svgPath, svg, 'utf8');

  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: Math.round(ancho * 2) },
    font: {
      loadSystemFonts: true,
      fontFiles: ['C:/Windows/Fonts/arial.ttf', 'C:/Windows/Fonts/arialbd.ttf'],
      defaultFontFamily: 'Arial',
    },
  });
  fs.writeFileSync(pngPath, resvg.render().asPng());

  console.log(`${etiqueta}: ${elementos.length} elementos -> ${pngPath}`);
  if (nota) console.log(`  ${nota}`);
}

for (const argumento of argumentos) {
  const esFigura = argumento.startsWith('--figura=');
  const codigo = esFigura ? argumento.slice('--figura='.length) : argumento;

  if (esFigura) {
    const figura = await prisma.figura.findUnique({ where: { codigo } });
    if (!figura) {
      console.log(`${codigo}: figura inexistente`);
      continue;
    }
    pintar(codigo, figura.primitivas, 'figura suelta');
    continue;
  }

  const item = await prisma.item.findUnique({
    where: { codigo },
    include: { figura: true, versiones: { take: 1 } },
  });
  if (!item || !item.figura) {
    console.log(`${codigo}: sin figura`);
    continue;
  }
  pintar(codigo, item.figura.primitivas, `enunciado: ${String(item.versiones[0]?.enunciado ?? '').slice(0, 90)}`);
}

await prisma.$disconnect();
