import { prisma } from '@/lib/prisma';
import { sesionActual } from '@/lib/auth';
import { registrarEvento } from '@/lib/eventos';
import { texto, volver } from '@/lib/http';

export async function POST(request: Request) {
  const sesion = await sesionActual();
  if (!sesion || sesion.tipo !== 'usuario') return volver(request, '/login');

  const form = await request.formData();
  const asignacionId = texto(form, 'asignacionId');
  if (!asignacionId) return volver(request, '/ensayos');

  const asignacion = await prisma.asignacion.findFirst({
    where: { id: asignacionId, curso: { colegioId: sesion.colegioId } },
    select: { id: true, intentosPermitidos: true },
  });
  if (!asignacion) return volver(request, '/ensayos?error=ensayo');

  if (asignacion.intentosPermitidos >= 5) {
    return volver(request, `/seguimiento/${asignacionId}?error=tope`);
  }

  const siguiente = asignacion.intentosPermitidos + 1;
  await prisma.asignacion.update({
    where: { id: asignacionId },
    data: { intentosPermitidos: siguiente },
  });

  await registrarEvento({
    colegioId: sesion.colegioId,
    actorId: sesion.id,
    entidad: 'asignacion',
    entidadId: asignacionId,
    accion: 'intentos_ampliados',
    payload: { anterior: asignacion.intentosPermitidos, nuevo: siguiente },
  });

  return volver(request, `/seguimiento/${asignacionId}?ok=intentos`);
}
