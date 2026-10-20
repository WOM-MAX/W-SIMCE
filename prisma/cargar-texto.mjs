// Carga un texto de lectura con sus items.
// Uso: node --env-file=.env prisma/cargar-texto.mjs prisma/banco/archivo.json
//
// Verifica: texto nuevo, cinco alternativas por item, una sola clave, distractores
// distintos entre si y que el codigo del item no exista.

import fs from 'node:fs';
import crypto from 'node:crypto';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const LETRAS = ['A', 'B', 'C', 'D'];

const ruta = process.argv[2];
if (!ruta) {
  console.error('Falta la ruta del JSON.');
  process.exit(1);
}

const datos = JSON.parse(fs.readFileSync(ruta, 'utf8'));
const nivel = await prisma.nivel.findFirst({ where: { codigo: datos.nivel } });
const asignatura = await prisma.asignatura.findFirst({ where: { codigo: datos.asignatura ?? 'lectura' } });

if (!nivel || !asignatura) {
  console.error(`Nivel o asignatura inexistente: ${datos.nivel}`);
  process.exit(1);
}

const eje = await prisma.eje.findFirst({ where: { nivelId: nivel.id, asignaturaId: asignatura.id, clave: 'lectura' } });
if (!eje) {
  console.error('Ese nivel no tiene eje de lectura.');
  process.exit(1);
}

const problemas = [];
const t = datos.texto ?? {};

if (!t.codigo || !t.titulo || !t.cuerpo) {
  console.error('El texto necesita codigo, titulo y cuerpo.');
  process.exit(1);
}

const yaExiste = await prisma.textoLectura.findUnique({ where: { codigo: t.codigo } });
if (yaExiste) {
  console.error(`El texto ${t.codigo} ya existe.`);
  process.exit(1);
}

// Se validan los items antes de escribir nada.
const validos = [];
for (const it of datos.items ?? []) {
  const etiqueta = it.codigo ?? '(sin codigo)';
  if (!it.enunciado || !it.clave) {
    problemas.push(`${etiqueta}: falta enunciado o clave.`);
    continue;
  }
  if (!Array.isArray(it.alternativas) || it.alternativas.length !== 4) {
    problemas.push(`${etiqueta}: debe tener cuatro alternativas.`);
    continue;
  }
  const normalizadas = it.alternativas.map((a) => String(a).trim().toLowerCase());
  if (new Set(normalizadas).size !== 4) {
    problemas.push(`${etiqueta}: hay alternativas repetidas.`);
    continue;
  }
  if (!LETRAS.includes(it.clave)) {
    problemas.push(`${etiqueta}: la clave debe ser A, B, C o D.`);
    continue;
  }
  if (!normalizadas[LETRAS.indexOf(it.clave)]) {
    problemas.push(`${etiqueta}: la clave esta vacia.`);
    continue;
  }
  const existe = await prisma.item.findUnique({ where: { codigo: it.codigo } });
  if (existe) {
    problemas.push(`${etiqueta}: el codigo ya existe.`);
    continue;
  }
  validos.push(it);
}

if (problemas.length) {
  console.log('RECHAZADOS:', problemas.length);
  for (const p of problemas) console.log('  ' + p);
  await prisma.$disconnect();
  process.exit(1);
}

const texto = await prisma.textoLectura.create({
  data: {
    codigo: t.codigo,
    titulo: t.titulo,
    tipo: t.tipo ?? 'narrativo',
    cuerpo: t.cuerpo,
    fuente: t.fuente ?? null,
    palabras: t.palabras ?? String(t.cuerpo).split(/\s+/).length,
  },
});

const creados = [];
for (const it of validos) {
  const hashContenido = crypto
    .createHash('sha256')
    .update(JSON.stringify({ e: it.enunciado, a: it.alternativas, c: it.clave }))
    .digest('hex');

  const item = await prisma.item.create({
    data: {
      codigo: it.codigo,
      nivelId: nivel.id,
      asignaturaId: asignatura.id,
      ejeId: eje.id,
      textoId: texto.id,
      habilidad: it.habilidad ?? 'comprender',
      bloom: it.bloom,
      conocimiento: it.conocimiento ?? '',
      dificultad: it.dificultad ?? 'media',
      estado: 'APROBADO',
      versiones: {
        create: {
          version: 1,
          enunciado: it.enunciado,
          clave: it.clave,
          justificacion: it.justificacion ?? '',
          hashContenido,
          alternativas: {
            create: it.alternativas.map((textoAlt, i) => ({
              letra: LETRAS[i],
              texto: String(textoAlt),
              esClave: LETRAS[i] === it.clave,
              justificacionError:
                LETRAS[i] === it.clave ? '' : 'No es la respuesta correcta. Vuelve al texto y busca la parte que lo respalda.',
            })),
          },
        },
      },
    },
  });
  creados.push(`${it.codigo} [${it.bloom}] -> ${item.id.slice(0, 8)}`);
}

console.log('TEXTO:', texto.codigo, '|', texto.titulo);
console.log('PALABRAS:', texto.palabras);
console.log('ITEMS CREADOS:', creados.length);
for (const c of creados) console.log('  ' + c);

await prisma.$disconnect();
