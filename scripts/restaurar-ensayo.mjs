// Restaura un ensayo eliminado por error, tomando sus datos del respaldo lógico
// de la Fase 0. Idempotente: si el ensayo ya existe, no hace nada.

import fs from 'node:fs/promises';
import path from 'node:path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const dir = process.argv[2];
if (!dir) {
  console.log('Uso: node --env-file=.env scripts/restaurar-ensayo.mjs <carpeta-respaldo>');
  process.exit(1);
}

const ensayos = JSON.parse(await fs.readFile(path.join(dir, 'Ensayo.json'), 'utf8'));
const items = JSON.parse(await fs.readFile(path.join(dir, 'EnsayoItem.json'), 'utf8'));

const actuales = new Set((await prisma.ensayo.findMany({ select: { id: true } })).map((e) => e.id));
const faltantes = ensayos.filter((e) => !actuales.has(e.id));

if (faltantes.length === 0) {
  console.log('No falta ningún ensayo del respaldo.');
  await prisma.$disconnect();
  process.exit(0);
}

const colegio = await prisma.colegio.findFirst({ select: { id: true } });
const anio = await prisma.anioEscolar.findFirst({
  where: { colegioId: colegio.id, estado: 'activo' },
  select: { id: true },
});

for (const e of faltantes) {
  const suyos = items.filter((i) => i.ensayoId === e.id);
  console.log(`restaurando ${e.id} · ${e.titulo} · ${suyos.length} ítems`);

  await prisma.ensayo.create({
    data: {
      id: e.id,
      colegioId: e.colegioId ?? colegio.id,
      anioId: anio?.id ?? null,
      nivelId: e.nivelId,
      asignaturaId: e.asignaturaId,
      titulo: e.titulo,
      tiempoMin: e.tiempoMin,
      estado: e.estado,
      origen: e.origen,
      creadoEn: new Date(e.creadoEn),
      creadoPorId: null,
      items: {
        create: suyos.map((i) => ({
          id: i.id,
          orden: i.orden,
          itemVersionId: i.itemVersionId,
          puntaje: i.puntaje,
        })),
      },
    },
  });
}

const total = await prisma.ensayo.count();
console.log(`\nEnsayos ahora: ${total}`);
await prisma.$disconnect();
