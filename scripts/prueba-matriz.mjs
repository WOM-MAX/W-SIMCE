// Prueba de la matriz de permisos de la Fase 1 contra el servidor de desarrollo.
// Crea una cuenta de direccion temporal, forja cookies de sesion y verifica el
// alcance de cada rol. Limpia lo que crea.

import crypto from 'node:crypto';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const BASE = 'http://127.0.0.1:3005';
const SECRETO = process.env.SESSION_SECRET;

function firmar(datos) {
  const cuerpo = Buffer.from(JSON.stringify(datos), 'utf8').toString('base64url');
  const mac = crypto.createHmac('sha256', SECRETO).update(cuerpo).digest('base64url');
  return `${cuerpo}.${mac}`;
}

async function cookieDe(email) {
  const usuario = await prisma.usuario.findUnique({
    where: { email },
    include: { membresias: true },
  });
  if (!usuario?.membresias[0]) throw new Error(`sin membresia: ${email}`);
  const m = usuario.membresias[0];
  return {
    cookie: firmar({
      tipo: 'usuario',
      id: usuario.id,
      colegioId: m.colegioId,
      rol: m.rol,
      nombre: usuario.nombre,
    }),
    usuarioId: usuario.id,
    membresiaId: m.id,
    colegioId: m.colegioId,
    rol: m.rol,
  };
}

const resultados = [];
function revisar(nombre, obtenido, esperado) {
  const ok = obtenido === esperado;
  resultados.push({ nombre, ok, obtenido, esperado });
  console.log(`${ok ? 'OK  ' : 'FALLA'} ${nombre} -> ${obtenido} (esperado ${esperado})`);
}

async function pedir(ruta, cookie, opciones = {}) {
  const respuesta = await fetch(BASE + ruta, {
    ...opciones,
    redirect: 'manual',
    headers: { cookie: `wsimce_sesion=${cookie}`, ...(opciones.headers ?? {}) },
  });
  return {
    status: respuesta.status,
    location: respuesta.headers.get('location') ?? '',
    texto: await respuesta.text().catch(() => ''),
  };
}

// --- preparacion -----------------------------------------------------------
const admin = await cookieDe('admin@acropolis.cl');
const docente = await cookieDe('docente@acropolis.cl');

const emailDireccion = 'prueba.direccion@acropolis.cl';
let direccionUsuario = await prisma.usuario.findUnique({ where: { email: emailDireccion } });
if (!direccionUsuario) {
  direccionUsuario = await prisma.usuario.create({
    data: {
      email: emailDireccion,
      nombre: 'Prueba Direccion',
      hashPassword: 'scrypt$00$00',
      membresias: { create: { colegioId: admin.colegioId, rol: 'DIRECCION' } },
    },
  });
}
const direccion = await cookieDe(emailDireccion);

const ensayo = await prisma.ensayo.findFirst({
  where: { colegioId: admin.colegioId },
  select: { id: true, titulo: true },
});

// El docente queda con un solo curso, para probar el alcance restringido.
const cursosDocente = await prisma.curso.findMany({
  where: { colegioId: admin.colegioId },
  orderBy: { nombre: 'asc' },
  select: { id: true, nombre: true },
});
const originales = await prisma.membresiaCurso.findMany({
  where: { membresiaId: docente.membresiaId },
  select: { cursoId: true },
});
await prisma.membresiaCurso.deleteMany({ where: { membresiaId: docente.membresiaId } });
await prisma.membresiaCurso.create({
  data: { membresiaId: docente.membresiaId, cursoId: cursosDocente[0].id },
});

const estudianteAjeno = await prisma.estudiante.findFirst({
  where: {
    colegioId: admin.colegioId,
    matriculas: { some: { cursoId: { not: cursosDocente[0].id } } },
  },
  select: { id: true },
});

try {
  // --- lectura -----------------------------------------------------------
  const adminVe = await pedir('/ensayos', admin.cookie);
  revisar('ADMIN ve el ensayo de otro', adminVe.texto.includes(ensayo.titulo), true);

  const direccionVe = await pedir('/ensayos', direccion.cookie);
  revisar('DIRECCION ve todo el colegio', direccionVe.texto.includes(ensayo.titulo), true);

  const docenteVe = await pedir('/ensayos', docente.cookie);
  revisar('DOCENTE no ve el ensayo ajeno', docenteVe.texto.includes(ensayo.titulo), false);

  // --- escritura ---------------------------------------------------------
  const crearDireccion = await pedir('/api/ensayos/crear', direccion.cookie, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ nivelId: 'x', asignaturaId: 'x' }).toString(),
  });
  revisar(
    'DIRECCION no puede crear ensayos',
    crearDireccion.location.includes('error=permiso'),
    true,
  );

  const eliminarDireccion = await pedir(`/api/ensayos/${ensayo.id}/eliminar`, direccion.cookie, {
    method: 'POST',
  });
  revisar(
    'DIRECCION no puede eliminar ensayos',
    eliminarDireccion.location.includes('error=permiso'),
    true,
  );

  const eliminarDocente = await pedir(`/api/ensayos/${ensayo.id}/eliminar`, docente.cookie, {
    method: 'POST',
  });
  revisar(
    'DOCENTE no puede eliminar un ensayo que no ve',
    eliminarDocente.location.includes('error=ensayo'),
    true,
  );

  // --- administracion ----------------------------------------------------
  const adminDireccion = await pedir('/admin', direccion.cookie);
  revisar('DIRECCION no entra a Administracion', adminDireccion.location.endsWith('/panel'), true);

  const adminDocente = await pedir('/admin', docente.cookie);
  revisar('DOCENTE no entra a Administracion', adminDocente.location.endsWith('/panel'), true);

  const usuariosDireccion = await pedir('/api/admin/usuarios', direccion.cookie, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ nombre: 'X', email: 'x@x.cl', rol: 'DOCENTE' }).toString(),
  });
  revisar(
    'DIRECCION no crea cuentas',
    usuariosDireccion.location.includes('error=permiso'),
    true,
  );

  // --- estudiantes fuera de alcance -------------------------------------
  if (estudianteAjeno) {
    const exportar = await pedir(`/api/estudiantes/${estudianteAjeno.id}/exportar`, docente.cookie);
    revisar('DOCENTE no exporta estudiante de otro curso', exportar.status !== 200, true);
  }
} finally {
  // --- limpieza ----------------------------------------------------------
  await prisma.membresiaCurso.deleteMany({ where: { membresiaId: docente.membresiaId } });
  for (const c of originales) {
    await prisma.membresiaCurso.create({
      data: { membresiaId: docente.membresiaId, cursoId: c.cursoId },
    });
  }
  await prisma.evento.deleteMany({ where: { actorId: direccionUsuario.id } });
  await prisma.membresia.deleteMany({ where: { usuarioId: direccionUsuario.id } });
  await prisma.usuario.delete({ where: { id: direccionUsuario.id } });

  const fallas = resultados.filter((r) => !r.ok).length;
  console.log(`\n${resultados.length} pruebas, ${fallas} fallas`);
  await prisma.$disconnect();
  process.exitCode = fallas === 0 ? 0 : 1;
}
