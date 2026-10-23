// Año escolar: cuál se está mirando y si admite escritura.
//
// El año seleccionado viaja en una cookie y se valida contra los años del
// colegio. Si no hay cookie válida, se usa el año activo.

import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import type { SesionUsuario } from '@/lib/auth';

export const COOKIE_ANIO = 'wsimce_anio';

export type Anio = {
  id: string;
  anio: number;
  estado: string;
  fechaInicio: Date | null;
  fechaCierre: Date | null;
};

const CAMPOS = {
  id: true,
  anio: true,
  estado: true,
  fechaInicio: true,
  fechaCierre: true,
} as const;

export async function aniosDe(sesion: SesionUsuario): Promise<Anio[]> {
  return prisma.anioEscolar.findMany({
    where: { colegioId: sesion.colegioId },
    select: CAMPOS,
    orderBy: { anio: 'desc' },
  });
}

export async function anioActivo(sesion: SesionUsuario): Promise<Anio | null> {
  const activo = await prisma.anioEscolar.findFirst({
    where: { colegioId: sesion.colegioId, estado: 'activo' },
    select: CAMPOS,
    orderBy: { anio: 'desc' },
  });
  if (activo) return activo;
  return prisma.anioEscolar.findFirst({
    where: { colegioId: sesion.colegioId },
    select: CAMPOS,
    orderBy: { anio: 'desc' },
  });
}

// Año seleccionado. Nunca devuelve un año de otro colegio.
export async function anioActual(sesion: SesionUsuario): Promise<Anio | null> {
  const store = await cookies();
  const pedido = store.get(COOKIE_ANIO)?.value;
  if (pedido) {
    const elegido = await prisma.anioEscolar.findFirst({
      where: { id: pedido, colegioId: sesion.colegioId },
      select: CAMPOS,
    });
    if (elegido) return elegido;
  }
  return anioActivo(sesion);
}

// Un año cerrado no admite escritura para nadie. Reabrirlo es una accion
// explicita del administrador y queda auditada.
export function anioEscribible(anio: Anio | null): boolean {
  if (!anio) return true;
  return anio.estado === 'activo' || anio.estado === 'planificacion';
}

export const ESTADOS_ANIO = ['planificacion', 'activo', 'cerrado'] as const;
