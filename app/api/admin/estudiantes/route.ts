import { prisma } from '@/lib/prisma';
import { hashClave, sesionAdmin } from '@/lib/auth';
import { texto, volver } from '@/lib/http';

// Genera el siguiente código libre con el prefijo del nivel, por ejemplo W4B-21.
async function siguienteCodigo(colegioId: string, prefijo: string): Promise<string> {
  const existentes = await prisma.estudiante.findMany({
    where: { colegioId, codigoAcceso: { startsWith: prefijo } },
    select: { codigoAcceso: true },
  });

  let mayor = 0;
  for (const e of existentes) {
    const n = Number.parseInt(e.codigoAcceso.slice(prefijo.length), 10);
    if (Number.isFinite(n) && n > mayor) mayor = n;
  }

  let siguiente = mayor + 1;
  const usados = new Set(existentes.map((e) => e.codigoAcceso));
  let codigo = `${prefijo}${String(siguiente).padStart(2, '0')}`;
  while (usados.has(codigo)) {
    siguiente += 1;
    codigo = `${prefijo}${String(siguiente).padStart(2, '0')}`;
  }
  return codigo;
}

export async function POST(request: Request) {
  const sesion = await sesionAdmin();
  if (!sesion) return volver(request, '/');

  const form = await request.formData();
  const nombres = texto(form, 'nombres');
  const apellidos = texto(form, 'apellidos');
  const cursoId = texto(form, 'cursoId');
  const pin = texto(form, 'pin');

  if (!nombres || !apellidos || !cursoId || pin.length < 4) {
    return volver(request, '/admin?error=datos');
  }

  try {
    const curso = await prisma.curso.findFirst({
      where: { id: cursoId, colegioId: sesion.colegioId },
      include: { nivel: true },
    });
    if (!curso) return volver(request, '/admin?error=curso');

    const codigoAcceso = await siguienteCodigo(sesion.colegioId, `W${curso.nivel.codigo}-`);

    const estudiante = await prisma.estudiante.create({
      data: {
        colegioId: sesion.colegioId,
        nombres,
        apellidos,
        codigoAcceso,
        pinHash: hashClave(pin),
      },
    });

    await prisma.matricula.create({ data: { estudianteId: estudiante.id, cursoId: curso.id } });

    return volver(request, '/admin?ok=estudiante');
  } catch (error) {
    console.error('crear estudiante', error);
    return volver(request, '/admin?error=interno');
  }
}
