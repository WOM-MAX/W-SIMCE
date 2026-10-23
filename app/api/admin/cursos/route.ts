import { prisma } from '@/lib/prisma';
import { esTecnico, sesionActual } from '@/lib/auth';
import { volver } from '@/lib/http';

// Asigna los cursos a cargo de una persona: define su alcance en la plataforma.
// Solo el administrador tecnico puede cambiarlo.
export async function POST(request: Request) {
  const sesion = await sesionActual();
  if (!sesion || sesion.tipo !== 'usuario') return volver(request, '/login');
  if (!esTecnico(sesion)) return volver(request, '/admin?error=permiso');

  const form = await request.formData();
  const membresiaId = String(form.get('membresiaId') ?? '').trim();
  if (!membresiaId) return volver(request, '/admin?error=datos');

  const membresia = await prisma.membresia.findFirst({
    where: { id: membresiaId, colegioId: sesion.colegioId },
    select: { id: true, rol: true },
  });
  if (!membresia) return volver(request, '/admin?error=datos');

  if (membresia.rol !== 'DOCENTE' && membresia.rol !== 'UTP') {
    return volver(request, '/admin?error=cursos');
  }

  // Solo cursos del colegio de la persona.
  const pedidos = form
    .getAll('cursoId')
    .map((valor) => String(valor).trim())
    .filter(Boolean);

  const validos = await prisma.curso.findMany({
    where: { id: { in: pedidos }, colegioId: sesion.colegioId },
    select: { id: true },
  });

  try {
    await prisma.$transaction([
      prisma.membresiaCurso.deleteMany({ where: { membresiaId: membresia.id } }),
      prisma.membresiaCurso.createMany({
        data: validos.map((curso) => ({ membresiaId: membresia.id, cursoId: curso.id })),
      }),
    ]);
    return volver(request, '/admin?ok=cursos');
  } catch (error) {
    console.error('asignar cursos', error);
    return volver(request, '/admin?error=interno');
  }
}
