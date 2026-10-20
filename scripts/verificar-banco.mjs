// Verificación final de integridad del banco.
// Uso: node --env-file=.env scripts/verificar-banco.mjs

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const items = await prisma.item.findMany({
  select: {
    codigo: true,
    estado: true,
    nivel: { select: { nombre: true } },
    asignatura: { select: { nombre: true } },
    versiones: {
      orderBy: { version: 'desc' },
      take: 1,
      select: {
        version: true,
        enunciado: true,
        clave: true,
        justificacion: true,
        alternativas: { select: { letra: true, texto: true, esClave: true } },
      },
    },
  },
});

const aprobados = items.filter((i) => i.estado === 'APROBADO');
console.log('ITEMS TOTALES:', items.length);
console.log('APROBADOS:', aprobados.length);

const sinVersion = aprobados.filter((i) => !i.versiones.length);
console.log('APROBADOS SIN VERSION:', sinVersion.length);

const conAlternativasVacias = [];
const conClaveMal = [];
const conRepetidas = [];
const conPocas = [];

for (const item of aprobados) {
  const v = item.versiones[0];
  if (!v) continue;
  const alts = v.alternativas;
  if (alts.length !== 4) conPocas.push(item.codigo);
  if (alts.some((a) => !a.texto || !a.texto.trim())) conAlternativasVacias.push(item.codigo);
  const claves = alts.filter((a) => a.esClave);
  if (claves.length !== 1 || claves[0]?.letra !== v.clave) conClaveMal.push(item.codigo);
  const textos = alts.map((a) => (a.texto ?? '').trim().toLowerCase());
  if (new Set(textos).size !== textos.length) conRepetidas.push(item.codigo);
}

console.log('APROBADOS QUE NO TIENEN 4 ALTERNATIVAS:', conPocas.length, conPocas.slice(0, 8));
console.log('APROBADOS CON ALTERNATIVA DE TEXTO VACIO:', conAlternativasVacias.length, conAlternativasVacias.slice(0, 8));
console.log('APROBADOS CON CLAVE INCONSISTENTE:', conClaveMal.length, conClaveMal.slice(0, 8));
console.log('APROBADOS CON ALTERNATIVAS REPETIDAS:', conRepetidas.length, conRepetidas.slice(0, 8));

const porCelda = new Map();
for (const i of aprobados) {
  const llave = `${i.nivel.nombre} | ${i.asignatura.nombre}`;
  porCelda.set(llave, (porCelda.get(llave) ?? 0) + 1);
}
console.log('');
console.log('ITEMS APROBADOS POR CURSO Y ASIGNATURA');
for (const [llave, valor] of [...porCelda.entries()].sort()) console.log(`  ${llave}: ${valor}`);

const textos = await prisma.textoLectura.count();
const figuras = await prisma.figura.count();
console.log('');
console.log('TEXTOS DE LECTURA:', textos);
console.log('FIGURAS:', figuras);

await prisma.$disconnect();
