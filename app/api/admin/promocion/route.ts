import { prisma } from '@/lib/prisma';
import { esTecnico, sesionActual } from '@/lib/auth';
import { texto, volver } from '@/lib/http';
import { copiarCursos, promover, type ParPromocion } from '@/lib/promocion';

// Promoción anual: copiar la estructura de cursos y matricular a los estudiantes
// del año anterior en el año nuevo. Solo el administrador técnico.
export async function POST(request: Request) {
  const sesion = await sesionActual();
  if (!sesion || sesion.tipo !== 'usuario') return volver(request, '/login');
  if (!esTecnico(sesion)) return volver(request, '/admin?error=permiso');

  const form = await request.formData();
  const accion = texto(form, 'accion');
  const origenId = texto(form, 'origenId');
  const destinoId = texto(form, 'destinoId');

  if (!origenId || !destinoId || origenId === destinoId) {
    return volver(request, '/admin/promocion?error=datos');
  }

  const [origen, destino] = await Promise.all([
    prisma.anioEscolar.findFirst({
      where: { id: origenId, colegioId: sesion.colegioId },
      select: { id: true, anio: true },
    }),
    prisma.anioEscolar.findFirst({
      where: { id: destinoId, colegioId: sesion.colegioId },
      select: { id: true, anio: true, estado: true },
    }),
  ]);

  if (!origen || !destino) return volver(request, '/admin/promocion?error=datos');
  if (destino.estado === 'cerrado') {
    return volver(request, `/admin/promocion?origen=${origenId}&destino=${destinoId}&error=cerrado`);
  }

  const volverA = (params: string) =>
    volver(request, `/admin/promocion?origen=${origenId}&destino=${destinoId}&${params}`);

  try {
    if (accion === 'copiar-cursos') {
      const resultado = await copiarCursos(sesion.colegioId, origenId, destinoId);
      return volverA(`ok=cursos&n=${resultado.creados}`);
    }

    if (accion === 'promover') {
      const pares: ParPromocion[] = [];
      for (const [clave, valor] of form.entries()) {
        if (!clave.startsWith('destino-')) continue;
        const estudianteId = clave.slice('destino-'.length);
        const cursoId = String(valor).trim();
        if (!estudianteId || !cursoId) continue;
        pares.push({ estudianteId, cursoId });
      }

      if (pares.length === 0) return volverA('error=seleccion');

      const resultado = await promover(sesion.colegioId, destinoId, pares);
      return volverA(
        `ok=promovidos&n=${resultado.creadas}&o=${resultado.omitidas}&d=${resultado.ajenas}`,
      );
    }

    return volverA('error=datos');
  } catch (error) {
    console.error('promocion', error);
    return volverA('error=interno');
  }
}
