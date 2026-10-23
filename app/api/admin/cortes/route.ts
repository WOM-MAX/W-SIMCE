import { prisma } from '@/lib/prisma';
import { esTecnico, sesionActual } from '@/lib/auth';
import { texto, volver } from '@/lib/http';

// Cortes de logro por nivel educativo. Son referenciales del colegio: no
// reproducen los niveles oficiales SIMCE, que se fijan con puntajes de corte
// sobre la escala de cada prueba.
export async function POST(request: Request) {
  const sesion = await sesionActual();
  if (!sesion || sesion.tipo !== 'usuario') return volver(request, '/login');
  if (!esTecnico(sesion)) return volver(request, '/admin?error=permiso');

  const form = await request.formData();
  const nivelId = texto(form, 'nivelId');
  const elemental = Number.parseInt(texto(form, 'corteElemental'), 10);
  const adecuado = Number.parseInt(texto(form, 'corteAdecuado'), 10);

  if (!nivelId) return volver(request, '/admin?error=datos');

  const validos =
    Number.isFinite(elemental) &&
    Number.isFinite(adecuado) &&
    elemental >= 0 &&
    elemental <= 99 &&
    adecuado >= 1 &&
    adecuado <= 100 &&
    adecuado > elemental;

  if (!validos) return volver(request, '/admin?error=cortes');

  const nivel = await prisma.nivel.findUnique({ where: { id: nivelId }, select: { id: true } });
  if (!nivel) return volver(request, '/admin?error=datos');

  try {
    await prisma.corteNivel.upsert({
      where: { colegioId_nivelId: { colegioId: sesion.colegioId, nivelId } },
      update: { corteElemental: elemental, corteAdecuado: adecuado },
      create: {
        colegioId: sesion.colegioId,
        nivelId,
        corteElemental: elemental,
        corteAdecuado: adecuado,
      },
    });
    return volver(request, '/admin?ok=cortes');
  } catch (error) {
    console.error('cortes por nivel', error);
    return volver(request, '/admin?error=interno');
  }
}
