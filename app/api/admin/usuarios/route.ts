import { prisma } from '@/lib/prisma';
import { hashClave, sesionAdmin, type RolUsuario } from '@/lib/auth';
import { texto, volver } from '@/lib/http';

export async function POST(request: Request) {
  const sesion = await sesionAdmin();
  if (!sesion) return volver(request, '/');

  const form = await request.formData();
  const nombre = texto(form, 'nombre');
  const email = texto(form, 'email').toLowerCase();
  const clave = texto(form, 'clave');
  const rol = (texto(form, 'rol') || 'DOCENTE') as RolUsuario;

  if (!nombre || !email || clave.length < 4) return volver(request, '/admin?error=datos');
  if (!['ADMIN', 'UTP', 'DOCENTE'].includes(rol)) return volver(request, '/admin?error=datos');

  try {
    const usuario = await prisma.usuario.create({
      data: { nombre, email, hashPassword: hashClave(clave) },
    });
    await prisma.membresia.create({
      data: { usuarioId: usuario.id, colegioId: sesion.colegioId, rol },
    });
    return volver(request, '/admin?ok=usuario');
  } catch (error) {
    console.error('crear usuario', error);
    const codigo = (error as { code?: string }).code;
    return volver(request, codigo === 'P2002' ? '/admin?error=email' : '/admin?error=interno');
  }
}
