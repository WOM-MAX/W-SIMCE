// Prueba de la Fase 4: copiar cursos, sugerir destino, promover y ser idempotente.

import crypto from 'node:crypto';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const BASE = 'http://127.0.0.1:3005';

const usuario = await prisma.usuario.findUnique({
  where: { email: 'admin@acropolis.cl' },
  include: { membresias: true },
});
const m = usuario.membresias[0];
const cuerpo = Buffer.from(
  JSON.stringify({ tipo: 'usuario', id: usuario.id, colegioId: m.colegioId, rol: m.rol, nombre: usuario.nombre }),
  'utf8',
).toString('base64url');
const cookie = `wsimce_sesion=${cuerpo}.${crypto
  .createHmac('sha256', process.env.SESSION_SECRET)
  .update(cuerpo)
  .digest('base64url')}`;

const resultados = [];
const revisar = (nombre, ok, detalle = '') => {
  resultados.push(ok);
  console.log(`${ok ? 'OK  ' : 'FALLA'} ${nombre}${detalle ? ` (${detalle})` : ''}`);
};

async function post(ruta, datos) {
  const r = await fetch(BASE + ruta, {
    method: 'POST',
    redirect: 'manual',
    headers: { cookie, 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(datos).toString(),
  });
  return r.headers.get('location') ?? String(r.status);
}

const anio2026 = await prisma.anioEscolar.findFirst({
  where: { colegioId: m.colegioId, anio: 2026 },
  select: { id: true, estado: true },
});
await prisma.anioEscolar.update({ where: { id: anio2026.id }, data: { estado: 'activo' } });

// Limpieza previa.
await prisma.anioEscolar.deleteMany({ where: { colegioId: m.colegioId, anio: 2027 } });

try {
  const crear = await post('/api/admin/anios', { accion: 'crear', anio: '2027' });
  revisar('crea 2027', String(crear).includes('ok=anio-creado'));

  const anio2027 = await prisma.anioEscolar.findFirst({
    where: { colegioId: m.colegioId, anio: 2027 },
    select: { id: true },
  });

  const copiar = await post('/api/admin/promocion', {
    accion: 'copiar-cursos',
    origenId: anio2026.id,
    destinoId: anio2027.id,
  });
  revisar('copia los cursos', String(copiar).includes('ok=cursos'), String(copiar));

  const cursos2027 = await prisma.curso.findMany({
    where: { colegioId: m.colegioId, anioId: anio2027.id },
    select: { id: true, nombre: true },
  });
  revisar('quedan los 8 cursos', cursos2027.length === 8, String(cursos2027.length));

  // La sugerencia debe ser el siguiente nivel existente del colegio: 4° -> 6°.

  // La sugerencia debe ser el siguiente nivel existente, no "orden + 1".
  const curso4A = await prisma.curso.findFirst({
    where: { colegioId: m.colegioId, anioId: anio2026.id, nombre: '4° básico A' },
    select: { id: true },
  });
  const alumnos4A = await prisma.matricula.findMany({
    where: { cursoId: curso4A.id, estado: 'ACTIVA' },
    select: { estudianteId: true },
    take: 3,
  });

  const pagina = await fetch(
    `${BASE}/admin/promocion?origen=${anio2026.id}&destino=${anio2027.id}`,
    { headers: { cookie } },
  );
  const html = await pagina.text();
  revisar('la pagina de promocion carga', pagina.status === 200, String(pagina.status));
  revisar('muestra el boton de promover', html.includes('Promover seleccionados'));
  revisar('sugiere 6° básico A para 4° A', html.includes('6° básico A'));

  const curso6A = cursos2027.find((c) => c.nombre === '6° básico A');

  const datos = { accion: 'promover', origenId: anio2026.id, destinoId: anio2027.id };
  for (const a of alumnos4A) datos[`destino-${a.estudianteId}`] = curso6A.id;

  const promover1 = await post('/api/admin/promocion', datos);
  revisar('promueve 3 estudiantes', String(promover1).includes('ok=promovidos&n=3'), String(promover1));

  const matriculas2027 = await prisma.matricula.count({
    where: { curso: { anioId: anio2027.id } },
  });
  revisar('quedan 3 matriculas en 2027', matriculas2027 === 3, String(matriculas2027));

  const promover2 = await post('/api/admin/promocion', datos);
  revisar('segunda vez no duplica', String(promover2).includes('n=0'), String(promover2));

  const matriculasDespues = await prisma.matricula.count({
    where: { curso: { anioId: anio2027.id } },
  });
  revisar('siguen siendo 3 matriculas', matriculasDespues === 3, String(matriculasDespues));

  const intentos2027 = await prisma.intento.count({
    where: { asignacion: { curso: { anioId: anio2027.id } } },
  });
  revisar('no copia intentos al ano nuevo', intentos2027 === 0);
} finally {
  await prisma.anioEscolar.deleteMany({ where: { colegioId: m.colegioId, anio: 2027 } });
  console.log(`\n${resultados.length} pruebas, ${resultados.filter((r) => !r).length} fallas`);
  await prisma.$disconnect();
  process.exitCode = resultados.every(Boolean) ? 0 : 1;
}
