// Prueba de la Fase 6: "ver como" cambia la vista, bloquea la escritura y se sale
// sin tocar la sesión real.

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
    id: u.id,
    colegioId: m.colegioId,
  };
}

const resultados = [];
const revisar = (nombre, ok, detalle = '') => {
  resultados.push(ok);
  console.log(`${ok ? 'OK  ' : 'FALLA'} ${nombre}${detalle ? ` (${detalle})` : ''}`);
};

const admin = await sesionDe('admin@acropolis.cl');
const docente = await sesionDe('docente@acropolis.cl');

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

async function get(ruta, cookieHeader) {
  const r = await fetch(BASE + ruta, { redirect: 'manual', headers: { cookie: cookieHeader } });
  return { status: r.status, location: r.headers.get('location') ?? '', texto: await r.text().catch(() => '') };
}

const ensayo = await prisma.ensayo.findFirst({ where: { colegioId: admin.colegioId }, select: { id: true, titulo: true } });

try {
  const entrar = await post('/api/admin/ver-como', { usuarioId: docente.id }, admin.cookie);
  revisar('el admin entra en ver como', entrar.location.endsWith('/panel'), entrar.location);
  revisar('se emite la cookie de suplantación', Boolean(entrar.verComo));

  const ambas = `wsimce_sesion=${admin.cookie}; ${entrar.verComo}`;

  const panel = await get('/panel', ambas);
  revisar('aparece el aviso de ver como', panel.texto.includes('Estás viendo como'));

  const ensayos = await get('/ensayos', ambas);
  revisar('ve lo mismo que el docente', !ensayos.texto.includes(ensayo.titulo));

  // Nunca con la cookie real: eso eliminaría el ensayo de verdad.
  const eliminarSuplente = await fetch(`${BASE}/api/ensayos/${ensayo.id}/eliminar`, {
    method: 'POST',
    redirect: 'manual',
    headers: { cookie: ambas },
  });
  const destino = eliminarSuplente.headers.get('location') ?? '';
  revisar('no puede escribir mientras mira', destino.includes('error=permiso'), destino);

  const crear = await fetch(`${BASE}/api/ensayos/crear`, {
    method: 'POST',
    redirect: 'manual',
    headers: { cookie: ambas, 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ nivelId: 'x', asignaturaId: 'x' }).toString(),
  });
  const destinoCrear = crear.headers.get('location') ?? '';
  revisar('no puede crear ensayos mientras mira', destinoCrear.includes('error=permiso'), destinoCrear);

  const salir = await post('/api/admin/ver-como/salir', {}, admin.cookie);
  revisar('sale y vuelve a administración', salir.location.includes('ok=ver-como-fin'), salir.location);

  const despues = await get('/ensayos', `wsimce_sesion=${admin.cookie}`);
  revisar('el admin vuelve a ver todo', despues.texto.includes(ensayo.titulo));

  const evento = await prisma.evento.findFirst({
    where: { accion: 'ver_como', actorId: admin.id },
    orderBy: { ocurridoEn: 'desc' },
    select: { id: true },
  });
  revisar('queda registrado en auditoría', Boolean(evento));

  const noAdmin = await post('/api/admin/ver-como', { usuarioId: admin.id }, docente.cookie);
  revisar('un docente no puede iniciar ver como', noAdmin.location.endsWith('/panel'), noAdmin.location);
} finally {
  await prisma.evento.deleteMany({ where: { accion: 'ver_como', actorId: admin.id } });
  console.log(`\n${resultados.length} pruebas, ${resultados.filter((r) => !r).length} fallas`);
  await prisma.$disconnect();
  process.exitCode = resultados.every(Boolean) ? 0 : 1;
}
