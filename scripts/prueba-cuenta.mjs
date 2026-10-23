// Prueba de la Fase 7: cada persona cambia su propia clave sin depender del admin.

import crypto from 'node:crypto';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const BASE = 'http://127.0.0.1:3005';

const hash = (texto) => {
  const sal = crypto.randomBytes(16).toString('hex');
  return `scrypt$${sal}$${crypto.scryptSync(texto, sal, 64).toString('hex')}`;
};

function cookieDe(usuario, membresia) {
  const cuerpo = Buffer.from(
    JSON.stringify({
      tipo: 'usuario',
      id: usuario.id,
      colegioId: membresia.colegioId,
      rol: membresia.rol,
      nombre: usuario.nombre,
    }),
    'utf8',
  ).toString('base64url');
  return `${cuerpo}.${crypto.createHmac('sha256', process.env.SESSION_SECRET).update(cuerpo).digest('base64url')}`;
}

const resultados = [];
const revisar = (nombre, ok, detalle = '') => {
  resultados.push(ok);
  console.log(`${ok ? 'OK  ' : 'FALLA'} ${nombre}${detalle ? ` (${detalle})` : ''}`);
};

async function post(ruta, datos, cookie) {
  const r = await fetch(BASE + ruta, {
    method: 'POST',
    redirect: 'manual',
    headers: { cookie: `wsimce_sesion=${cookie}`, 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(datos).toString(),
  });
  const set = r.headers.getSetCookie?.() ?? [];
  const verComo = set.map((c) => c.split(';')[0]).find((c) => c.startsWith('wsimce_ver_como='));
  return { location: r.headers.get('location') ?? '', verComo };
}

const admin = await prisma.usuario.findUnique({
  where: { email: 'admin@acropolis.cl' },
  include: { membresias: true },
});
const mAdmin = admin.membresias[0];

const email = 'prueba.cuenta@acropolis.cl';
await prisma.usuario.deleteMany({ where: { email } });
const usuario = await prisma.usuario.create({
  data: {
    email,
    nombre: 'Prueba Cuenta',
    hashPassword: hash('ClaveVieja2026'),
    membresias: { create: { colegioId: mAdmin.colegioId, rol: 'DOCENTE' } },
  },
  include: { membresias: true },
});

try {
  const cookie = cookieDe(usuario, usuario.membresias[0]);

  const mala = await post('/api/cuenta', { actual: 'incorrecta', nueva: 'ClaveNueva2026', repetir: 'ClaveNueva2026' }, cookie);
  revisar('rechaza la clave actual incorrecta', mala.location.includes('error=actual'), mala.location);

  const corta = await post('/api/cuenta', { actual: 'ClaveVieja2026', nueva: 'corta', repetir: 'corta' }, cookie);
  revisar('rechaza clave corta', corta.location.includes('error=corta'), corta.location);

  const ok = await post('/api/cuenta', { actual: 'ClaveVieja2026', nueva: 'ClaveNueva2026', repetir: 'ClaveNueva2026' }, cookie);
  revisar('cambia la clave', ok.location.includes('ok=guardada'), ok.location);

  const login = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    redirect: 'manual',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ identificador: email, secreto: 'ClaveNueva2026' }).toString(),
  });
  revisar('entra con la clave nueva', (login.headers.get('location') ?? '').endsWith('/panel'));

  const loginVieja = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    redirect: 'manual',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ identificador: email, secreto: 'ClaveVieja2026' }).toString(),
  });
  revisar('la clave vieja ya no sirve', (loginVieja.headers.get('location') ?? '').includes('error=credenciales'));

  // Con "ver como" activo no se puede cambiar la clave del suplantado.
  const cookieAdmin = cookieDe(admin, mAdmin);
  const entrar = await post('/api/admin/ver-como', { usuarioId: usuario.id }, cookieAdmin);
  if (entrar.verComo) {
    const conAmbas = `wsimce_sesion=${cookieAdmin}; ${entrar.verComo}`;
    const r = await fetch(`${BASE}/api/cuenta`, {
      method: 'POST',
      redirect: 'manual',
      headers: { cookie: conAmbas, 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        actual: 'ClaveNueva2026',
        nueva: 'OtraClave2026',
        repetir: 'OtraClave2026',
      }).toString(),
    });
    const loc = r.headers.get('location') ?? '';
    revisar('bloquea el cambio mientras usa ver como', loc.includes('error=modo'), loc);
    await post('/api/admin/ver-como/salir', {}, cookieAdmin);
  } else {
    revisar('bloquea el cambio mientras usa ver como', false, 'no se pudo activar ver como');
  }
} finally {
  await prisma.evento.deleteMany({ where: { actorId: usuario.id } });
  await prisma.membresia.deleteMany({ where: { usuarioId: usuario.id } });
  await prisma.usuario.delete({ where: { id: usuario.id } });
  console.log(`\n${resultados.length} pruebas, ${resultados.filter((r) => !r).length} fallas`);
  await prisma.$disconnect();
  process.exitCode = resultados.every(Boolean) ? 0 : 1;
}
