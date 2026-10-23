// Respaldo lógico de la base: exporta cada tabla a JSON y deja un manifiesto con
// conteos y huellas. Sirve como red de seguridad antes de una migración y como
// evidencia de estado. No reemplaza a `pg_dump` para una restauración completa:
// para eso hace falta el cliente de PostgreSQL instalado en el equipo.
//
// Uso:  node --env-file=.env scripts/respaldo.mjs
// Salida: respaldos/<AAAA-MM-DD_HH-mm>/

import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const sello = new Date().toISOString().slice(0, 16).replace('T', '_').replace(':', '-');
const destino = path.join(process.cwd(), 'respaldos', sello);

// BigInt y Date no son serializables tal cual.
function replacer(_clave, valor) {
  if (typeof valor === 'bigint') return valor.toString();
  if (valor instanceof Date) return valor.toISOString();
  return valor;
}

const tablas = await prisma.$queryRawUnsafe(
  `select table_name as tabla
     from information_schema.tables
    where table_schema = 'public' and table_type = 'BASE TABLE'
    order by table_name`,
);

await fs.mkdir(destino, { recursive: true });

const manifiesto = { generadoEn: new Date().toISOString(), destino, tablas: [] };
let totalFilas = 0;

for (const { tabla } of tablas) {
  const filas = await prisma.$queryRawUnsafe(`select * from "${tabla}"`);
  const texto = JSON.stringify(filas, replacer, 1);
  const archivo = `${tabla}.json`;
  await fs.writeFile(path.join(destino, archivo), texto, 'utf8');

  totalFilas += filas.length;
  manifiesto.tablas.push({
    tabla,
    filas: filas.length,
    bytes: Buffer.byteLength(texto, 'utf8'),
    sha256: crypto.createHash('sha256').update(texto, 'utf8').digest('hex'),
  });

  console.log(String(filas.length).padStart(6), tabla);
}

manifiesto.totalFilas = totalFilas;
manifiesto.totalTablas = manifiesto.tablas.length;

await fs.writeFile(
  path.join(destino, 'manifiesto.json'),
  JSON.stringify(manifiesto, null, 2),
  'utf8',
);

console.log(`\n${manifiesto.totalTablas} tablas, ${totalFilas} filas`);
console.log(`respaldado en ${destino}`);

await prisma.$disconnect();
