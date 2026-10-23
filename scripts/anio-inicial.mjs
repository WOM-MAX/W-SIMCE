// Relleno de la Fase 3: los ensayos existentes pasan al anio escolar activo y
// los anios sin fechas reciben el calendario por defecto (1 de marzo - 21 de
// diciembre). Idempotente y con modo simulacion.
//
//   node --env-file=.env scripts/anio-inicial.mjs
//   node --env-file=.env scripts/anio-inicial.mjs --aplicar

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const aplicar = process.argv.includes('--aplicar');

const anios = await prisma.anioEscolar.findMany({ orderBy: { anio: 'asc' } });
if (anios.length === 0) {
  console.log('No hay anios escolares: crea uno desde Administracion.');
  process.exit(1);
}

for (const a of anios) {
  const inicio = a.fechaInicio ?? new Date(Date.UTC(a.anio, 2, 1, 4, 0, 0));
  const cierre = a.fechaCierre ?? new Date(Date.UTC(a.anio, 11, 21, 3, 59, 0));
  console.log(
    `anio ${a.anio}: estado=${a.estado} inicio=${inicio.toISOString().slice(0, 10)} cierre=${cierre.toISOString().slice(0, 10)}`,
  );
}

const sinAnio = await prisma.ensayo.count({ where: { anioId: null } });
console.log(`Ensayos sin anio: ${sinAnio}`);

// Ensayos importados que quedaron sin colegio: nunca fueron visibles en la
// plataforma, aunque el tablero los contaba. Si hay un solo colegio, se adopta.
const sinColegio = await prisma.ensayo.count({ where: { colegioId: null } });
const colegios = await prisma.colegio.findMany({ select: { id: true, nombre: true } });
console.log(`Ensayos sin colegio: ${sinColegio}`);
if (sinColegio > 0 && colegios.length === 1) {
  console.log(`  se adoptarian al colegio ${colegios[0].nombre}`);
} else if (sinColegio > 0) {
  console.log('  hay mas de un colegio: no se adoptan automaticamente');
}

if (!aplicar) {
  console.log('\nSimulacion. Vuelve a ejecutar con --aplicar para escribir.');
  await prisma.$disconnect();
  process.exit(0);
}

const adoptar = sinColegio > 0 && colegios.length === 1 ? colegios[0].id : null;

await prisma.$transaction(async (tx) => {
  if (adoptar) {
    await tx.ensayo.updateMany({
      where: { colegioId: null },
      data: { colegioId: adoptar },
    });
  }

  for (const a of anios) {
    if (a.fechaInicio && a.fechaCierre) continue;
    await tx.anioEscolar.update({
      where: { id: a.id },
      data: {
        fechaInicio: a.fechaInicio ?? new Date(Date.UTC(a.anio, 2, 1, 4, 0, 0)),
        fechaCierre: a.fechaCierre ?? new Date(Date.UTC(a.anio, 11, 21, 3, 59, 0)),
      },
    });
  }

  // Cada ensayo hereda el anio de su colegio: el activo, o el mas reciente.
  for (const a of anios) {
    if (!a.colegioId) continue;
    await tx.ensayo.updateMany({
      where: { colegioId: a.colegioId, anioId: null },
      data: { anioId: a.id },
    });
  }
});

const quedan = await prisma.ensayo.count({ where: { anioId: null } });
console.log(`\nAplicado. Ensayos sin anio: ${quedan}.`);

await prisma.$disconnect();
