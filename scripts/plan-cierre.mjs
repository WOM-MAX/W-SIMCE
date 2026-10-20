// Detalle de lo que falta para cerrar el plan de seis evaluaciones de 40
// preguntas sin repetir. Uso: node --env-file=.env scripts/plan-cierre.mjs

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const META = 240;
const NIVELES = ['4B', '6B', '8B', '2M'];
const MIX = {
  conocimiento: 0.15,
  comprension: 0.25,
  aplicacion: 0.25,
  analisis: 0.2,
  sintesis: 0.08,
  evaluacion: 0.07,
};
const ETIQUETA = {
  conocimiento: 'conocimiento',
  comprension: 'comprensión',
  aplicacion: 'aplicación',
  analisis: 'análisis',
  sintesis: 'síntesis',
  evaluacion: 'evaluación',
};

const niveles = await prisma.nivel.findMany();
const porCodigo = new Map(niveles.map((n) => [n.codigo, n]));
const asignaturas = await prisma.asignatura.findMany({ orderBy: { nombre: 'asc' } });

let totalAprobados = 0;
let totalFaltan = 0;

console.log('CURSO | ASIGNATURA | APROBADOS | FALTAN | AVANCE');
console.log('-----------------------------------------------');

for (const codigo of NIVELES) {
  const nivel = porCodigo.get(codigo);
  if (!nivel) continue;
  for (const asignatura of asignaturas) {
    const aprobados = await prisma.item.count({
      where: { nivelId: nivel.id, asignaturaId: asignatura.id, estado: 'APROBADO' },
    });
    if (aprobados === 0 && asignatura.codigo !== 'lectura' && asignatura.codigo !== 'matematica') continue;
    const faltan = Math.max(0, META - aprobados);
    totalAprobados += aprobados;
    totalFaltan += faltan;
    const avance = Math.round((Math.min(aprobados, META) / META) * 100);
    console.log(`${codigo} | ${asignatura.nombre} | ${aprobados} | ${faltan} | ${avance}%`);
  }
}

console.log('');
console.log(`TOTAL APROBADO: ${totalAprobados} de ${META * 8}`);
console.log(`TOTAL QUE FALTA: ${totalFaltan}`);

// lectura: textos que harian falta
console.log('');
console.log('LECTURA: textos');
for (const codigo of NIVELES) {
  const nivel = porCodigo.get(codigo);
  const asignatura = asignaturas.find((a) => a.codigo === 'lectura');
  const items = await prisma.item.findMany({
    where: { nivelId: nivel.id, asignaturaId: asignatura.id, estado: 'APROBADO', textoId: { not: null } },
    select: { textoId: true },
  });
  const textos = new Set(items.map((i) => i.textoId)).size;
  const porTexto = textos ? (items.length / textos).toFixed(2) : '0';
  const faltan = Math.max(0, META - items.length);
  const textosNuevos = Math.ceil(faltan / 5);
  console.log(`${codigo}: ${items.length} ítems en ${textos} textos (${porTexto} por texto) | faltan ${faltan} ítems, o sea ${textosNuevos} textos de 5 preguntas`);
}

// bloom por curso y asignatura de matematica
console.log('');
console.log('BLOOM EN MATEMÁTICA: desvío contra la mezcla objetivo');
for (const codigo of NIVELES) {
  const nivel = porCodigo.get(codigo);
  const asignatura = asignaturas.find((a) => a.codigo === 'matematica');
  const filas = await prisma.item.groupBy({
    by: ['bloom'],
    where: { nivelId: nivel.id, asignaturaId: asignatura.id, estado: 'APROBADO' },
    _count: { _all: true },
  });
  const total = filas.reduce((s, f) => s + f._count._all, 0);
  const partes = [];
  for (const [clave, cuota] of Object.entries(MIX)) {
    const actual = filas.find((f) => f.bloom === clave)?._count._all ?? 0;
    const esperado = Math.round(total * cuota);
    const dif = actual - esperado;
    if (Math.abs(dif) >= Math.max(3, Math.round(total * 0.04))) {
      partes.push(`${ETIQUETA[clave]} ${actual}/${esperado} (${dif > 0 ? '+' : ''}${dif})`);
    }
  }
  console.log(`${codigo}: ${partes.length ? partes.join(', ') : 'sin desvíos grandes'}`);
}

// figuras
const conFigura = await prisma.item.count({ where: { figuraId: { not: null }, estado: 'APROBADO' } });
const aprobados = await prisma.item.count({ where: { estado: 'APROBADO' } });
console.log('');
console.log(`FIGURAS: ${conFigura} ítems con figura de ${aprobados} aprobados (${Math.round((conFigura / aprobados) * 100)}%)`);

await prisma.$disconnect();
