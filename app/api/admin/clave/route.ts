import { prisma } from '@/lib/prisma';
import { hashClave, sesionAdmin } from '@/lib/auth';
import { texto, volver } from '@/lib/http';

export async function POST(request: Request) {
  const sesion = await sesionAdmin();
  if (!sesion) return volver(request, '/');

  const form = await request.formData();
  const tipo = texto(form, 'tipo');
  const id = texto(form, 'id');
  const valor = texto(form, 'valor');

  if (!id || valor.length < 4) return volver(request, '/admin?error=clave');

  try {
    if (tipo === 'usuario') {
      const usuario = await prisma.usuario.findFirst({
        where: { id, membresias: { some: { colegioId: sesion.colegioId } } },
        select: { id: true },
      });
      if (!usuario) return volver(request, '/admin?error=datos');
      await prisma.usuario.update({ where: { id }, data: { hashPassword: hashClave(valor) } });
      return volver(request, '/admin?ok=clave');
    }

    if (tipo === 'estudiante') {
      const estudiante = await prisma.estudiante.findFirst({
        where: { id, colegioId: sesion.colegioId },
        select: { id: true },
      });
      if (!estudiante) return volver(request, '/admin?error=datos');
      await prisma.estudiante.update({ where: { id }, data: { pinHash: hashClave(valor) } });
      return volver(request, '/admin?ok=clave');
    }

    return volver(request, '/admin?error=datos');
  } catch (error) {
    console.error('cambiar clave', error);
    return volver(request, '/admin?error=interno');
  }
}
