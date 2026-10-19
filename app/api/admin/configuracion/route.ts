import { prisma } from '@/lib/prisma';
import { sesionAdmin } from '@/lib/auth';
import { texto, volver } from '@/lib/http';

export async function POST(request: Request) {
  const sesion = await sesionAdmin();
  if (!sesion) return volver(request, '/');

  const form = await request.formData();
  const activo = form.get('estudiantesVenResultados') !== null;
  const elemental = Number.parseInt(texto(form, 'corteElemental'), 10);
  const adecuado = Number.parseInt(texto(form, 'corteAdecuado'), 10);

  if (!Number.isFinite(elemental) || !Number.isFinite(adecuado)) {
    return volver(request, '/admin?error=datos');
  }
  if (elemental < 0 || adecuado > 100 || elemental >= adecuado) {
    return volver(request, '/admin?error=cortes');
  }

  try {
    await prisma.configuracionColegio.upsert({
      where: { colegioId: sesion.colegioId },
      update: {
        estudiantesVenResultados: activo,
        corteElemental: elemental,
        corteAdecuado: adecuado,
      },
      create: {
        colegioId: sesion.colegioId,
        estudiantesVenResultados: activo,
        corteElemental: elemental,
        corteAdecuado: adecuado,
      },
    });
    return volver(request, '/admin?ok=configuracion');
  } catch (error) {
    console.error('configuracion', error);
    return volver(request, '/admin?error=interno');
  }
}
