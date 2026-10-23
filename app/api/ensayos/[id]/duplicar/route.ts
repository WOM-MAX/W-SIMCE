import { prisma } from '@/lib/prisma';
import { sesionActual } from '@/lib/auth';
import { puedeEscribir, whereEnsayos } from '@/lib/alcance';
import { volver } from '@/lib/http';

// Duplica un ensayo con sus preguntas. La copia nace en borrador y sin
// asignaciones, aunque el original esté publicado.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const sesion = await sesionActual();
  if (!sesion || sesion.tipo !== 'usuario') return volver(request, '/login');
  if (!puedeEscribir(sesion)) return volver(request, '/ensayos?error=permiso');

  const { id } = await params;

  const original = await prisma.ensayo.findFirst({
    where: { id, ...(await whereEnsayos(sesion)) },
    include: { items: { orderBy: { orden: 'asc' } } },
  });
  if (!original) return volver(request, '/ensayos?error=ensayo');

  const titulo = `Copia de ${original.titulo}`.slice(0, 120);

  const copia = await prisma.ensayo.create({
    data: {
      colegioId: original.colegioId,
      nivelId: original.nivelId,
      asignaturaId: original.asignaturaId,
      titulo,
      tiempoMin: original.tiempoMin,
      estado: 'BORRADOR',
      origen: original.origen,
      creadoPorId: sesion.id,
      items: {
        create: original.items.map((i) => ({
          orden: i.orden,
          itemVersionId: i.itemVersionId,
          puntaje: i.puntaje,
        })),
      },
    },
    select: { id: true },
  });

  return volver(request, `/ensayos?ok=duplicado&nombre=${encodeURIComponent(titulo)}&id=${copia.id}`);
}
