import { prisma } from '@/lib/prisma';
import { sesionActual } from '@/lib/auth';
import { puedeEscribir, whereAsignaciones } from '@/lib/alcance';
import { registrarEvento } from '@/lib/eventos';
import { texto, volver } from '@/lib/http';

export async function POST(request: Request) {
  const sesion = await sesionActual();
  if (!sesion || sesion.tipo !== 'usuario') return volver(request, '/login');
  if (!puedeEscribir(sesion)) return volver(request, '/seguimiento?error=permiso');

  const form = await request.formData();
  const intentoId = texto(form, 'intentoId');
  const minutosCrudos = Number.parseInt(texto(form, 'minutos'), 10);
  const minutos = Number.isFinite(minutosCrudos) ? minutosCrudos : 15;

  if (!intentoId) return volver(request, '/seguimiento');
  if (minutos < 1 || minutos > 120) return volver(request, '/seguimiento?error=minutos');

  const intento = await prisma.intento.findFirst({
    where: { id: intentoId, asignacion: await whereAsignaciones(sesion) },
    include: { asignacion: { select: { id: true } } },
  });
  if (!intento) return volver(request, '/seguimiento?error=intento');
  if (intento.estado !== 'EN_CURSO') {
    return volver(request, `/seguimiento/${intento.asignacion.id}?error=noabierto`);
  }

  const base = Math.max(Date.now(), intento.fechaLimite.getTime());
  const nueva = new Date(base + minutos * 60_000);

  await prisma.intento.update({ where: { id: intentoId }, data: { fechaLimite: nueva } });

  await registrarEvento({
    colegioId: sesion.colegioId,
    actorId: sesion.id,
    entidad: 'intento',
    entidadId: intentoId,
    accion: 'prorrogado',
    payload: { minutos, limiteAnterior: intento.fechaLimite.toISOString(), limiteNuevo: nueva.toISOString() },
  });

  return volver(request, `/seguimiento/${intento.asignacion.id}?ok=prorrogado`);
}
