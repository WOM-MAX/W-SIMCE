// Prueba de la Fase 5: panel de dirección accesible solo a ADMIN y DIRECCION.

import crypto from 'node:crypto';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const BASE = 'http://127.0.0.1:3005';

function firmar(datos) {
  const cuerpo = Buffer.from(JSON.stringify(datos), 'utf8').toString('base64url');
  return `${cuerpo}.${crypto.createHmac('sha256', process.env.SESSION_SECRET).update(cuerpo).digest('base64url')}`;
}

async function sesionDe(email) {
  const u = await prisma.usuario.findUnique({ where: { email }, include: { membresias: true } });
  const m = u.membresias[0];
  return {
    cookie: firmar({ tipo: 'usuario', id: u.id, colegioId: m.colegioId, rol: m.rol, nombre: u.nombre }),
    usuarioId: u.id,
    colegioId: m.colegioId,
  };
}

const resultados = [];
const revisar = (nombre, ok, detalle = '') => {
  resultados.push(ok);
  console.log(`${ok ? 'OK  ' : 'FALLA'} ${nombre}${detalle ? ` (${detalle})` : ''}`);
};

async function get(ruta, cookie) {
  const r = await fetch(BASE + ruta, { redirect: 'manual', headers: { cookie: `wsimce_sesion=${cookie}` } });
  return { status: r.status, location: r.headers.get('location') ?? '', texto: await r.text().catch(() => '') };
}

const admin = await sesionDe('admin@acropolis.cl');
const docente = await sesionDe('docente@acropolis.cl');

const email = 'prueba.direccion2@acropolis.cl';
let direccion = await prisma.usuario.findUnique({ where: { email } });
if (!direccion) {
  direccion = await prisma.usuario.create({
    data: {
      email,
      nombre: 'Prueba Direccion',
      hashPassword: 'scrypt$00$00',
      membresias: { create: { colegioId: admin.colegioId, rol: 'DIRECCION' } },
    },
  });
}
const dir = await sesionDe(email);

try {
  const panelDir = await get('/direccion', dir.cookie);
  revisar('DIRECCION entra al panel', panelDir.status === 200, String(panelDir.status));
  revisar('muestra resultados por curso', panelDir.texto.includes('Resultados por curso'));
  revisar('muestra cobertura del banco', panelDir.texto.includes('Cobertura del banco'));

  const panelAdmin = await get('/direccion', admin.cookie);
  revisar('ADMIN entra al panel', panelAdmin.status === 200, String(panelAdmin.status));

  const panelDocente = await get('/direccion', docente.cookie);
  revisar(
    'DOCENTE es redirigido',
    panelDocente.location.endsWith('/panel'),
    String(panelDocente.location),
  );

  const csv = await fetch(`${BASE}/api/direccion/csv`, {
    headers: { cookie: `wsimce_sesion=${dir.cookie}` },
  });
  const texto = await csv.text();
  revisar('DIRECCION descarga el CSV', csv.status === 200 && texto.includes('Curso'), String(csv.status));
  revisar('el CSV trae los cursos', texto.includes('4° básico A'));

  const csvDocente = await fetch(`${BASE}/api/direccion/csv`, {
    headers: { cookie: `wsimce_sesion=${docente.cookie}` },
  });
  revisar('DOCENTE no descarga el CSV', csvDocente.status === 403, String(csvDocente.status));

  const menuDir = await get('/panel', dir.cookie);
  revisar('el menu de DIRECCION muestra Dirección', menuDir.texto.includes('/direccion'));
  const menuDocente = await get('/panel', docente.cookie);
  revisar('el menu de DOCENTE no muestra Dirección', !menuDocente.texto.includes('/direccion'));
} finally {
  await prisma.evento.deleteMany({ where: { actorId: direccion.id } });
  await prisma.membresia.deleteMany({ where: { usuarioId: direccion.id } });
  await prisma.usuario.delete({ where: { id: direccion.id } });
  console.log(`\n${resultados.length} pruebas, ${resultados.filter((r) => !r).length} fallas`);
  await prisma.$disconnect();
  process.exitCode = resultados.every(Boolean) ? 0 : 1;
}
