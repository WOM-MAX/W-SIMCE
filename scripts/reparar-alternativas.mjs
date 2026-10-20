// Repara los items cuyas alternativas son figuras y quedaron sin texto.
// Uso: node --env-file=.env scripts/reparar-alternativas.mjs [--aplicar]

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const APLICAR = process.argv.includes('--aplicar');

// Cuando la figura rotula las opciones, la alternativa toma ese nombre.
const CON_ROTULO = {
  '4B-MAT-GEO-F2-004': (l) => `Opción ${l}`,
  '4B-MAT-NUM-F2-025': (l) => `Opción ${l}`,
  '4B-MAT-GEO-F3-004': (l) => `Opción ${l}`,
  '4B-MAT-GEO-004': (l) => `Opción ${l}`,
  '4B-MAT-MED-F3-002': (l) => `Reloj ${l}`,
};

// Sin rotulo o sin figura: no se pueden responder, salen de circulacion.
const RETIRAR = [
  '4B-MAT-GEO-003',
  '4B-MAT-GEO-005',
  '4B-MAT-GEO-F2-007',
  '4B-MAT-GEO-F3-003',
  '4B-MAT-GEO-F3-005',
  '4B-MAT-GEO-F3-007',
];

let reparados = 0;
let retirados = 0;

for (const [codigo, nombrar] of Object.entries(CON_ROTULO)) {
  const item = await prisma.item.findUnique({
    where: { codigo },
    include: { versiones: { include: { alternativas: true } } },
  });
  if (!item) {
    console.log(`${codigo}: no existe`);
    continue;
  }
  const version = item.versiones[0];
  if (!version) {
    console.log(`${codigo}: sin version`);
    continue;
  }
  console.log(`${codigo}: ${version.alternativas.map((a) => `${a.letra}->${nombrar(a.letra)}`).join(', ')}`);
  if (APLICAR) {
    for (const a of version.alternativas) {
      await prisma.alternativa.update({ where: { id: a.id }, data: { texto: nombrar(a.letra) } });
    }
    reparados += 1;
  }
}

for (const codigo of RETIRAR) {
  const item = await prisma.item.findUnique({ where: { codigo } });
  if (!item) {
    console.log(`${codigo}: no existe`);
    continue;
  }
  console.log(`${codigo}: pasa a BORRADOR (${item.estado} -> BORRADOR)`);
  if (APLICAR) {
    await prisma.item.update({ where: { id: item.id }, data: { estado: 'BORRADOR' } });
    retirados += 1;
  }
}

console.log(APLICAR ? `reparados: ${reparados}, retirados: ${retirados}` : 'simulacion: usa --aplicar');

await prisma.$disconnect();
