import { prisma } from '@/lib/prisma';
import { estudianteActual } from '@/lib/rendicion';
import { texto, volver } from '@/lib/http';

export async function POST(request: Request) {
  const sesion = await estudianteActual();
  if (!sesion) return volver(request, '/login');

  const form = await request.formData();
  const asignacionId = texto(form, 'asignacionId');
  if (!asignacionId) return volver(request, '/alumno?error=asignacion');

  try {
    const asignacion = await prisma.asignacion.findUnique({
      where: { id: asignacionId },
      include: {
        ensayo: {
          include: {
            items: {
              orderBy: { orden: 'asc' },
              include: { itemVersion: { include: { item: { include: { eje: true } } } } },
            },
          },
        },
      },
    });

    if (!asignacion) return volver(request, '/alumno?error=asignacion');
    if (!sesion.cursoId || asignacion.cursoId !== sesion.cursoId) {
      return volver(request, '/alumno?error=asignacion');
    }

    const ahora = new Date();
    if (ahora < asignacion.abreEn) return volver(request, '/alumno?error=noabre');
    if (ahora > asignacion.cierraEn) return volver(request, '/alumno?error=cerrada');
    if (asignacion.ensayo.items.length === 0) return volver(request, '/alumno?error=vacio');

    const previos = await prisma.intento.findMany({
      where: { asignacionId, estudianteId: sesion.id },
      orderBy: { numero: 'desc' },
    });

    // Si ya tiene uno abierto, se retoma en lugar de crear otro.
    const abierto = previos.find((i) => i.estado === 'EN_CURSO');
    if (abierto) return volver(request, `/rendir/${abierto.id}/1`);

    if (previos.length >= asignacion.intentosPermitidos) {
      return volver(request, '/alumno?error=intentos');
    }

    const limite = new Date(
      Math.min(
        ahora.getTime() + asignacion.ensayo.tiempoMin * 60_000,
        asignacion.cierraEn.getTime()
      )
    );

    const intento = await prisma.intento.create({
      data: {
        asignacionId,
        estudianteId: sesion.id,
        numero: previos.length + 1,
        fechaLimite: limite,
        items: {
          create: asignacion.ensayo.items.map((ei) => ({
            orden: ei.orden,
            itemVersionId: ei.itemVersionId,
            ejeClave: ei.itemVersion.item.eje.clave,
            habilidad: ei.itemVersion.item.habilidad,
            bloom: ei.itemVersion.item.bloom,
            dificultad: ei.itemVersion.item.dificultad,
          })),
        },
      },
      select: { id: true },
    });

    return volver(request, `/rendir/${intento.id}/1`);
  } catch (error) {
    console.error('iniciar intento', error);
    return volver(request, '/alumno?error=interno');
  }
}
