// Comprueba que un ensayo no repite preguntas de los anteriores y lo borra.
// Uso: node --env-file=.env scripts/verificar-generador.mjs <idEnsayo> <nivelId> <asignaturaId>

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const [id, nivelId, asignaturaId] = process.argv.slice(2);

if (!id) {
  console.error('Falta el id del ensayo.');
  process.exit(1);
}

const nuevo = await prisma.ensayo.findUnique({
  where: { id },
  include: { items: { select: { itemVersionId: true } } },
});

if (!nuevo) {
  console.log('ese ensayo ya no existe');
  process.exit(0);
}

const previos = await prisma.ensayo.findMany({
  where: { nivelId: nivelId ?? nuevo.nivelId, asignaturaId: asignaturaId ?? nuevo.asignaturaId, id: { not: id } },
  orderBy: { creadoEn: 'desc' },
  take: 3,
  select: { items: { select: { itemVersionId: true } } },
});

const usadas = new Set();
for (const p of previos) for (const i of p.items) usadas.add(i.itemVersionId);

const repetidas = nuevo.items.filter((i) => usadas.has(i.itemVersionId)).length;
console.log('titulo:', nuevo.titulo.slice(0, 80));
console.log('preguntas:', nuevo.items.length, '| repetidas de las 3 anteriores:', repetidas);

await prisma.ensayo.delete({ where: { id } });
console.log('ensayo de prueba eliminado');

await prisma.$disconnect();
