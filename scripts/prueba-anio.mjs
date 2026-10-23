// Prueba de la Fase 3: crear ano, aislar datos por ano y bloquear escritura al cerrar.

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
const sesion = `${cuerpo}.${crypto.createHmac('sha256', process.env.SESSION_SECRET).update(cuerpo).digest('base64url')}`;

const resultados = [];
const revisar = (nombre, ok, detalle = '') => {
  resultados.push(ok);
  console.log(`${ok ? 'OK  ' : 'FALLA'} ${nombre}${detalle ? ` (${detalle})` : ''}`);
};

async function post(ruta, datos, cookie = `wsimce_sesion=${sesion}`) {
  const r = await fetch(BASE + ruta, {
    method: 'POST',
    redirect: 'manual',
    headers: { cookie, 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(datos).toString(),
  });
  return r.headers.get('location') ?? String(r.status);
}

async function get(ruta, cookie = `wsimce_sesion=${sesion}`) {
  const r = await fetch(BASE + ruta, { redirect: 'manual', headers: { cookie } });
  return { status: r.status, texto: await r.text().catch(() => '') };
}

const anio2026 = await prisma.anioEscolar.findFirst({
  where: { colegioId: m.colegioId, anio: 2026 },
  select: { id: true, estado: true },
});

// Limpieza por si quedo de una corrida anterior.
await prisma.anioEscolar.deleteMany({ where: { colegioId: m.colegioId, anio: 2027 } });

try {
  const crear = await post('/api/admin/anios', { accion: 'crear', anio: '2027' });
  revisar('crea el ano 2027', String(crear).includes('ok=anio-creado'));

  const anio2027 = await prisma.anioEscolar.findFirst({
    where: { colegioId: m.colegioId, anio: 2027 },
    select: { id: true, estado: true },
  });
  revisar('queda en planificacion', anio2027?.estado === 'planificacion', anio2027?.estado);

  const ensayo = await prisma.ensayo.findFirst({
    where: { colegioId: m.colegioId },
    select: { id: true, titulo: true },
  });

  const en2027 = await get('/ensayos', `wsimce_sesion=${sesion}; wsimce_anio=${anio2027.id}`);
  revisar('2027 no muestra ensayos de 2026', !en2027.texto.includes(ensayo.titulo));

  const en2026 = await get('/ensayos', `wsimce_sesion=${sesion}; wsimce_anio=${anio2026.id}`);
  revisar('2026 si muestra sus ensayos', en2026.texto.includes(ensayo.titulo));

  const cerrar = await post('/api/admin/anios', { accion: 'cerrar', anioId: anio2026.id });
  revisar('cierra 2026', String(cerrar).includes('ok=anio-cerrado'));

  const crearCerrado = await post(
    '/api/ensayos/crear',
    { nivelId: 'x', asignaturaId: 'x' },
    `wsimce_sesion=${sesion}; wsimce_anio=${anio2026.id}`,
  );
  revisar('ano cerrado rechaza crear ensayo', String(crearCerrado).includes('error=permiso'));

  const activar = await post('/api/admin/anios', { accion: 'activar', anioId: anio2026.id });
  revisar('reactiva 2026', String(activar).includes('ok=anio-activado'));

  const crearAbierto = await post(
    '/api/ensayos/crear',
    { nivelId: 'x', asignaturaId: 'x' },
    `wsimce_sesion=${sesion}; wsimce_anio=${anio2026.id}`,
  );
  revisar(
    'ano activo permite crear (falla por datos, no por permiso)',
    !String(crearAbierto).includes('error=permiso'),
    String(crearAbierto),
  );
} finally {
  await prisma.anioEscolar.deleteMany({ where: { colegioId: m.colegioId, anio: 2027 } });
  await prisma.anioEscolar.update({
    where: { id: anio2026.id },
    data: { estado: 'activo' },
  });
  console.log(`\n${resultados.length} pruebas, ${resultados.filter((r) => !r).length} fallas`);
  await prisma.$disconnect();
  process.exitCode = resultados.every(Boolean) ? 0 : 1;
}
