import { prisma } from '@/lib/prisma';
import { hashClave, sesionAdmin } from '@/lib/auth';
import { siguienteCodigoEstable } from '@/lib/estudiantes';
import { registrarEvento } from '@/lib/eventos';
import { texto, volver } from '@/lib/http';

export async function POST(request: Request) {
  const sesion = await sesionAdmin();
  if (!sesion) return volver(request, '/panel');

  const form = await request.formData();
  const nombres = texto(form, 'nombres');
  const apellidos = texto(form, 'apellidos');
  const cursoId = texto(form, 'cursoId');
  const pin = texto(form, 'pin');
  const run = texto(form, 'run').toUpperCase() || null;

  if (!nombres || !apellidos || !cursoId || pin.length < 4) {
    return volver(request, '/admin?error=datos');
  }

  try {
    const curso = await prisma.curso.findFirst({
      where: { id: cursoId, colegioId: sesion.colegioId },
      include: { nivel: true },
    });
    if (!curso) return volver(request, '/admin?error=curso');

    const codigoAcceso = await siguienteCodigoEstable(sesion.colegioId);

    const estudiante = await prisma.estudiante.create({
      data: {
        colegioId: sesion.colegioId,
        nombres,
        apellidos,
        run,
        codigoAcceso,
        pinHash: hashClave(pin),
      },
    });

    await prisma.matricula.create({ data: { estudianteId: estudiante.id, cursoId: curso.id } });

    await registrarEvento({
      colegioId: sesion.colegioId,
      actorId: sesion.id,
      entidad: 'estudiante',
      entidadId: estudiante.id,
      accion: 'creado',
      payload: { cursoId: curso.id, codigoAcceso: estudiante.codigoAcceso },
    });

    return volver(request, '/admin?ok=estudiante');
  } catch (error) {
    // El RUN es único por colegio: si choca, es un dato repetido, no un fallo interno.
    if ((error as { code?: string }).code === 'P2002') {
      return volver(request, '/admin?error=run');
    }
    console.error('crear estudiante', error);
    return volver(request, '/admin?error=interno');
  }
}
