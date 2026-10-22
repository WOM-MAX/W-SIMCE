// Reutiliza el componente real, sin reescribir sus reglas de dibujo.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Resvg } from '@resvg/resvg-js';

const require = createRequire(import.meta.url);
const cache = new Map();
function cargar(relativo) {
  const archivo = path.resolve(relativo);
  if (cache.has(archivo)) return cache.get(archivo);
  const fuente = fs.readFileSync(archivo, 'utf8');
  const { outputText, diagnostics } = ts.transpileModule(fuente, {
    fileName: archivo, reportDiagnostics: true,
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
  });
  if (diagnostics?.some(d => d.category === ts.DiagnosticCategory.Error)) throw new Error('Error al compilar ' + relativo);
  const mod = { exports: {} };
  const localRequire = (nombre) => nombre === '@/lib/texto' ? cargar('lib/texto.ts') : require(nombre);
  vm.runInThisContext(`(function(require,module,exports){\n${outputText}\n})`, { filename: archivo })(localRequire, mod, mod.exports);
  cache.set(archivo, mod.exports);
  return mod.exports;
}
const { Figura } = cargar('components/figura.tsx');
export const { partirConPotencia } = cargar('lib/texto.ts');
export function markupReal(p, className) {
  return renderToStaticMarkup(React.createElement(Figura, { primitivas: p, className }));
}
export function hashArchivo(archivo) { return crypto.createHash('sha256').update(fs.readFileSync(archivo)).digest('hex'); }
export function svgReal(p) {
  if (!(p.ancho > 0 && p.alto > 0)) throw new Error('Lienzo inválido');
  const markup = renderToStaticMarkup(React.createElement(Figura, { primitivas: p, className: 'figura' }));
  if (!markup) throw new Error('Figura sin elementos');
  return markup.replace('<svg ', `<svg xmlns="http://www.w3.org/2000/svg" width="${Number(p.ancho)}" height="${Number(p.alto)}" style="color:#000;background:white" `);
}
export function pngDeSvg(svg, ancho) {
  return new Resvg(svg, {
    background: 'white', fitTo: { mode: 'width', value: Math.round(ancho) },
    font: { loadSystemFonts: true, fontFiles: ['C:/Windows/Fonts/arial.ttf', 'C:/Windows/Fonts/arialbd.ttf'], defaultFontFamily: 'Arial' },
  }).render().asPng();
}
export function renderizar(p, base, { reemplazar = false } = {}) {
  const svg = svgReal(p);
  fs.writeFileSync(base + '.svg', svg, { flag: reemplazar ? 'w' : 'wx' });
  fs.writeFileSync(base + '.png', pngDeSvg(svg, p.ancho * 2), { flag: reemplazar ? 'w' : 'wx' });
  return svg;
}
