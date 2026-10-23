import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { esTecnico, hashClave, sesionActual, type RolUsuario } from '@/lib/auth';
import { origen, texto, volver } from '@/lib/http';
import { claveProvisional, crearInvitacion, enlaceActivacion } from '@/lib/invitacion';
import { enviarInvitacion } from '@/lib/correo';

// Alta de un funcionario: no se fija una clave a mano. Se crea la cuenta con
// una clave aleatoria que nadie conoce y se envía una invitación para que la
// persona defina la suya. Si el correo no está configurado, se muestra el
// enlace en pantalla para entregarlo por otra vía.

const ROLES: RolUsuario[] = ['ADMIN', 'DIRECCION', 'UTP', 'DOCENTE'];

function escapar(valor: string): string {
  return valor
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function pantallaEnlace(datos: {
  nombre: string;
  email: string;
  enlace: string;
  motivo?: string;
}): NextResponse {
  const nota =
    datos.motivo === 'sin-proveedor'
      ? 'El envío de correo no está configurado en este servidor. Entrega el enlace por otra vía.'
      : 'El correo no se pudo enviar en este momento.';
  const html = `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Invitación creada · W-SIMCE</title>
  </head>
  <body style="margin:0;padding:40px 20px;background:#f4f5f9;font-family:Arial,Helvetica,sans-serif;color:#1f2a5a">
    <main style="max-width:620px;margin:0 auto;background:#fff;border-radius:16px;padding:28px">
      <h1 style="margin:0 0 6px;font-size:20px">Invitación creada</h1>
      <p style="margin:0 0 16px;font-size:14px;color:#6b7280">
        ${escapar(datos.nombre)} · ${escapar(datos.email)}
      </p>
      <p style="margin:0 0 18px;font-size:14px;line-height:1.6">
        ${escapar(nota)} Entrega este enlace a la persona para que defina su clave:
      </p>
      <p style="margin:0 0 22px;padding:12px;background:#f4f5f9;border-radius:10px;word-break:break-all;font-family:Consolas,monospace;font-size:13px">
        ${escapar(datos.enlace)}
      </p>
      <p style="margin:0 0 22px;font-size:13px;color:#6b7280;line-height:1.6">
        El enlace sirve una sola vez y vence en siete días.
      </p>
      <a href="/admin" style="display:inline-block;background:#1f2a5a;color:#fff;text-decoration:none;padding:10px 18px;border-radius:10px;font-size:14px">
        Volver a Administración
      </a>
    </main>
  </body>
</html>`;
  return new NextResponse(html, {
    status: 200,
    headers: { 'content-type': 'text/html; charset=utf-8' },
  });
}

export async function POST(request: Request) {
  const sesion = await sesionActual();
  if (!sesion || sesion.tipo !== 'usuario') return volver(request, '/login');
  if (!esTecnico(sesion)) return volver(request, '/admin?error=permiso');

  const form = await request.formData();
  const nombre = texto(form, 'nombre');
  const email = texto(form, 'email').toLowerCase();
  const rol = (texto(form, 'rol') || 'DOCENTE') as RolUsuario;

  if (!nombre || !email) return volver(request, '/admin?error=datos');
  if (!ROLES.includes(rol)) return volver(request, '/admin?error=datos');

  const { token, tokenHash, expira } = crearInvitacion();

  try {
    await prisma.usuario.create({
      data: {
        nombre,
        email,
        hashPassword: hashClave(claveProvisional()),
        tokenInvitacion: tokenHash,
        invitacionExpira: expira,
        membresias: { create: { colegioId: sesion.colegioId, rol } },
      },
    });

    const colegio = await prisma.colegio.findUnique({
      where: { id: sesion.colegioId },
      select: { nombre: true },
    });

    const enlace = enlaceActivacion(origen(request), token);
    const envio = await enviarInvitacion({
      para: email,
      nombre,
      colegio: colegio?.nombre ?? 'el colegio',
      rol,
      enlace,
    });

    if (!envio.enviado) {
      return pantallaEnlace({ nombre, email, enlace, motivo: envio.motivo });
    }

    return volver(request, '/admin?ok=invitado');
  } catch (error) {
    console.error('crear usuario', error);
    const codigo = (error as { code?: string }).code;
    return volver(request, codigo === 'P2002' ? '/admin?error=email' : '/admin?error=interno');
  }
}
