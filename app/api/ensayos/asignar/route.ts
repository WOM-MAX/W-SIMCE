import { prisma } from '@/lib/prisma';
import { sesionActual } from '@/lib/auth';
import { desdeHoraChile } from '@/lib/fechas';
import { texto, volver } from '@/lib/http';
import { registrarEvento } from '@/lib/eventos';

export async function POST(request: Request) {
  const sesion = await sesionActual();
  if (!sesion || sesion.tipo !== 'usuario') return volver(request, '/login');

  const form = await request.formData();
  const ensayoId = texto(form, 'ensayoId');
  const cursoId = texto(form, 'cursoId');
  const abre = texto(form, 'abreEn');
  const cierra = texto(form, 'cierraEn');
  const intentosCrudos = Number.parseInt(texto(form, 'intentosPermitidos'), 10);
  const intentos = Number.isFinite(intentosCrudos) ? intentosCrudos : 1;

  const destino = ensayoId ? `/ensayos/${ensayoId}/asignar` : '/ensayos';

  if (!ensayoId || !cursoId) return volver(request, `${destino}?error=datos`);

  const abreEn = desdeHoraChile(abre);
  const cierraEn = desdeHoraChile(cierra);
  if (!abreEn || !cierraEn) return volver(request, `${destino}?error=fechas`);
  if (cierraEn <= abreEn) return volver(request, `${destino}?error=orden`);
  if (intentos < 1 || intentos > 5) return volver(request, `${destino}?error=intentos`);

  try {
    const ensayo = await prisma.ensayo.findFirst({
      where: { id: ensayoId, colegioId: sesion.colegioId },
      include: { _count: { select: { items: true } } },
    });
    if (!ensayo) return volver(request, `/ensayos?error=ensayo`);
    if (ensayo._count.items === 0) return volver(request, `${destino}?error=vacio`);

    const curso = await prisma.curso.findFirst({
      where: { id: cursoId, colegioId: sesion.colegioId },
      select: { id: true, nombre: true },
    });
    if (!curso) return volver(request, `${destino}?error=curso`);

    // Evita dos asignaciones vivas del mismo ensayo al mismo curso.
    const repetida = await prisma.asignacion.findFirst({
      where: { ensayoId, cursoId, cierraEn: { gte: new Date() } },
      select: { id: true },
    });
    if (repetida) return volver(request, `${destino}?error=duplicada`);

    await prisma.$transaction([
      prisma.asignacion.create({
        data: {
          ensayoId,
          cursoId,
          docenteId: sesion.id,
          abreEn,
          cierraEn,
          intentosPermitidos: intentos,
        },
      }),
      prisma.ensayo.update({ where: { id: ensayoId }, data: { estado: 'PUBLICADO' } }),
    ]);

    await registrarEvento({
      colegioId: sesion.colegioId,
      actorId: sesion.id,
      entidad: 'asignacion',
      entidadId: ensayoId,
      accion: 'creada',
      payload: { cursoId, abreEn: abreEn.toISOString(), cierraEn: cierraEn.toISOString(), intentos },
    });

    const params = new URLSearchParams({ ok: 'asignado', curso: curso.nombre });
    return volver(request, `/ensayos?${params.toString()}`);
  } catch (error) {
    console.error('asignar ensayo', error);
    return volver(request, `${destino}?error=interno`);
  }
}
