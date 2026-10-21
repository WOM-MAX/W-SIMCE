// Mide como se ve cada figura en las tres presentaciones de la aplicacion.
// Solo lectura: no escribe en la base.
//
// Uso: node --env-file=.env scripts/medir-presentacion.mjs
//
// Anchos utiles medidos en el codigo de cada pagina, descontando padding y bordes:
//   /banco     div max-w-sm (384) - p-2 - borde  -> 366 px, tope max-h-64 (256)
//   /rendir    main max-w-4xl - p-6 - p-3 - borde -> 774 px, tope max-h-72 (288)
//   /imprimir  div max-w-md (448) - p-2 - borde   -> 430 px, tope max-h-64 (256)
//
// El SVG se dibuja con preserveAspectRatio="xMidYMid meet": si el tope de alto
// muerde, la figura se encoge y queda con margen a los lados. Nunca se recorta.

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ACTUALES = [
  { nombre: '/banco', ancho: 366, tope: 256 },
  { nombre: '/rendir', ancho: 774, tope: 288 },
  { nombre: '/imprimir', ancho: 430, tope: 256 },
];

// Escenarios propuestos. 60vh a 800 px de ventana son 480 px.
const PROPUESTOS = [
  { nombre: '/banco max-w-xl', ancho: 526, tope: 424 },
  { nombre: '/banco max-w-3xl', ancho: 718, tope: 424 },
  { nombre: '/rendir 60vh', ancho: 774, tope: 480 },
  { nombre: '/imprimir ancho util', ancho: 640, tope: 900 },
];

const px = (n) => `${n.toFixed(1)} px`;
const pt = (n) => `${(n * 0.75).toFixed(1)} pt`;
const pct = (n) => `${Math.round(n * 100)}%`;

const figuras = await prisma.figura.findMany({
  select: { codigo: true, ancho: true, alto: true, primitivas: true },
});

const filas = [];

for (const f of figuras) {
  const p = f.primitivas ?? {};
  const ancho = Number(p.ancho ?? f.ancho);
  const alto = Number(p.alto ?? f.alto);
  if (!(ancho > 0) || !(alto > 0)) continue;

  const tamanos = (Array.isArray(p.elementos) ? p.elementos : [])
    .filter((e) => String(e?.op) === 'text')
    .map((e) => Number(e.tam ?? 8))
    .filter((n) => Number.isFinite(n) && n > 0);

  const fila = { codigo: f.codigo, ancho, alto, razon: ancho / alto, tam: tamanos.length ? Math.min(...tamanos) : null };

  for (const c of [...ACTUALES, ...PROPUESTOS]) {
    const escala = Math.min(c.ancho / ancho, c.tope / alto);
    const dibujo = ancho * escala;
    fila[c.nombre] = {
      escala,
      dibujo,
      margen: (c.ancho - dibujo) / 2,
      texto: fila.tam === null ? null : fila.tam * escala,
      topada: alto * (c.ancho / ancho) > c.tope,
    };
  }

  filas.push(fila);
}

function resumen(contextos, titulo) {
  console.log(`\n########## ${titulo} ##########`);
  for (const c of contextos) {
    const topadas = filas.filter((f) => f[c.nombre].topada).length;
    const conteTexto = filas.filter((f) => f[c.nombre].texto !== null);
    const textos = conteTexto.map((f) => f[c.nombre].texto).sort((a, b) => a - b);
    const bajo = textos.filter((t) => t < 8).length;
    const escalas = filas.map((f) => f[c.nombre].escala).sort((a, b) => a - b);
    console.log(`\n=== ${c.nombre} ===`);
    console.log(`  lienzo util ${c.ancho} px, tope de alto ${c.tope} px`);
    console.log(`  topadas por el alto: ${topadas}/${filas.length} (${pct(topadas / filas.length)})`);
    console.log(`  escala: mediana ${escalas[Math.floor(escalas.length / 2)].toFixed(2)}x, minima ${escalas[0].toFixed(2)}x`);
    console.log(`  texto mas chico: mediana ${px(textos[Math.floor(textos.length / 2)])}, minimo ${px(textos[0])} (${pt(textos[0])})`);
    console.log(`  figuras con texto bajo 8 px / 6 pt: ${bajo}/${conteTexto.length} (${pct(bajo / conteTexto.length)})`);
  }
}

console.log(`figuras medidas: ${filas.length}`);
resumen(ACTUALES, 'COMO ESTA HOY');
resumen(PROPUESTOS, 'CON LOS CAMBIOS PROPUESTOS');

console.log('\n########## PEORES CASOS HOY ##########');
for (const c of ACTUALES) {
  const peores = filas
    .filter((f) => f[c.nombre].texto !== null)
    .sort((a, b) => a[c.nombre].texto - b[c.nombre].texto)
    .slice(0, 6);
  console.log(`\n${c.nombre}:`);
  for (const f of peores) {
    const d = f[c.nombre];
    console.log(
      `  ${f.codigo.padEnd(34)} ${String(f.ancho).padStart(4)}x${String(Math.round(f.alto)).padEnd(4)} escala ${d.escala.toFixed(2)}x  texto ${px(d.texto)} (${pt(d.texto)})  margen lateral ${d.margen.toFixed(0)} px`
    );
  }
}

console.log('\n########## LO QUE EL CSS NO ARREGLA ##########');
const objetivo = PROPUESTOS.find((c) => c.nombre === '/imprimir ancho util');
const resto = filas
  .filter((f) => f[objetivo.nombre].texto !== null && f[objetivo.nombre].texto < 8)
  .sort((a, b) => a[objetivo.nombre].texto - b[objetivo.nombre].texto);
console.log(`figuras que siguen bajo 6 pt con /imprimir a ${objetivo.ancho} px: ${resto.length}`);
for (const f of resto) {
  const d = f[objetivo.nombre];
  console.log(
    `  ${f.codigo.padEnd(34)} tam ${f.tam}  queda en ${px(d.texto)} (${pt(d.texto)})  necesita tam >= ${(8 / d.escala).toFixed(1)}`
  );
}

await prisma.$disconnect();
