// Crea o promueve un administrador en el primer colegio.
// Uso:  node --env-file=.env prisma/crear-admin.mjs correo@colegio.cl "clave-larga"
import { PrismaClient } from '@prisma/client';
import crypto from 'node:crypto';

const prisma = new PrismaClient();

const [, , emailArg, claveArg] = process.argv;
const email = (emailArg || '').trim().toLowerCase();
const clave = claveArg || '';

if (!email || clave.length < 8) {
  console.error('Uso: node --env-file=.env prisma/crear-admin.mjs correo@colegio.cl "clave-de-8-o-mas"');
  process.exitCode = 1;
} else {
  const sal = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(clave, sal, 64).toString('hex');
  const hashPassword = `scrypt$${sal}$${hash}`;

  try {
    const colegio = await prisma.colegio.findFirst({ orderBy: { creadoEn: 'asc' } });
    if (!colegio) throw new Error('No hay ningún colegio. Corre antes pnpm db:seed.');

    const usuario = await prisma.usuario.upsert({
      where: { email },
      update: { hashPassword, activo: true },
      create: { email, nombre: 'Administrador', hashPassword },
    });

    await prisma.membresia.upsert({
      where: { usuarioId_colegioId: { usuarioId: usuario.id, colegioId: colegio.id } },
      update: { rol: 'ADMIN' },
      create: { usuarioId: usuario.id, colegioId: colegio.id, rol: 'ADMIN' },
    });

    console.log(`Administrador listo: ${email}`);
    console.log(`  colegio: ${colegio.nombre}`);
    console.log('  clave:   la que escribiste (no se muestra)');
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}
