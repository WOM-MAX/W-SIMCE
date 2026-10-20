// Carga items desde un JSON del banco generado.
// Uso: node --env-file=.env prisma/cargar-items.mjs prisma/banco/archivo.json
//
// Verifica antes de escribir: cuatro alternativas, una sola clave, distractores
// distintos entre si, y que el codigo no exista ya.

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
const asignatura = await prisma.asignatura.findFirst({ where: { codigo: datos.asignatura } });
if (!nivel || !asignatura) {
  console.error(`Nivel o asignatura inexistente: ${datos.nivel} / ${datos.asignatura}`);
  process.exit(1);
}

const eje = await prisma.eje.findFirst({
  where: { nivelId: nivel.id, asignaturaId: asignatura.id, clave: datos.eje },
});
if (!eje) {
  console.error(`Eje inexistente para esa combinacion: ${datos.eje}`);
  process.exit(1);
}

const problemas = [];
const creados = [];
const omitidos = [];

for (const it of datos.items) {
  const etiqueta = it.codigo ?? '(sin codigo)';

  if (!it.enunciado || !it.clave) {
    problemas.push(`${etiqueta}: falta enunciado o clave.`);
    continue;
  }
  if (!Array.isArray(it.alternativas) || it.alternativas.length !== 4) {
    problemas.push(`${etiqueta}: debe tener exactamente cuatro alternativas.`);
    continue;
  }
  if (!LETRAS.includes(it.clave)) {
    problemas.push(`${etiqueta}: la clave debe ser A, B, C o D.`);
    continue;
  }
  const normalizadas = it.alternativas.map((a) => String(a).trim().toLowerCase());
  if (new Set(normalizadas).size !== 4) {
    problemas.push(`${etiqueta}: hay alternativas repetidas.`);
    continue;
  }
  const indiceClave = LETRAS.indexOf(it.clave);
  if (normalizadas[indiceClave].length === 0) {
    problemas.push(`${etiqueta}: la clave esta vacia.`);
    continue;
  }

  const yaExiste = await prisma.item.findUnique({ where: { codigo: it.codigo } });
  if (yaExiste) {
    omitidos.push(etiqueta);
    continue;
  }

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
      habilidad: it.habilidad,
      bloom: it.bloom,
      conocimiento: it.conocimiento ?? '',
      dificultad: it.dificultad,
      estado: 'APROBADO',
      versiones: {
        create: {
          version: 1,
          enunciado: it.enunciado,
          clave: it.clave,
          justificacion: it.justificacion ?? '',
          hashContenido,
          alternativas: {
            create: it.alternativas.map((texto, i) => ({
              letra: LETRAS[i],
              texto: String(texto),
              esClave: LETRAS[i] === it.clave,
              justificacionError:
                LETRAS[i] === it.clave ? '' : 'No es la respuesta correcta. Revisa el procedimiento.',
            })),
          },
        },
      },
    },
  });

  creados.push(`${it.codigo} [${it.bloom}] -> ${item.id.slice(0, 8)}`);
}

console.log('LOTE:', datos.lote ?? ruta);
console.log('EJE:', eje.nombre);
console.log('CREADOS:', creados.length);
for (const c of creados) console.log('  ' + c);
if (omitidos.length) {
  console.log('OMITIDOS POR YA EXISTIR:', omitidos.length);
  for (const o of omitidos) console.log('  ' + o);
}
if (problemas.length) {
  console.log('RECHAZADOS:', problemas.length);
  for (const p of problemas) console.log('  ' + p);
}

await prisma.$disconnect();
