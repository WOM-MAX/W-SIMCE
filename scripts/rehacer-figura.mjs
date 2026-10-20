// Actualiza la figura de un item tomandola de un archivo del banco.
// Uso: node --env-file=.env scripts/rehacer-figura.mjs <archivoJson> <codigoItem>

import fs from 'node:fs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const [ruta, codigo] = process.argv.slice(2);

if (!ruta || !codigo) {
  console.error('Uso: node scripts/rehacer-figura.mjs <archivoJson> <codigoItem>');
  process.exit(1);
}

const datos = JSON.parse(fs.readFileSync(ruta, 'utf8'));
const item = datos.items.find((i) => i.codigo === codigo);

if (!item || !item.figura) {
  console.error(`El archivo no trae figura para ${codigo}.`);
  process.exit(1);
}

const registro = await prisma.item.findUnique({ where: { codigo }, include: { figura: true } });
if (!registro) {
  console.error(`El item ${codigo} no existe en la base.`);
  process.exit(1);
}

const primitivas = {
  ancho: item.figura.ancho,
  alto: item.figura.alto,
  elementos: item.figura.elementos,
};

if (registro.figura) {
  await prisma.figura.update({
    where: { id: registro.figura.id },
    data: { primitivas, ancho: primitivas.ancho, alto: primitivas.alto },
  });
  console.log(`${codigo}: figura actualizada (${registro.figura.codigo})`);
} else {
  const figura = await prisma.figura.create({
    data: {
      codigo: `FIG-${codigo}`,
      primitivas,
      ancho: primitivas.ancho,
      alto: primitivas.alto,
    },
  });
  await prisma.item.update({ where: { id: registro.id }, data: { figuraId: figura.id } });
  console.log(`${codigo}: figura creada y enlazada`);
}

await prisma.$disconnect();
