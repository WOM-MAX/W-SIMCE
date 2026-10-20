import { prisma } from '@/lib/prisma';
import { cerrarSiVencido, estudianteActual } from '@/lib/rendicion';
import { corregirIntento } from '@/lib/correccion';
import { texto, volver } from '@/lib/http';
import { registrarEvento } from '@/lib/eventos';

export async function POST(request: Request) {
  const sesion = await estudianteActual();
  if (!sesion) return volver(request, '/login');

  const form = await request.formData();
  const intentoId = texto(form, 'intentoId');
  const orden = Number.parseInt(texto(form, 'orden'), 10);
  const accion = texto(form, 'accion') || 'siguiente';
  const letraCruda = texto(form, 'letra');
  const letra = letraCruda.length ? letraCruda : null;

  if (!intentoId || !Number.isFinite(orden)) return volver(request, '/alumno');

  try {
    const intento = await prisma.intento.findFirst({
      where: { id: intentoId, estudianteId: sesion.id },
      select: { id: true, estado: true, iniciadoEn: true },
    });
    if (!intento) return volver(request, '/alumno');

    // Se comprueba el vencimiento antes de aceptar cualquier respuesta.
    const cerrado = await cerrarSiVencido(intentoId);
    if (cerrado || intento.estado !== 'EN_CURSO') {
      return volver(request, `/rendir/${intentoId}/fin`);
    }

    const item = await prisma.intentoItem.findFirst({
      where: { intentoId, orden },
      select: { id: true, itemVersion: { select: { clave: true } } },
    });

    if (item) {
      const correcta = letra !== null && letra === item.itemVersion.clave;
      await prisma.respuesta.upsert({
        where: { intentoItemId: item.id },
        update: { letra, correcta, respondidoEn: new Date() },
        create: { intentoItemId: item.id, letra, correcta },
      });
    }

    if (accion === 'enviar') {
      const total = await prisma.intentoItem.count({ where: { intentoId } });
      const respondidas = await prisma.respuesta.count({
        where: { intentoItem: { intentoId }, letra: { not: null } },
      });
      const usado = Math.max(0, Math.round((Date.now() - intento.iniciadoEn.getTime()) / 1000));

      await prisma.intento.update({
        where: { id: intentoId },
        data: {
          estado: 'ENVIADO',
          enviadoEn: new Date(),
          tiempoUsadoSeg: usado,
          version: { increment: 1 },
        },
      });

      await corregirIntento(intentoId);

      await registrarEvento({
        colegioId: sesion.colegioId,
        actorId: sesion.id,
        entidad: 'intento',
        entidadId: intentoId,
        accion: 'enviado',
        payload: { respondidas, total },
      });

      return volver(request, `/rendir/${intentoId}/fin?respondidas=${respondidas}&total=${total}`);
    }

    const total = await prisma.intentoItem.count({ where: { intentoId } });
    const destino = accion === 'anterior' ? Math.max(1, orden - 1) : Math.min(total, orden + 1);
    return volver(request, `/rendir/${intentoId}/${destino}`);
  } catch (error) {
    console.error('guardar respuesta', error);
    return volver(request, `/rendir/${intentoId}/${orden}?error=interno`);
  }
}
