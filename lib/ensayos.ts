import { prisma } from '@/lib/prisma';

export type OpcionesGeneracion = {
  nivelId: string;
  asignaturaId: string;
  ejeId: string | null;
  preguntas: number;
  tiempoMin: number;
  evitar?: number;
};

function mezclar<T>(entrada: T[]): T[] {
  const copia = [...entrada];
  for (let i = copia.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

export async function crearEnsayoBorrador(
  colegioId: string,
  opciones: OpcionesGeneracion
): Promise<{ id: string; titulo: string; items: number; repetidas: number }> {
  const [nivel, asignatura, eje] = await Promise.all([
    prisma.nivel.findUnique({ where: { id: opciones.nivelId } }),
    prisma.asignatura.findUnique({ where: { id: opciones.asignaturaId } }),
    opciones.ejeId ? prisma.eje.findUnique({ where: { id: opciones.ejeId } }) : null,
  ]);

  if (!nivel || !asignatura) throw new Error('NIVEL_INVALIDO');
  if (opciones.ejeId && (!eje || eje.nivelId !== nivel.id || eje.asignaturaId !== asignatura.id)) {
    throw new Error('EJE_INVALIDO');
  }

  const candidatos = await prisma.itemVersion.findMany({
    where: {
      item: {
        nivelId: nivel.id,
        asignaturaId: asignatura.id,
        estado: 'APROBADO',
        ...(eje ? { ejeId: eje.id } : {}),
      },
    },
    select: { id: true },
  });

  if (candidatos.length === 0) throw new Error('SIN_ITEMS');

  // Preguntas que ya aparecieron en las ultimas evaluaciones de este nivel y
  // asignatura. Se evitan salvo que no alcancen los items disponibles.
  const usadas = new Set<string>();
  if (opciones.evitar && opciones.evitar > 0) {
    const anteriores = await prisma.ensayo.findMany({
      where: { nivelId: nivel.id, asignaturaId: asignatura.id },
      orderBy: { creadoEn: 'desc' },
      ...(opciones.evitar < 999 ? { take: opciones.evitar } : {}),
      select: { items: { select: { itemVersionId: true } } },
    });
    for (const anterior of anteriores) {
      for (const fila of anterior.items) usadas.add(fila.itemVersionId);
    }
  }

  const libres = candidatos.filter((c) => !usadas.has(c.id));
  let elegidos = mezclar(libres.map((c) => c.id)).slice(0, opciones.preguntas);
  let repetidas = 0;

  if (elegidos.length < opciones.preguntas) {
    const repetibles = candidatos.filter((c) => usadas.has(c.id));
    const relleno = mezclar(repetibles.map((c) => c.id)).slice(0, opciones.preguntas - elegidos.length);
    elegidos = [...elegidos, ...relleno];
    repetidas = relleno.length;
  }

  if (elegidos.length === 0) throw new Error('SIN_ITEMS');

  const fecha = new Date().toLocaleDateString('es-CL', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const alcance = eje ? eje.nombre : 'Aleatorio';
  const titulo = `${asignatura.nombre} · ${nivel.nombre} · ${alcance} · ${elegidos.length} preguntas · ${fecha}`;

  const ensayo = await prisma.ensayo.create({
    data: {
      colegioId,
      nivelId: nivel.id,
      asignaturaId: asignatura.id,
      titulo,
      tiempoMin: opciones.tiempoMin,
      estado: 'BORRADOR',
      origen: 'ALEATORIO',
      items: {
        create: elegidos.map((itemVersionId, indice) => ({
          orden: indice + 1,
          itemVersionId,
          puntaje: 1,
        })),
      },
    },
    select: { id: true, titulo: true },
  });

  return { id: ensayo.id, titulo: ensayo.titulo, items: elegidos.length, repetidas };
}

export async function ensayosDelColegio(colegioId: string) {
  return prisma.ensayo.findMany({
    where: { colegioId },
    include: {
      nivel: true,
      asignatura: true,
      _count: { select: { items: true, asignaciones: true } },
    },
    orderBy: { creadoEn: 'desc' },
  });
}
