import { prisma } from '@/lib/prisma';
import { sesionActual } from '@/lib/auth';
import { volver } from '@/lib/http';

// Renombra un ensayo. El título no puede quedar vacío.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const sesion = await sesionActual();
  if (!sesion || sesion.tipo !== 'usuario') return volver(request, '/login');

  const { id } = await params;
  const form = await request.formData();
  const titulo = String(form.get('titulo') ?? '').trim();

  if (titulo.length < 3) return volver(request, '/ensayos?error=titulo-corto');

  const ensayo = await prisma.ensayo.findFirst({
    where: { id, colegioId: sesion.colegioId },
    select: { id: true },
  });
  if (!ensayo) return volver(request, '/ensayos?error=ensayo');

  await prisma.ensayo.update({ where: { id: ensayo.id }, data: { titulo } });

  return volver(request, `/ensayos?ok=renombrado&nombre=${encodeURIComponent(titulo)}`);
}
