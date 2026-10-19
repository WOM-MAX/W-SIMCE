import { prisma } from '@/lib/prisma';
import { sesionActual, type Sesion } from '@/lib/auth';
import { corregirIntento } from '@/lib/correccion';

export type SesionEstudiante = Extract<Sesion, { tipo: 'estudiante' }>;

export async function estudianteActual(): Promise<SesionEstudiante | null> {
  const sesion = await sesionActual();
  return sesion && sesion.tipo === 'estudiante' ? sesion : null;
}

// El cierre por tiempo lo decide el servidor, nunca el navegador.
export async function cerrarSiVencido(intentoId: string): Promise<boolean> {
  const intento = await prisma.intento.findUnique({
    where: { id: intentoId },
    select: { estado: true, fechaLimite: true, iniciadoEn: true },
  });
  if (!intento) return true;
  if (intento.estado !== 'EN_CURSO') return true;
  if (new Date() <= intento.fechaLimite) return false;

  const usado = Math.max(
    0,
    Math.round((intento.fechaLimite.getTime() - intento.iniciadoEn.getTime()) / 1000)
  );

  await prisma.intento.update({
    where: { id: intentoId },
    data: { estado: 'EXPIRADO', enviadoEn: intento.fechaLimite, tiempoUsadoSeg: usado },
  });
  await corregirIntento(intentoId);
  return true;
}

export function segundosRestantes(fechaLimite: Date): number {
  return Math.max(0, Math.floor((fechaLimite.getTime() - Date.now()) / 1000));
}

export function formatoDuracion(segundos: number | null | undefined): string {
  const total = Math.max(0, Math.round(segundos ?? 0));
  const min = Math.floor(total / 60);
  const seg = total % 60;
  return `${min} min ${String(seg).padStart(2, '0')} s`;
}

// Carga un intento del estudiante en sesión, con ítems, respuestas y contenido.
export async function intentoDelEstudiante(intentoId: string, estudianteId: string) {
  return prisma.intento.findFirst({
    where: { id: intentoId, estudianteId },
    include: {
      asignacion: { include: { curso: true, ensayo: true } },
      items: {
        orderBy: { orden: 'asc' },
        include: {
          respuesta: true,
          itemVersion: {
            include: {
              alternativas: { orderBy: { letra: 'asc' } },
              item: { include: { texto: true, figura: true } },
            },
          },
        },
      },
    },
  });
}
