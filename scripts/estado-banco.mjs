// Estado del banco por nivel y asignatura: items por eje y por nivel de Bloom.
// Uso: node --env-file=.env scripts/estado-banco.mjs [codigoNivel]

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const niveles = await prisma.nivel.findMany({ orderBy: { codigo: 'asc' } });
const asignaturas = await prisma.asignatura.findMany({ orderBy: { nombre: 'asc' } });
const filtro = process.argv[2];

const META = 240;

for (const nivel of niveles) {
  if (filtro && nivel.codigo !== filtro) continue;
  for (const asignatura of asignaturas) {
    const total = await prisma.item.count({
      where: { nivelId: nivel.id, asignaturaId: asignatura.id, estado: 'APROBADO' },
    });
    if (total === 0) continue;

    console.log(`${nivel.codigo} ${asignatura.nombre}: ${total} aprobados, faltan ${Math.max(0, META - total)}`);

    const ejes = await prisma.eje.findMany({ where: { nivelId: nivel.id, asignaturaId: asignatura.id } });
    for (const eje of ejes) {
      const c = await prisma.item.count({ where: { ejeId: eje.id, estado: 'APROBADO' } });
      console.log(`   eje ${eje.clave} (${eje.nombre}): ${c}`);
    }

    const bloom = await prisma.item.groupBy({
      by: ['bloom'],
      where: { nivelId: nivel.id, asignaturaId: asignatura.id, estado: 'APROBADO' },
      _count: { _all: true },
    });
    console.log(`   bloom: ${bloom.map((b) => `${b.bloom} ${b._count._all}`).join(', ')}`);
  }
}

// textos de lectura
const textos = await prisma.textoLectura.count();
console.log(`\ntextos de lectura: ${textos}`);

await prisma.$disconnect();
