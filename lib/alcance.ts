// Alcance de datos por rol. Un solo lugar decide que ve cada persona, para que
// ninguna pantalla ni endpoint tenga su propia version de la regla.
//
//   ADMIN, DIRECCION  -> todo el colegio
//   UTP, DOCENTE      -> los cursos que tiene asignados
//
// Regla de lectura: "lo que cree" + "lo que me asignaron". Un docente ve el ensayo
// que armo la coordinacion para su curso, aunque no sea el creador.

import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { soloLectura, veTodoElColegio, type SesionUsuario } from '@/lib/auth';

// Cursos que atiende la persona. Lista vacia = ninguno, que no es lo mismo que todos.
export async function cursosDe(sesion: SesionUsuario): Promise<string[]> {
  const filas = await prisma.membresiaCurso.findMany({
    where: { membresia: { usuarioId: sesion.id, colegioId: sesion.colegioId } },
    select: { cursoId: true },
  });
  return filas.map((f) => f.cursoId);
}

// null significa "todo el colegio"; un arreglo acota a esos cursos.
export async function cursosVisibles(sesion: SesionUsuario): Promise<string[] | null> {
  if (veTodoElColegio(sesion)) return null;
  return cursosDe(sesion);
}

export async function whereCursos(sesion: SesionUsuario): Promise<Prisma.CursoWhereInput> {
  const visibles = await cursosVisibles(sesion);
  return {
    colegioId: sesion.colegioId,
    ...(visibles ? { id: { in: visibles } } : {}),
  };
}

export async function whereEnsayos(sesion: SesionUsuario): Promise<Prisma.EnsayoWhereInput> {
  const visibles = await cursosVisibles(sesion);
  if (!visibles) return { colegioId: sesion.colegioId };
  return {
    colegioId: sesion.colegioId,
    OR: [
      { creadoPorId: sesion.id },
      { asignaciones: { some: { cursoId: { in: visibles } } } },
    ],
  };
}

export async function whereAsignaciones(
  sesion: SesionUsuario,
): Promise<Prisma.AsignacionWhereInput> {
  const visibles = await cursosVisibles(sesion);
  return {
    curso: { colegioId: sesion.colegioId },
    ...(visibles ? { cursoId: { in: visibles } } : {}),
  };
}

export async function whereEstudiantes(
  sesion: SesionUsuario,
): Promise<Prisma.EstudianteWhereInput> {
  const visibles = await cursosVisibles(sesion);
  return {
    colegioId: sesion.colegioId,
    ...(visibles ? { matriculas: { some: { cursoId: { in: visibles } } } } : {}),
  };
}

// --------------------------------------------------------------- guardas ---

export async function cursoVisible(sesion: SesionUsuario, cursoId: string): Promise<boolean> {
  const visibles = await cursosVisibles(sesion);
  if (!visibles) {
    const curso = await prisma.curso.findFirst({
      where: { id: cursoId, colegioId: sesion.colegioId },
      select: { id: true },
    });
    return Boolean(curso);
  }
  return visibles.includes(cursoId);
}

export async function ensayoVisible(sesion: SesionUsuario, ensayoId: string): Promise<boolean> {
  const ensayo = await prisma.ensayo.findFirst({
    where: { id: ensayoId, ...(await whereEnsayos(sesion)) },
    select: { id: true },
  });
  return Boolean(ensayo);
}

export async function estudianteVisible(
  sesion: SesionUsuario,
  estudianteId: string,
): Promise<boolean> {
  const estudiante = await prisma.estudiante.findFirst({
    where: { id: estudianteId, ...(await whereEstudiantes(sesion)) },
    select: { id: true },
  });
  return Boolean(estudiante);
}

// Direccion puede mirar pero no escribir. Se comprueba antes de mutar.
export function puedeEscribir(sesion: SesionUsuario): boolean {
  return !soloLectura(sesion);
}
