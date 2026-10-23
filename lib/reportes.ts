import { prisma } from '@/lib/prisma';
import { corregirIntento } from '@/lib/correccion';
import type { SesionUsuario } from '@/lib/auth';
import { whereAsignaciones } from '@/lib/alcance';

export type FilaEstudiante = {
  intentoId: string;
  estudianteId: string;
  codigo: string;
  nombre: string;
  correctas: number;
  total: number;
  pct: number;
  escala: number | null;
  nivel: string | null;
  estado: string;
};

export type FilaDimension = {
  clave: string;
  correctas: number;
  total: number;
  pct: number;
};

export type InformeAsignacion = {
  id: string;
  titulo: string;
  curso: string;
  tiempoMin: number;
  rendidos: number;
  promedioPct: number;
  promedioEscala: number;
  porNivel: Array<{ nivel: string; cantidad: number }>;
  estudiantes: FilaEstudiante[];
  porEje: FilaDimension[];
  porHabilidad: FilaDimension[];
  porDificultad: FilaDimension[];
};

function redondear(valor: number, decimales = 1): number {
  const factor = 10 ** decimales;
  return Math.round(valor * factor) / factor;
}

function agrupar(
  filas: Array<{ dimension: string; clave: string; correctas: number; total: number }>,
  dimension: string
): FilaDimension[] {
  const mapa = new Map<string, { correctas: number; total: number }>();
  for (const fila of filas) {
    if (fila.dimension !== dimension) continue;
    const actual = mapa.get(fila.clave) ?? { correctas: 0, total: 0 };
    actual.correctas += fila.correctas;
    actual.total += fila.total;
    mapa.set(fila.clave, actual);
  }
  return [...mapa.entries()]
    .map(([clave, valor]) => ({
      clave,
      correctas: valor.correctas,
      total: valor.total,
      pct: valor.total ? redondear((valor.correctas / valor.total) * 100, 1) : 0,
    }))
    .sort((a, b) => b.pct - a.pct);
}

export async function asignacionesVisibles(sesion: SesionUsuario) {
  return prisma.asignacion.findMany({
    where: await whereAsignaciones(sesion),
    include: { ensayo: true, curso: true },
    orderBy: { creadaEn: 'desc' },
  });
}

export async function informeDeAsignacion(
  sesion: SesionUsuario,
  asignacionId: string
): Promise<InformeAsignacion | null> {
  const asignacion = await prisma.asignacion.findFirst({
    where: { id: asignacionId, ...(await whereAsignaciones(sesion)) },
    include: { ensayo: true, curso: true },
  });
  if (!asignacion) return null;

  const cargarIntentos = () =>
    prisma.intento.findMany({
      where: { asignacionId, estado: { in: ['ENVIADO', 'EXPIRADO'] } },
      include: {
        estudiante: { select: { id: true, nombres: true, apellidos: true, codigoAcceso: true } },
        resultado: { include: { dimensiones: true } },
      },
      orderBy: { enviadoEn: 'asc' },
    });

  let intentos = await cargarIntentos();

  // Un intento enviado sin resultado se corrige aquí, para que el informe y el
  // CSV nunca muestren menos rendidos de los que hubo.
  const pendientes = intentos.filter((i) => !i.resultado);
  if (pendientes.length > 0) {
    for (const pendiente of pendientes) {
      await corregirIntento(pendiente.id);
    }
    intentos = await cargarIntentos();
  }

  const conResultado = intentos.filter((i) => i.resultado);

  const estudiantes: FilaEstudiante[] = conResultado.map((i) => ({
    intentoId: i.id,
    estudianteId: i.estudiante.id,
    codigo: i.estudiante.codigoAcceso,
    nombre: `${i.estudiante.nombres} ${i.estudiante.apellidos}`,
    correctas: i.resultado?.correctas ?? 0,
    total: i.resultado?.total ?? 0,
    pct: Number(i.resultado?.pctLogro ?? 0),
    escala: i.resultado?.puntajeEscala ?? null,
    nivel: i.resultado?.nivelLogro ?? null,
    estado: i.estado,
  }));

  const sumas = conResultado.reduce(
    (acc, i) => {
      acc.pct += Number(i.resultado?.pctLogro ?? 0);
      acc.escala += i.resultado?.puntajeEscala ?? 0;
      return acc;
    },
    { pct: 0, escala: 0 }
  );

  const niveles = new Map<string, number>();
  for (const i of conResultado) {
    const nivel = i.resultado?.nivelLogro ?? 'Sin nivel';
    niveles.set(nivel, (niveles.get(nivel) ?? 0) + 1);
  }

  const dimensiones = conResultado.flatMap((i) =>
    (i.resultado?.dimensiones ?? []).map((d) => ({
      dimension: d.dimension,
      clave: d.clave,
      correctas: d.correctas,
      total: d.total,
    }))
  );

  return {
    id: asignacion.id,
    titulo: asignacion.ensayo.titulo,
    curso: asignacion.curso.nombre,
    tiempoMin: asignacion.ensayo.tiempoMin,
    rendidos: conResultado.length,
    promedioPct: conResultado.length ? redondear(sumas.pct / conResultado.length, 1) : 0,
    promedioEscala: conResultado.length ? Math.round(sumas.escala / conResultado.length) : 0,
    porNivel: [...niveles.entries()].map(([nivel, cantidad]) => ({ nivel, cantidad })),
    estudiantes,
    porEje: agrupar(dimensiones, 'EJE'),
    porHabilidad: agrupar(dimensiones, 'HABILIDAD'),
    porDificultad: agrupar(dimensiones, 'DIFICULTAD'),
  };
}

