import { prisma } from '@/lib/prisma';
import { sesionActual } from '@/lib/auth';
import { whereEstudiantes } from '@/lib/alcance';
import { registrarEvento } from '@/lib/eventos';

// Derecho de acceso: todo lo que el sistema guarda de un estudiante, en un archivo.
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const sesion = await sesionActual();
  if (!sesion || sesion.tipo !== 'usuario') {
    return new Response('No autorizado', { status: 403 });
  }

  const { id } = await params;

  const estudiante = await prisma.estudiante.findFirst({
    where: { id, ...(await whereEstudiantes(sesion)) },
    include: {
      matriculas: { include: { curso: { select: { nombre: true } } } },
      intentos: {
        include: {
          asignacion: { include: { ensayo: { select: { titulo: true } } } },
          resultado: { include: { dimensiones: true } },
          items: {
            orderBy: { orden: 'asc' },
            include: { respuesta: { select: { letra: true, correcta: true } } },
          },
        },
        orderBy: { iniciadoEn: 'asc' },
      },
    },
  });

  if (!estudiante) return new Response('No encontrado', { status: 404 });

  const salida = {
    generadoEn: new Date().toISOString(),
    colegio: sesion.colegioId,
    estudiante: {
      codigoAcceso: estudiante.codigoAcceso,
      nombres: estudiante.nombres,
      apellidos: estudiante.apellidos,
      matriculas: estudiante.matriculas.map((m) => ({
        curso: m.curso.nombre,
        estado: m.estado,
        desde: m.desde,
      })),
    },
    intentos: estudiante.intentos.map((i) => ({
      evaluacion: i.asignacion.ensayo.titulo,
      numero: i.numero,
      estado: i.estado,
      iniciadoEn: i.iniciadoEn,
      enviadoEn: i.enviadoEn,
      tiempoUsadoSeg: i.tiempoUsadoSeg,
      resultado: i.resultado
        ? {
            correctas: i.resultado.correctas,
            total: i.resultado.total,
            pctLogro: Number(i.resultado.pctLogro),
            puntajeEscala: i.resultado.puntajeEscala,
            nivelLogro: i.resultado.nivelLogro,
            dimensiones: i.resultado.dimensiones.map((d) => ({
              dimension: d.dimension,
              clave: d.clave,
              correctas: d.correctas,
              total: d.total,
            })),
          }
        : null,
      respuestas: i.items.map((it) => ({
        orden: it.orden,
        eje: it.ejeClave,
        habilidad: it.habilidad,
        dificultad: it.dificultad,
        letra: it.respuesta?.letra ?? null,
        correcta: it.respuesta?.correcta ?? null,
      })),
    })),
  };

  await registrarEvento({
    colegioId: sesion.colegioId,
    actorId: sesion.id,
    entidad: 'estudiante',
    entidadId: estudiante.id,
    accion: 'exportado',
    payload: { intentos: estudiante.intentos.length },
  });

  const nombreArchivo = `estudiante-${estudiante.codigoAcceso}.json`;

  return new Response(JSON.stringify(salida, null, 2), {
    status: 200,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'content-disposition': `attachment; filename="${nombreArchivo}"`,
      'cache-control': 'no-store',
    },
  });
}
