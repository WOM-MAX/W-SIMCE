import { prisma } from '@/lib/prisma';
import { sesionAdmin } from '@/lib/auth';
import { volver } from '@/lib/http';

export async function POST(request: Request) {
  const sesion = await sesionAdmin();
  if (!sesion) return volver(request, '/');

  const form = await request.formData();
  const ids = form
    .getAll('ids')
    .map((valor) => (typeof valor === 'string' ? valor.trim() : ''))
    .filter((valor) => valor.length > 0);

  if (ids.length === 0) return volver(request, '/admin?error=seleccion');

  try {
    // El colegio en el filtro impide borrar estudiantes de otro establecimiento.
    const resultado = await prisma.estudiante.deleteMany({
      where: { id: { in: ids }, colegioId: sesion.colegioId },
    });
    return volver(request, `/admin?ok=borrados&n=${resultado.count}`);
  } catch (error) {
    console.error('borrar estudiantes', error);
    return volver(request, '/admin?error=interno');
  }
}
