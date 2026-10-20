import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

// Registro de auditoria. La tabla Evento existia sin uso.
// Se escribe siempre en try, para que un fallo de auditoria no tumbe la accion.

export type DatosEvento = {
  colegioId?: string | null;
  actorId?: string | null;
  entidad: string;
  entidadId: string;
  accion: string;
  payload?: Record<string, unknown>;
};

export async function registrarEvento(datos: DatosEvento): Promise<void> {
  try {
    await prisma.evento.create({
      data: {
        colegioId: datos.colegioId ?? null,
        actorId: datos.actorId ?? null,
        entidad: datos.entidad,
        entidadId: datos.entidadId,
        accion: datos.accion,
        payload: (datos.payload ?? {}) as Prisma.InputJsonValue,
      },
    });
  } catch (error) {
    console.error('registrarEvento', error);
  }
}

// Fuerza bruta: cuenta fallos de la misma identidad en la ventana reciente.
export async function demasiadosFallos(
  identidad: string,
  minutos = 15,
  limite = 5
): Promise<number> {
  const desde = new Date(Date.now() - minutos * 60_000);
  try {
    return await prisma.evento.count({
      where: {
        entidad: 'sesion',
        accion: 'login_fallido',
        entidadId: identidad,
        ocurridoEn: { gte: desde },
      },
    });
  } catch (error) {
    console.error('demasiadosFallos', error);
    return 0;
  }
}

// Purgado de auditoria por antiguedad. Devuelve cuantas filas borro.
export async function purgarEventos(dias: number): Promise<number> {
  const corte = new Date(Date.now() - dias * 24 * 60 * 60 * 1000);
  const resultado = await prisma.evento.deleteMany({ where: { ocurridoEn: { lt: corte } } });
  return resultado.count;
}
