import { prisma } from '@/lib/prisma';
import { sesionActual } from '@/lib/auth';
import { puedeEditar, whereAsignaciones } from '@/lib/alcance';
import { registrarEvento } from '@/lib/eventos';
import { texto, volver } from '@/lib/http';

export async function POST(request: Request) {
  const sesion = await sesionActual();
  if (!sesion || sesion.tipo !== 'usuario') return volver(request, '/login');
  if (!(await puedeEditar(sesion))) return volver(request, '/seguimiento?error=permiso');

  const form = await request.formData();
  const intentoId = texto(form, 'intentoId');
  if (!intentoId) return volver(request, '/seguimiento');

  const intento = await prisma.intento.findFirst({
    where: { id: intentoId, asignacion: await whereAsignaciones(sesion) },
    include: { asignacion: { select: { id: true } } },
  });
  if (!intento) return volver(request, '/seguimiento?error=intento');

  // Un intento anulado deja de contar para el alumno y sale de los informes.
  await prisma.$transaction([
    prisma.resultadoIntento.deleteMany({ where: { intentoId } }),
    prisma.intento.update({ where: { id: intentoId }, data: { estado: 'ANULADO' } }),
  ]);

  await registrarEvento({
    colegioId: sesion.colegioId,
    actorId: sesion.id,
    entidad: 'intento',
    entidadId: intentoId,
    accion: 'anulado',
    payload: { asignacionId: intento.asignacion.id, estadoPrevio: intento.estado },
  });

  return volver(request, `/seguimiento/${intento.asignacion.id}?ok=anulado`);
}
