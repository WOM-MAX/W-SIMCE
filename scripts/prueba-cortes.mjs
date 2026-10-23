// Prueba del endpoint de cortes por nivel: guarda, valida y restaura.

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
  JSON.stringify({
    tipo: 'usuario',
    id: usuario.id,
    colegioId: m.colegioId,
    rol: m.rol,
    nombre: usuario.nombre,
  }),
  'utf8',
).toString('base64url');
const cookie = `${cuerpo}.${crypto
  .createHmac('sha256', process.env.SESSION_SECRET)
  .update(cuerpo)
  .digest('base64url')}`;

const objetivo = await prisma.nivel.findFirst({ orderBy: { orden: 'asc' } });
if (!objetivo) {
  console.log('No hay niveles en la base.');
  process.exit(1);
}

async function post(datos) {
  const r = await fetch(`${BASE}/api/admin/cortes`, {
    method: 'POST',
    redirect: 'manual',
    headers: {
      cookie: `wsimce_sesion=${cookie}`,
      'content-type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(datos).toString(),
  });
  return r.headers.get('location') ?? r.status;
}

const resultados = [];
const revisar = (nombre, ok) => {
  resultados.push(ok);
  console.log(`${ok ? 'OK  ' : 'FALLA'} ${nombre}`);
};

console.log('nivel de prueba:', objetivo.nombre);

const guardar = await post({ nivelId: objetivo.id, corteElemental: '40', corteAdecuado: '60' });
revisar('guarda cortes validos', String(guardar).includes('ok=cortes'));

const fila = await prisma.corteNivel.findFirst({
  where: { nivelId: objetivo.id, colegioId: m.colegioId },
});
revisar('queda 40/60 en la base', fila?.corteElemental === 40 && fila?.corteAdecuado === 60);

const invalido = await post({ nivelId: objetivo.id, corteElemental: '70', corteAdecuado: '60' });
revisar('rechaza cortes invertidos', String(invalido).includes('error=cortes'));

const fuera = await post({ nivelId: objetivo.id, corteElemental: '101', corteAdecuado: '120' });
revisar('rechaza fuera de rango', String(fuera).includes('error=cortes'));

const restaurar = await post({ nivelId: objetivo.id, corteElemental: '50', corteAdecuado: '75' });
revisar('restaura 50/75', String(restaurar).includes('ok=cortes'));

console.log(`\n${resultados.length} pruebas, ${resultados.filter((r) => !r).length} fallas`);
await prisma.$disconnect();
process.exitCode = resultados.every(Boolean) ? 0 : 1;
