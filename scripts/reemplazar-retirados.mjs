// Sustituye en los ensayos los items retirados por otros sanos del mismo curso,
// prefiriendo el mismo eje. Los intentos ya cerrados no se tocan: guardan su
// propia copia del item.
//
// Uso: node --env-file=.env scripts/reemplazar-retirados.mjs [--aplicar]

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const APLICAR = process.argv.includes('--aplicar');

const rotos = await prisma.ensayoItem.findMany({
  where: { itemVersion: { item: { estado: 'BORRADOR' } } },
  include: {
    ensayo: { select: { id: true, titulo: true, nivelId: true, asignaturaId: true } },
    itemVersion: { include: { item: { select: { codigo: true, ejeId: true } } } },
  },
});

console.log('items a sustituir:', rotos.length);

let cambiados = 0;

for (const fila of rotos) {
  const { ensayo } = fila;
  const ejeId = fila.itemVersion.item.ejeId;

  const yaEnEnsayo = await prisma.ensayoItem.findMany({
    where: { ensayoId: ensayo.id },
    select: { itemVersionId: true },
  });
  const usados = new Set(yaEnEnsayo.map((x) => x.itemVersionId));

  const candidatos = await prisma.itemVersion.findMany({
    where: {
      item: { nivelId: ensayo.nivelId, asignaturaId: ensayo.asignaturaId, estado: 'APROBADO' },
      id: { notIn: [...usados] },
    },
    include: { item: { select: { codigo: true, ejeId: true } } },
  });

  const mismoEje = candidatos.filter((c) => c.item.ejeId === ejeId);
  const elegido = mismoEje[0] ?? candidatos[0];

  if (!elegido) {
    console.log(`  ${fila.ensayo.titulo}: sin reemplazo disponible para ${fila.itemVersion.item.codigo}`);
    continue;
  }

  console.log(
    `  ${ensayo.titulo}: ${fila.itemVersion.item.codigo} -> ${elegido.item.codigo}${mismoEje.length ? ' (mismo eje)' : ' (otro eje)'}`
  );

  if (APLICAR) {
    await prisma.ensayoItem.update({
      where: { id: fila.id },
      data: { itemVersionId: elegido.id },
    });
    cambiados += 1;
  }
}

console.log(APLICAR ? `sustituidos: ${cambiados}` : 'simulacion: usa --aplicar');

await prisma.$disconnect();
