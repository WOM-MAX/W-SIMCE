import { prisma } from '@/lib/prisma';

// Resumen para la dirección: números del año, sin operar la plataforma.
// Todo se calcula por año escolar y por curso.

export type FilaCurso = {
  cursoId: string;
  nombre: string;
  nivel: string;
  matriculados: number;
  rendidos: number;
  promedioPct: number;
  insuficiente: number;
  elemental: number;
  adecuado: number;
  sinNivel: number;
};

export type FilaNivel = {
  nivel: string;
  orden: number;
  cursos: number;
  matriculados: number;
  rendidos: number;
  promedioPct: number;
};

export type PuntoSerie = {
  asignacionId: string;
  titulo: string;
  curso: string;
  fecha: Date;
  rendidos: number;
  promedioPct: number;
};

export type FilaBanco = {
  nivel: string;
  disponibles: number;
  usados: number;
};

export type ResumenDireccion = {
  matriculados: number;
  cursos: number;
  ensayos: number;
  asignaciones: number;
  rendidos: number;
  participacion: number;
  promedioPct: number;
  porCurso: FilaCurso[];
  porNivel: FilaNivel[];
  serie: PuntoSerie[];
  banco: FilaBanco[];
};

function promedio(valores: number[]): number {
  if (valores.length === 0) return 0;
  return Math.round((valores.reduce((a, b) => a + b, 0) / valores.length) * 10) / 10;
}

