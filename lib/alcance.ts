// Alcance de datos por rol y por año escolar. Un solo lugar decide que ve cada
// persona, para que ninguna pantalla ni endpoint tenga su propia version.
//
//   ADMIN, DIRECCION  -> todo el colegio
//   UTP, DOCENTE      -> los cursos que tiene asignados
//
// Regla de lectura: "lo que cree" + "lo que me asignaron". Un docente ve el ensayo
// que armo la coordinacion para su curso, aunque no sea el creador.
//
// Todo se acota al año escolar seleccionado: los cursos, los estudiantes
// matriculados en esos cursos, los ensayos de ese año y sus asignaciones.

import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { soloLectura, veTodoElColegio, type SesionUsuario } from '@/lib/auth';
import { anioActual, anioEscribible } from '@/lib/anio';

// Cursos que atiende la persona, en cualquier año.
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
  const [visibles, anio] = await Promise.all([cursosVisibles(sesion), anioActual(sesion)]);
  return {
    colegioId: sesion.colegioId,
    ...(anio ? { anioId: anio.id } : {}),
    ...(visibles ? { id: { in: visibles } } : {}),
  };
}

export async function whereEnsayos(sesion: SesionUsuario): Promise<Prisma.EnsayoWhereInput> {
  const [visibles, anio] = await Promise.all([cursosVisibles(sesion), anioActual(sesion)]);
  const base: Prisma.EnsayoWhereInput = {
    colegioId: sesion.colegioId,
    ...(anio ? { anioId: anio.id } : {}),
  };
  if (!visibles) return base;
  return {
    ...base,
    OR: [
      { creadoPorId: sesion.id },
      { asignaciones: { some: { cursoId: { in: visibles } } } },
    ],
  };
}

export async function whereAsignaciones(
  sesion: SesionUsuario,
): Promise<Prisma.AsignacionWhereInput> {
  const [visibles, anio] = await Promise.all([cursosVisibles(sesion), anioActual(sesion)]);
  return {
    curso: {
      colegioId: sesion.colegioId,
      ...(anio ? { anioId: anio.id } : {}),
    },
    ...(visibles ? { cursoId: { in: visibles } } : {}),
  };
}

export async function whereEstudiantes(
  sesion: SesionUsuario,
): Promise<Prisma.EstudianteWhereInput> {
  const [visibles, anio] = await Promise.all([cursosVisibles(sesion), anioActual(sesion)]);

  if (visibles) {
    return {
      colegioId: sesion.colegioId,
      matriculas: {
        some: {
          cursoId: { in: visibles },
          ...(anio ? { curso: { anioId: anio.id } } : {}),
        },
      },
    };
  }

  return {
    colegioId: sesion.colegioId,
    ...(anio ? { matriculas: { some: { curso: { anioId: anio.id } } } } : {}),
  };
}

// --------------------------------------------------------------- guardas ---

export async function cursoVisible(sesion: SesionUsuario, cursoId: string): Promise<boolean> {
  const curso = await prisma.curso.findFirst({
    where: { id: cursoId, ...(await whereCursos(sesion)) },
    select: { id: true },
  });
  return Boolean(curso);
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

// Escritura: el rol debe permitirla, el año no puede estar cerrado y no se puede
// escribir mientras se está en "ver como".
export async function puedeEditar(sesion: SesionUsuario): Promise<boolean> {
  if (soloLectura(sesion)) return false;
  const { hayVerComo } = await import('@/lib/ver-como');
  if (await hayVerComo()) return false;
  return anioEscribible(await anioActual(sesion));
}
