import { prisma } from '@/lib/prisma';
import { hashClave, sesionReal, verificarClave } from '@/lib/auth';
import { hayVerComo } from '@/lib/ver-como';
import { registrarEvento } from '@/lib/eventos';
import { texto, volver } from '@/lib/http';

// Cambio de clave propio. Usa la sesión real: nunca la suplantada.
export async function POST(request: Request) {
  const real = await sesionReal();
  if (!real) return volver(request, '/login');
  if (real.tipo !== 'usuario') return volver(request, '/alumno');

  if (await hayVerComo()) return volver(request, '/cuenta?error=modo');

  const form = await request.formData();
  const actual = texto(form, 'actual');
  const nueva = texto(form, 'nueva');
  const repetir = texto(form, 'repetir');

  if (!actual || !nueva) return volver(request, '/cuenta?error=datos');
  if (nueva.length < 8) return volver(request, '/cuenta?error=corta');
  if (nueva !== repetir) return volver(request, '/cuenta?error=distinta');

  try {
    const usuario = await prisma.usuario.findUnique({
      where: { id: real.id },
      select: { hashPassword: true },
    });
    if (!usuario || !verificarClave(actual, usuario.hashPassword)) {
      return volver(request, '/cuenta?error=actual');
    }

    await prisma.usuario.update({
      where: { id: real.id },
      data: { hashPassword: hashClave(nueva) },
    });

    await registrarEvento({
      colegioId: real.colegioId,
      actorId: real.id,
      entidad: 'usuario',
      entidadId: real.id,
      accion: 'clave_propia',
      payload: { origen: 'mi_cuenta' },
    });

    return volver(request, '/cuenta?ok=guardada');
  } catch (error) {
    console.error('cambiar clave propia', error);
    return volver(request, '/cuenta?error=interno');
  }
}