export async function resumenDireccion(
  colegioId: string,
  anioId: string,
): Promise<ResumenDireccion> {
  const [cursos, intentos, ensayos, asignaciones, niveles, items, usados] = await Promise.all([
    prisma.curso.findMany({
      where: { colegioId, anioId },
      select: {
        id: true,
        nombre: true,
        nivel: { select: { nombre: true, orden: true } },
        _count: { select: { matriculas: { where: { estado: 'ACTIVA' } } } },
      },
      orderBy: [{ nivel: { orden: 'asc' } }, { letra: 'asc' }],
    }),
    prisma.intento.findMany({
      where: {
        asignacion: { curso: { colegioId, anioId } },
        estado: { in: ['ENVIADO', 'EXPIRADO'] },
      },
      select: {
        estudianteId: true,
        asignacionId: true,
        resultado: { select: { pctLogro: true, nivelLogro: true } },
        asignacion: {
          select: {
            cursoId: true,
            creadaEn: true,
            ensayo: { select: { titulo: true } },
            curso: { select: { nombre: true } },
          },
        },
      },
    }),
    prisma.ensayo.count({ where: { colegioId, anioId } }),
    prisma.asignacion.count({ where: { curso: { colegioId, anioId } } }),
    prisma.nivel.findMany({ select: { id: true, nombre: true, orden: true } }),
    prisma.item.count({ where: { estado: 'APROBADO' } }),
    prisma.ensayoItem.findMany({
      where: { ensayo: { colegioId, anioId } },
      select: { itemVersion: { select: { itemId: true } } },
    }),
  ]);

  const nombreNivel = new Map(niveles.map((n) => [n.id, n.nombre]));

  const porCurso = new Map<string, FilaCurso>();
  for (const c of cursos) {
    porCurso.set(c.id, {
      cursoId: c.id,
      nombre: c.nombre,
      nivel: c.nivel.nombre,
      matriculados: c._count.matriculas,
      rendidos: 0,
      promedioPct: 0,
      insuficiente: 0,
      elemental: 0,
      adecuado: 0,
      sinNivel: 0,
    });
  }

  const pctsPorCurso = new Map<string, number[]>();
  const porAsignacion = new Map<
    string,
    { titulo: string; curso: string; fecha: Date; pcts: number[] }
  >();
  const estudiantesConIntento = new Set<string>();

  for (const intento of intentos) {
    const fila = porCurso.get(intento.asignacion.cursoId);
    const pct = intento.resultado ? Number(intento.resultado.pctLogro) : null;

    if (fila) {
      fila.rendidos += 1;
      const nivel = intento.resultado?.nivelLogro ?? null;
      if (nivel === 'Insuficiente') fila.insuficiente += 1;
      else if (nivel === 'Elemental') fila.elemental += 1;
      else if (nivel === 'Adecuado') fila.adecuado += 1;
      else fila.sinNivel += 1;
    }

    if (pct !== null) {
      const lista = pctsPorCurso.get(intento.asignacion.cursoId) ?? [];
      lista.push(pct);
      pctsPorCurso.set(intento.asignacion.cursoId, lista);
    }

    estudiantesConIntento.add(intento.estudianteId);

    const punto = porAsignacion.get(intento.asignacionId) ?? {
      titulo: intento.asignacion.ensayo.titulo,
      curso: intento.asignacion.curso.nombre,
      fecha: intento.asignacion.creadaEn,
      pcts: [],
    };
    if (pct !== null) punto.pcts.push(pct);
    porAsignacion.set(intento.asignacionId, punto);
  }

  for (const [cursoId, fila] of porCurso) {
    fila.promedioPct = promedio(pctsPorCurso.get(cursoId) ?? []);
  }

  const porNivelMap = new Map<string, FilaNivel>();
  for (const c of cursos) {
    const clave = c.nivel.nombre;
    const fila = porNivelMap.get(clave) ?? {
      nivel: clave,
      orden: c.nivel.orden,
      cursos: 0,
      matriculados: 0,
      rendidos: 0,
      promedioPct: 0,
    };
    fila.cursos += 1;
    fila.matriculados += c._count.matriculas;
    porNivelMap.set(clave, fila);
  }
  for (const fila of porCurso.values()) {
    const destino = porNivelMap.get(fila.nivel);
    if (destino) destino.rendidos += fila.rendidos;
  }
  for (const [clave, fila] of porNivelMap) {
    const pcts = [...porCurso.values()]
      .filter((c) => c.nivel === clave)
      .flatMap((c) => pctsPorCurso.get(c.cursoId) ?? []);
    fila.promedioPct = promedio(pcts);
  }

  const serie: PuntoSerie[] = [...porAsignacion.entries()]
    .map(([asignacionId, valor]) => ({
      asignacionId,
      titulo: valor.titulo,
      curso: valor.curso,
      fecha: valor.fecha,
      rendidos: valor.pcts.length,
      promedioPct: promedio(valor.pcts),
    }))
    .sort((a, b) => a.fecha.getTime() - b.fecha.getTime());

  // Cobertura del banco: ítems aprobados por nivel y cuántos distintos se usaron.
  const totalMatriculados = cursos.reduce((suma, c) => suma + c._count.matriculas, 0);
  const todosPcts = [...pctsPorCurso.values()].flat();

  const usadosPorNivel = new Map<string, Set<string>>();
  const itemNivel = await prisma.item.findMany({
    where: { id: { in: [...new Set(usados.map((u) => u.itemVersion.itemId))] } },
    select: { id: true, nivelId: true },
  });
  const nivelDeItem = new Map(itemNivel.map((i) => [i.id, i.nivelId]));
  for (const u of usados) {
    const nivelId = nivelDeItem.get(u.itemVersion.itemId);
    if (!nivelId) continue;
    const set = usadosPorNivel.get(nivelId) ?? new Set<string>();
    set.add(u.itemVersion.itemId);
    usadosPorNivel.set(nivelId, set);
  }

  const porNivelItems = await prisma.item.groupBy({
    by: ['nivelId'],
    where: { estado: 'APROBADO' },
    _count: { _all: true },
  });

  const banco: FilaBanco[] = porNivelItems
    .map((fila) => ({
      nivel: nombreNivel.get(fila.nivelId) ?? 'Sin nivel',
      disponibles: fila._count._all,
      usados: usadosPorNivel.get(fila.nivelId)?.size ?? 0,
    }))
    .sort((a, b) => a.nivel.localeCompare(b.nivel, 'es'));

  return {
    matriculados: totalMatriculados,
    cursos: cursos.length,
    ensayos,
    asignaciones,
    rendidos: intentos.length,
    participacion:
      totalMatriculados > 0 ? Math.round((estudiantesConIntento.size / totalMatriculados) * 100) : 0,
    promedioPct: promedio(todosPcts),
    porCurso: [...porCurso.values()],
    porNivel: [...porNivelMap.values()].sort((a, b) => a.orden - b.orden),
    serie,
    banco: banco.length > 0 ? banco : [{ nivel: '—', disponibles: items, usados: 0 }],
  };
}
