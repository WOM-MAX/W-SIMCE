// Serializa las primitivas de una figura a SVG, en texto. Es la versión que se
// puede rasterizar en el servidor: el componente de pantalla no puede usarse
// desde una ruta porque Next prohíbe react-dom/server ahí.
//
// Las reglas son las mismas que components/figura.tsx: si cambia una, cambia la
// otra. Operaciones del banco: rect, line, text, circle, poly y path.

import { partirConPotencia } from '@/lib/texto';

type Elemento = Record<string, unknown>;

function numero(valor: unknown, defecto = 0): number {
  const n = typeof valor === 'number' ? valor : Number(valor);
  return Number.isFinite(n) ? n : defecto;
}

function tono(gris: unknown, defecto = 0): string {
  let v = numero(gris, defecto);
  if (v > 1) v = v / 100;
  v = Math.max(0, Math.min(1, v));
  const c = Math.round(v * 255);
  return `rgb(${c},${c},${c})`;
}

function color(e: Elemento): string {
  const g = e.gris;
  if (g === undefined || g === null) return '#111111';
  return tono(g);
}

function ancla(valor: unknown): 'start' | 'middle' | 'end' {
  if (valor === 'medio') return 'middle';
  if (valor === 'fin') return 'end';
  return 'start';
}

function escapar(t: string): string {
  return t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function partesTexto(texto: string, ancho: number | undefined, tam: number): string[] {
  if (!texto) return [''];
  if (!ancho || ancho <= 0) return [texto];
  const porLinea = Math.max(8, Math.floor(ancho / (tam * 0.52)));
  if (texto.length <= porLinea) return [texto];
  const lineas: string[] = [];
  let actual = '';
  for (const palabra of texto.split(/\s+/)) {
    const candidata = actual ? `${actual} ${palabra}` : palabra;
    if (candidata.length > porLinea && actual) {
      lineas.push(actual);
      actual = palabra;
    } else {
      actual = candidata;
    }
  }
  if (actual) lineas.push(actual);
  return lineas;
}

function puntos(valor: unknown): string {
  if (!Array.isArray(valor)) return '';
  const partes: string[] = [];
  for (const p of valor) {
    if (Array.isArray(p)) partes.push(`${numero(p[0])},${numero(p[1])}`);
    else if (p && typeof p === 'object') {
      const o = p as Record<string, unknown>;
      partes.push(`${numero(o.x)},${numero(o.y)}`);
    }
  }
  return partes.join(' ');
}

function elemento(e: Elemento): string {
  const op = String(e.op ?? '');
  const grosor = numero(e.grosor, 1);
  const dash = e.punteada ? ' stroke-dasharray="3 3"' : '';
  const relleno =
    e.relleno === 'gris'
      ? `fill="${tono(0.85)}" fill-opacity="${numero(e.grisRelleno, 1)}"`
      : 'fill="transparent"';

  if (op === 'rect') {
    return `<rect x="${numero(e.x)}" y="${numero(e.y)}" width="${numero(e.w)}" height="${numero(e.h)}" ${relleno} stroke="${color(e)}" stroke-width="${grosor}"${dash}/>`;
  }
  if (op === 'line') {
    return `<line x1="${numero(e.x1)}" y1="${numero(e.y1)}" x2="${numero(e.x2)}" y2="${numero(e.y2)}" stroke="${color(e)}" stroke-width="${grosor}"${dash}/>`;
  }
  if (op === 'circle') {
    return `<circle cx="${numero(e.cx)}" cy="${numero(e.cy)}" r="${numero(e.r)}" ${relleno} stroke="${color(e)}" stroke-width="${grosor}"${dash}/>`;
  }
  if (op === 'poly') {
    return `<polygon points="${puntos(e.puntos)}" ${relleno} stroke="${color(e)}" stroke-width="${grosor}"${dash}/>`;
  }
  if (op === 'path') {
    const rellenoPath = e.relleno === 'gris' ? `fill="${tono(0.85)}"` : 'fill="none"';
    return `<path d="${escapar(String(e.d ?? ''))}" ${rellenoPath} stroke="${color(e)}" stroke-width="${grosor}"${dash}/>`;
  }
  if (op === 'text') {
    const tam = numero(e.tam, 8);
    const texto = String(e.texto ?? '');
    const ancho = typeof e.ancho === 'number' ? e.ancho : undefined;
    const lineas = partesTexto(texto, ancho, tam);
    const x = numero(e.x);
    const y = numero(e.y);
    const peso = e.negrita ? 700 : 400;
    const contenido = lineas
      .flatMap((linea, i) =>
        partirConPotencia(linea).map((tramo, k) => {
          const dy = k === 0 ? (i === 0 ? 0 : tam * 1.25) : 0;
          const x2 = k === 0 ? x : undefined;
          const fuente = tramo.supra ? tam * 0.72 : tam;
          const base = tramo.supra ? ' baseline-shift="super"' : '';
          const atX = x2 === undefined ? '' : ` x="${x2}"`;
          return `<tspan${atX} dy="${dy}" font-size="${fuente}"${base}>${escapar(tramo.texto)}</tspan>`;
        })
      )
      .join('');
    return `<text x="${x}" y="${y}" font-size="${tam}" font-family="Helvetica, Arial, sans-serif" font-weight="${peso}" text-anchor="${ancla(e.anclaje)}" fill="${color(e)}">${contenido}</text>`;
  }
  return '';
}

export function svgDePrimitivas(primitivas: unknown): {
  ancho: number;
  alto: number;
  cuerpo: string;
} {
  const p = (primitivas ?? {}) as Record<string, unknown>;
  const ancho = numero(p.ancho, 400);
  const alto = numero(p.alto, 200);
  const elementos = Array.isArray(p.elementos) ? (p.elementos as Elemento[]) : [];
  return { ancho, alto, cuerpo: elementos.map(elemento).join('') };
}

export function svgCompleto(primitivas: unknown): string | null {
  const { ancho, alto, cuerpo } = svgDePrimitivas(primitivas);
  if (!cuerpo) return null;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${ancho} ${alto}" width="${ancho}" height="${alto}" preserveAspectRatio="xMidYMid meet">${cuerpo}</svg>`;
}
