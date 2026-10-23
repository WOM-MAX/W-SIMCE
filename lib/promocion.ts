import { prisma } from '@/lib/prisma';

// Promoción anual: copiar la estructura de cursos y matricular a los estudiantes
// del año anterior en el año nuevo. Nunca copia ensayos, intentos ni resultados:
// solo la identidad del estudiante y su nuevo curso.

export type CursoConNivel = {
  id: string;
  nombre: string;
  letra: string;
  nivelId: string;
  nivel: { id: string; codigo: string; nombre: string; orden: number };
};

export async function cursosDeAnio(colegioId: string, anioId: string): Promise<CursoConNivel[]> {
  return prisma.curso.findMany({
    where: { colegioId, anioId },
    select: {
      id: true,
      nombre: true,
      letra: true,
      nivelId: true,
      nivel: { select: { id: true, codigo: true, nombre: true, orden: true } },
    },
    orderBy: [{ nivel: { orden: 'asc' } }, { letra: 'asc' }],
  });
}

// Crea en el año destino los cursos que existen en el origen y faltan. No toca
// los cursos que ya existen.
export async function copiarCursos(
  colegioId: string,
  origenId: string,
  destinoId: string,
): Promise<{ creados: number; existentes: number }> {
  const [origen, destino] = await Promise.all([
    cursosDeAnio(colegioId, origenId),
    cursosDeAnio(colegioId, destinoId),
  ]);

  const yaEstan = new Set(destino.map((c) => `${c.nivelId}|${c.letra}`));
  const faltantes = origen.filter((c) => !yaEstan.has(`${c.nivelId}|${c.letra}`));

  let creados = 0;
  for (const c of faltantes) {
    try {
      await prisma.curso.create({
        data: {
          colegioId,
          anioId: destinoId,
          nivelId: c.nivelId,
          letra: c.letra,
          nombre: c.nombre,
        },
      });
      creados += 1;
    } catch (error) {
      // Carrera con otro administrador: el único compuesto ya existe.
      if ((error as { code?: string }).code !== 'P2002') throw error;
    }
  }

  return { creados, existentes: destino.length };
}

// Curso sugerido: el siguiente nivel que exista en el catálogo, misma letra. El
// orden de los niveles no es consecutivo (4, 6, 8, 12), así que se busca el
// siguiente orden disponible y no "orden + 1". Si no hay siguiente (egreso),
// devuelve null.
export function sugerirCurso(origen: CursoConNivel, destino: CursoConNivel[]): CursoConNivel | null {
  const ordenes = [...new Set(destino.map((c) => c.nivel.orden))].sort((a, b) => a - b);
  const siguiente = ordenes.find((orden) => orden > origen.nivel.orden);
  if (siguiente === undefined) return null;

  const mismos = destino.filter((c) => c.nivel.orden === siguiente);
  return mismos.find((c) => c.letra === origen.letra) ?? mismos[0];
}

export type ParPromocion = { estudianteId: string; cursoId: string };

// Matricula a los estudiantes en el año destino. Idempotente: si el estudiante
// ya está matriculado en ese curso, se omite.
export async function promover(
  colegioId: string,
  destinoId: string,
  pares: ParPromocion[],
): Promise<{ creadas: number; omitidas: number; ajenas: number }> {
  const cursos = await prisma.curso.findMany({
    where: { colegioId, anioId: destinoId },
    select: { id: true },
  });
  const validos = new Set(cursos.map((c) => c.id));

  const estudiantes = await prisma.estudiante.findMany({
    where: { colegioId },
    select: { id: true },
  });
  const delColegio = new Set(estudiantes.map((e) => e.id));

  let creadas = 0;
  let omitidas = 0;
  let ajenas = 0;

  for (const par of pares) {
    if (!validos.has(par.cursoId) || !delColegio.has(par.estudianteId)) {
      ajenas += 1;
      continue;
    }

    const existente = await prisma.matricula.findFirst({
      where: {
        estudianteId: par.estudianteId,
        cursoId: par.cursoId,
        estado: 'ACTIVA',
      },
      select: { id: true },
    });
    if (existente) {
      omitidas += 1;
      continue;
    }

    try {
      await prisma.matricula.create({
        data: { estudianteId: par.estudianteId, cursoId: par.cursoId },
      });
      creadas += 1;
    } catch (error) {
      if ((error as { code?: string }).code === 'P2002') {
        omitidas += 1;
        continue;
      }
      throw error;
    }
  }

  return { creadas, omitidas, ajenas };
}
