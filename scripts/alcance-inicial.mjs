// Relleno de la Fase 1. Idempotente y con modo simulacion.
//
//  1. Los ensayos sin dueno pasan al administrador tecnico mas antiguo.
//  2. Las membresias de DOCENTE/UTP sin cursos reciben todos los del colegio,
//     para que nadie pierda acceso el dia del despliegue. Despues se ajustan
//     desde Administracion.
//
// Uso:
//   node --env-file=.env scripts/alcance-inicial.mjs            (simulacion)
//   node --env-file=.env scripts/alcance-inicial.mjs --aplicar  (escribe)

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const aplicar = process.argv.includes('--aplicar');

const admin = await prisma.usuario.findFirst({
  where: { membresias: { some: { rol: 'ADMIN' } } },
  orderBy: { creadoEn: 'asc' },
  select: { id: true, email: true },
});

if (!admin) {
  console.log('No hay ningun administrador: no se puede rellenar la propiedad.');
  process.exit(1);
}

const sinDueno = await prisma.ensayo.count({ where: { creadoPorId: null } });
console.log(`Ensayos sin dueno: ${sinDueno} -> ${admin.email}`);

const membresias = await prisma.membresia.findMany({
  where: { rol: { in: ['DOCENTE', 'UTP'] } },
  select: {
    id: true,
    rol: true,
    colegioId: true,
    usuario: { select: { email: true } },
    cursos: { select: { cursoId: true } },
  },
  orderBy: { rol: 'asc' },
});

const sinCursos = membresias.filter((m) => m.cursos.length === 0);
console.log(`Membresias DOCENTE/UTP sin cursos: ${sinCursos.length} de ${membresias.length}`);

for (const m of sinCursos) {
  const cursos = await prisma.curso.findMany({
    where: { colegioId: m.colegioId },
    select: { id: true, nombre: true },
  });
  console.log(`  ${m.usuario.email} (${m.rol}) -> ${cursos.length} cursos`);
}

if (!aplicar) {
  console.log('\nSimulacion. Vuelve a ejecutar con --aplicar para escribir.');
  await prisma.$disconnect();
  process.exit(0);
}

await prisma.$transaction(async (tx) => {
  await tx.ensayo.updateMany({
    where: { creadoPorId: null },
    data: { creadoPorId: admin.id },
  });

  for (const m of sinCursos) {
    const cursos = await tx.curso.findMany({
      where: { colegioId: m.colegioId },
      select: { id: true },
    });
    await tx.membresiaCurso.createMany({
      data: cursos.map((c) => ({ membresiaId: m.id, cursoId: c.id })),
      skipDuplicates: true,
    });
  }
});

const quedanSinDueno = await prisma.ensayo.count({ where: { creadoPorId: null } });
const totalCursosAsignados = await prisma.membresiaCurso.count();

console.log(`\nAplicado. Ensayos sin dueno: ${quedanSinDueno}. Filas de alcance: ${totalCursosAsignados}.`);

await prisma.$disconnect();
