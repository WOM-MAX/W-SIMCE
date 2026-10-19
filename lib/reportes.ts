import { prisma } from '@/lib/prisma';
import { corregirIntento } from '@/lib/correccion';

export type FilaEstudiante = {
  intentoId: string;
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

export async function asignacionesDelColegio(colegioId: string) {
  return prisma.asignacion.findMany({
    where: { curso: { colegioId } },
    include: { ensayo: true, curso: true },
    orderBy: { creadaEn: 'desc' },
  });
}

export async function informeDeAsignacion(
  asignacionId: string,
  colegioId: string
): Promise<InformeAsignacion | null> {
  const asignacion = await prisma.asignacion.findFirst({
    where: { id: asignacionId, curso: { colegioId } },
    include: { ensayo: true, curso: true },
  });
  if (!asignacion) return null;

  const cargarIntentos = () =>
    prisma.intento.findMany({
      where: { asignacionId, estado: { in: ['ENVIADO', 'EXPIRADO'] } },
      include: {
        estudiante: { select: { nombres: true, apellidos: true, codigoAcceso: true } },
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
