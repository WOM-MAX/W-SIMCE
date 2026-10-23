import { prisma } from '@/lib/prisma';
import { esTecnico, sesionActual } from '@/lib/auth';
import { texto, volver } from '@/lib/http';

// Administración del año escolar: crear, activar y cerrar.
// Un solo año activo por colegio; cerrar bloquea la escritura para todos.
export async function POST(request: Request) {
  const sesion = await sesionActual();
  if (!sesion || sesion.tipo !== 'usuario') return volver(request, '/login');
  if (!esTecnico(sesion)) return volver(request, '/admin?error=permiso');

  const form = await request.formData();
  const accion = texto(form, 'accion');

  try {
    if (accion === 'crear') {
      const anio = Number.parseInt(texto(form, 'anio'), 10);
      if (!Number.isFinite(anio) || anio < 2000 || anio > 2100) {
        return volver(request, '/admin?error=anio');
      }
      await prisma.anioEscolar.create({
        data: {
          colegioId: sesion.colegioId,
          anio,
          estado: 'planificacion',
          fechaInicio: new Date(Date.UTC(anio, 2, 1, 4, 0, 0)),
          fechaCierre: new Date(Date.UTC(anio, 11, 21, 3, 59, 0)),
        },
      });
      return volver(request, '/admin?ok=anio-creado');
    }

    const anioId = texto(form, 'anioId');
    if (!anioId) return volver(request, '/admin?error=datos');

    const objetivo = await prisma.anioEscolar.findFirst({
      where: { id: anioId, colegioId: sesion.colegioId },
      select: { id: true, estado: true },
    });
    if (!objetivo) return volver(request, '/admin?error=datos');

    if (accion === 'activar') {
      const otro = await prisma.anioEscolar.findFirst({
        where: { colegioId: sesion.colegioId, estado: 'activo', id: { not: objetivo.id } },
        select: { anio: true },
      });
      if (otro) return volver(request, '/admin?error=anio-activo');

      await prisma.anioEscolar.update({
        where: { id: objetivo.id },
        data: { estado: 'activo' },
      });
      return volver(request, '/admin?ok=anio-activado');
    }

    if (accion === 'cerrar') {
      await prisma.anioEscolar.update({
        where: { id: objetivo.id },
        data: { estado: 'cerrado' },
      });
      return volver(request, '/admin?ok=anio-cerrado');
    }

    if (accion === 'planificar') {
      await prisma.anioEscolar.update({
        where: { id: objetivo.id },
        data: { estado: 'planificacion' },
      });
      return volver(request, '/admin?ok=anio-planificado');
    }

    return volver(request, '/admin?error=datos');
  } catch (error) {
    console.error('anio escolar', error);
    const codigo = (error as { code?: string }).code;
    return volver(request, codigo === 'P2002' ? '/admin?error=anio' : '/admin?error=interno');
  }
}
