import { prisma } from '@/lib/prisma';
import { hashClave } from '@/lib/auth';
import { texto, volver } from '@/lib/http';
import { hashToken } from '@/lib/invitacion';

// Activación de la invitación: valida el token, guarda la clave elegida y
// limpia el token para que el enlace no sirva dos veces.

const LARGO_MINIMO = 8;

export async function POST(request: Request) {
  const form = await request.formData();
  const token = texto(form, 'token');
  const clave = texto(form, 'clave');
  const repetir = texto(form, 'repetir');

  if (!token) return volver(request, '/login?error=datos');

  const deVuelta = (codigo: string) =>
    volver(request, `/activar?token=${encodeURIComponent(token)}&error=${codigo}`);

  if (!clave || !repetir) return deVuelta('datos');
  if (clave.length < LARGO_MINIMO) return deVuelta('corta');
  if (clave !== repetir) return deVuelta('distinta');

  try {
    const invitado = await prisma.usuario.findUnique({
      where: { tokenInvitacion: hashToken(token) },
      select: { id: true, invitacionExpira: true },
    });

    if (!invitado?.invitacionExpira || invitado.invitacionExpira.getTime() <= Date.now()) {
      return deVuelta('vencido');
    }

    await prisma.usuario.update({
      where: { id: invitado.id },
      data: {
        hashPassword: hashClave(clave),
        tokenInvitacion: null,
        invitacionExpira: null,
      },
    });

    return volver(request, '/login?ok=activado');
  } catch (error) {
    console.error('activar cuenta', error);
    return deVuelta('interno');
  }
}
