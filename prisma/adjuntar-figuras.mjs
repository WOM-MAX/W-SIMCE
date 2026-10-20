// Enlaza figuras a items ya cargados.
// Uso: node --env-file=.env prisma/adjuntar-figuras.mjs prisma/banco/archivo.json
//
// Cada entrada trae codigo de item, ancho, alto y elementos. Si el item ya tenia
// figura, se reemplaza su contenido en lugar de crear otra.

import fs from 'node:fs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ruta = process.argv[2];
if (!ruta) {
  console.error('Falta la ruta del JSON.');
  process.exit(1);
}

const entradas = JSON.parse(fs.readFileSync(ruta, 'utf8'));
let enlazadas = 0;
const fallos = [];

for (const entrada of entradas) {
  const item = await prisma.item.findUnique({ where: { codigo: entrada.codigo } });
  if (!item) {
    fallos.push(`${entrada.codigo}: el item no existe.`);
    continue;
  }
  if (!Array.isArray(entrada.elementos) || entrada.elementos.length === 0) {
    fallos.push(`${entrada.codigo}: sin elementos.`);
    continue;
  }
  if (!entrada.ancho || !entrada.alto) {
    fallos.push(`${entrada.codigo}: falta ancho o alto.`);
    continue;
  }

  const primitivas = {
    ancho: entrada.ancho,
    alto: entrada.alto,
    elementos: entrada.elementos,
  };

  const codigoFigura = `FIG-${entrada.codigo}`;
  const existente = await prisma.figura.findUnique({ where: { codigo: codigoFigura } });

  const figura = existente
    ? await prisma.figura.update({
        where: { codigo: codigoFigura },
        data: { primitivas, ancho: entrada.ancho, alto: entrada.alto },
      })
    : await prisma.figura.create({
        data: { codigo: codigoFigura, primitivas, ancho: entrada.ancho, alto: entrada.alto },
      });

  await prisma.item.update({ where: { id: item.id }, data: { figuraId: figura.id } });
  enlazadas += 1;
  console.log(`  ${entrada.codigo} -> ${codigoFigura} (${entrada.elementos.length} elementos)`);
}

console.log('ENLAZADAS:', enlazadas);
if (fallos.length) {
  console.log('FALLOS:', fallos.length);
  for (const f of fallos) console.log('  ' + f);
}

await prisma.$disconnect();
