// Convierte las primitivas de una figura en un PNG para el Word y el PDF.
// Serializa el SVG en texto (lib/figura-svg.ts) y lo rasteriza con resvg.

import { Resvg } from '@resvg/resvg-js';
import { svgCompleto } from '@/lib/figura-svg';

// 200 ppp: a 9 cm de ancho son unos 709 px, suficiente para imprimir.
const PPP = 200;

function mmAPx(mm: number): number {
  return Math.round((mm / 25.4) * PPP);
}

export function pngDeFigura(primitivas: unknown, anchoMm: number): Buffer | null {
  const svg = svgCompleto(primitivas);
  if (!svg) return null;
  try {
    const resvg = new Resvg(svg, {
      fitTo: { mode: 'width', value: mmAPx(anchoMm) },
      background: '#ffffff',
      font: { loadSystemFonts: true },
    });
    return Buffer.from(resvg.render().asPng());
  } catch (error) {
    console.error('resvg', error);
    return null;
  }
}
