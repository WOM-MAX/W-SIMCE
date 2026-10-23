import { prisma } from '@/lib/prisma';
import { sesionActual } from '@/lib/auth';
import { puedeEscribir, whereEnsayos } from '@/lib/alcance';
import { volver } from '@/lib/http';

// Borra un ensayo. Solo si no tiene asignaciones: el borrado en cascada del
// esquema arrastraria asignaciones, intentos y respuestas de los alumnos.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const sesion = await sesionActual();
  if (!sesion || sesion.tipo !== 'usuario') return volver(request, '/login');
  if (!puedeEscribir(sesion)) return volver(request, '/ensayos?error=permiso');

  const { id } = await params;

  const ensayo = await prisma.ensayo.findFirst({
    where: { id, ...(await whereEnsayos(sesion)) },
    select: { id: true, titulo: true, _count: { select: { asignaciones: true } } },
  });

  if (!ensayo) return volver(request, '/ensayos?error=ensayo');
  if (ensayo._count.asignaciones > 0) return volver(request, '/ensayos?error=con-asignaciones');

  await prisma.ensayo.delete({ where: { id: ensayo.id } });

  return volver(request, `/ensayos?ok=eliminado&nombre=${encodeURIComponent(ensayo.titulo)}`);
}