// ---------------------------------------------------------------- por item ---

export type FilaItem = {
  orden: number;
  clave: string;
  respondidas: number;
  correctas: number;
  pct: number;
  distribucion: Array<{ letra: string; cantidad: number }>;
};

export async function estadisticasPorItem(asignacionId: string): Promise<FilaItem[]> {
  const filas = await prisma.intentoItem.findMany({
    where: { intento: { asignacionId, estado: { in: ['ENVIADO', 'EXPIRADO'] } } },
    select: {
      orden: true,
      itemVersion: { select: { clave: true } },
      respuesta: { select: { letra: true } },
    },
  });

  const mapa = new Map<number, { clave: string; total: number; correctas: number; letras: Map<string, number> }>();

  for (const fila of filas) {
    const actual =
      mapa.get(fila.orden) ?? { clave: fila.itemVersion.clave, total: 0, correctas: 0, letras: new Map() };
    actual.total += 1;
    const letra = fila.respuesta?.letra ?? null;
    if (letra) {
      actual.letras.set(letra, (actual.letras.get(letra) ?? 0) + 1);
      if (letra === fila.itemVersion.clave) actual.correctas += 1;
    }
    mapa.set(fila.orden, actual);
  }

  return [...mapa.entries()]
    .map(([orden, valor]) => ({
      orden,
      clave: valor.clave,
      respondidas: valor.total,
      correctas: valor.correctas,
      pct: valor.total ? redondear((valor.correctas / valor.total) * 100, 1) : 0,
      distribucion: [...valor.letras.entries()]
        .map(([letra, cantidad]) => ({ letra, cantidad }))
        .sort((a, b) => a.letra.localeCompare(b.letra)),
    }))
    .sort((a, b) => a.orden - b.orden);
}

// ------------------------------------------------------------ historial -----

export type IntentoHistorial = {
  intentoId: string;
  ensayo: string;
  curso: string;
  fecha: Date | null;
  correctas: number;
  total: number;
  pct: number;
  escala: number | null;
  nivel: string | null;
};

export async function historialDeEstudiante(estudianteId: string, colegioId: string) {
  const estudiante = await prisma.estudiante.findFirst({
    where: { id: estudianteId, colegioId },
    select: { id: true, nombres: true, apellidos: true, run: true, codigoAcceso: true },
  });
  if (!estudiante) return null;

  const intentos = await prisma.intento.findMany({
    where: {
      estudianteId,
      estado: { in: ['ENVIADO', 'EXPIRADO'] },
      asignacion: { curso: { colegioId } },
    },
    include: {
      asignacion: { include: { ensayo: { select: { titulo: true } }, curso: { select: { nombre: true } } } },
      resultado: { include: { dimensiones: true } },
    },
    orderBy: { enviadoEn: 'desc' },
  });

  const historial: IntentoHistorial[] = intentos.map((i) => ({
    intentoId: i.id,
    ensayo: i.asignacion.ensayo.titulo,
    curso: i.asignacion.curso.nombre,
    fecha: i.enviadoEn,
    correctas: i.resultado?.correctas ?? 0,
    total: i.resultado?.total ?? 0,
    pct: Number(i.resultado?.pctLogro ?? 0),
    escala: i.resultado?.puntajeEscala ?? null,
    nivel: i.resultado?.nivelLogro ?? null,
  }));

  const porEje = new Map<string, { correctas: number; total: number }>();
  for (const i of intentos) {
    for (const d of i.resultado?.dimensiones ?? []) {
      if (d.dimension !== 'EJE') continue;
      const actual = porEje.get(d.clave) ?? { correctas: 0, total: 0 };
      actual.correctas += d.correctas;
      actual.total += d.total;
      porEje.set(d.clave, actual);
    }
  }

  return {
    estudiante,
    historial,
    porEje: [...porEje.entries()]
      .map(([clave, valor]) => ({
        clave,
        correctas: valor.correctas,
        total: valor.total,
        pct: valor.total ? redondear((valor.correctas / valor.total) * 100, 1) : 0,
      }))
      .sort((a, b) => b.pct - a.pct),
  };
}
