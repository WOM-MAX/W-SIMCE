import { prisma } from '@/lib/prisma';

export type NivelLogro = 'Insuficiente' | 'Elemental' | 'Adecuado';

export function nivelDeLogro(
  pct: number,
  corteElemental: number,
  corteAdecuado: number
): NivelLogro {
  if (pct < corteElemental) return 'Insuficiente';
  if (pct < corteAdecuado) return 'Elemental';
  return 'Adecuado';
}

// Conversion lineal del porcentaje de logro a la escala 100-1000 que usa el
// colegio para comunicar resultados. Es una regla declarada, no una
// calibracion psicometrica con puntajes de corte por habilidad.
export function escalaDeLogro(pct: number): number {
  const acotado = Math.max(0, Math.min(100, pct));
  return Math.round(100 + (acotado / 100) * 900);
}

export function porcentaje(correctas: number, total: number): number {
  if (!total) return 0;
  return Math.round((correctas / total) * 10000) / 100;
}

type Dimension = 'EJE' | 'HABILIDAD' | 'BLOOM' | 'DIFICULTAD';

// Idempotente: se puede llamar al enviar, al expirar y al abrir el informe.
export async function corregirIntento(intentoId: string): Promise<void> {
  const intento = await prisma.intento.findUnique({
    where: { id: intentoId },
    select: {
      id: true,
      asignacion: { select: { curso: { select: { colegioId: true } } } },
      items: {
        select: {
          ejeClave: true,
          habilidad: true,
          bloom: true,
          dificultad: true,
          itemVersion: { select: { clave: true } },
          respuesta: { select: { letra: true } },
        },
      },
    },
  });
  if (!intento) return;

  const colegioId = intento.asignacion.curso.colegioId;
  const config = await prisma.configuracionColegio.findUnique({ where: { colegioId } });
  const corteElemental = config?.corteElemental ?? 50;
  const corteAdecuado = config?.corteAdecuado ?? 75;

  const total = intento.items.length;
  let correctas = 0;
  const acumulado = new Map<
    string,
    { dimension: Dimension; clave: string; correctas: number; total: number }
  >();

  for (const item of intento.items) {
    const acierto = item.respuesta?.letra != null && item.respuesta.letra === item.itemVersion.clave;
    if (acierto) correctas += 1;

    const pares: Array<[Dimension, string]> = [
      ['EJE', item.ejeClave],
      ['HABILIDAD', item.habilidad],
      ['BLOOM', item.bloom],
      ['DIFICULTAD', item.dificultad],
    ];

    for (const [dimension, clave] of pares) {
      const llave = `${dimension}|${clave}`;
      const fila = acumulado.get(llave) ?? { dimension, clave, correctas: 0, total: 0 };
      fila.total += 1;
      if (acierto) fila.correctas += 1;
      acumulado.set(llave, fila);
    }
  }

  const pct = porcentaje(correctas, total);
  const escala = escalaDeLogro(pct);
  const nivel = nivelDeLogro(pct, corteElemental, corteAdecuado);

  await prisma.$transaction(async (tx) => {
    await tx.resultadoIntento.upsert({
      where: { intentoId },
      update: {
        correctas,
        total,
        pctLogro: pct,
        puntajeEscala: escala,
        nivelLogro: nivel,
        calculadoEn: new Date(),
      },
      create: {
        intentoId,
        correctas,
        total,
        pctLogro: pct,
        puntajeEscala: escala,
        nivelLogro: nivel,
      },
    });

    await tx.resultadoDimension.deleteMany({ where: { intentoId } });
    await tx.resultadoDimension.createMany({
      data: [...acumulado.values()].map((fila) => ({
        intentoId,
        dimension: fila.dimension,
        clave: fila.clave,
        correctas: fila.correctas,
        total: fila.total,
        pct: porcentaje(fila.correctas, fila.total),
      })),
    });
  });
}

// Lee la configuración del colegio, creando la fila por defecto si falta.
export async function configuracionDe(colegioId: string) {
  const existente = await prisma.configuracionColegio.findUnique({ where: { colegioId } });
  if (existente) return existente;
  return prisma.configuracionColegio.create({ data: { colegioId } });
}
