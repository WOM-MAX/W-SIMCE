import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { guardarSesion, verificarClave, type RolUsuario } from '@/lib/auth';
import { demasiadosFallos, registrarEvento } from '@/lib/eventos';

// Login por formulario nativo: funciona sin JavaScript y se puede probar con curl.
// Redirige siempre: éxito a la página del rol, error a /login?error=<codigo>.

// Detras de un proxy, request.url apunta al host interno del contenedor.
// Se reconstruye el origen publico desde las cabeceras reenviadas.
function origen(request: Request): string {
  const configurado = process.env['PUBLIC_BASE_URL'];
  if (configurado) return configurado.replace(/\/+$/, '');
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host');
  const proto =
    request.headers.get('x-forwarded-proto') ??
    (process.env.NODE_ENV === 'production' ? 'https' : 'http');
  if (host) return `${proto}://${host}`;
  return new URL(request.url).origin;
}

function volver(request: Request, ruta: string, estado = 303): NextResponse {
  return NextResponse.redirect(new URL(ruta, origen(request)), estado);
}

function texto(form: FormData, campo: string): string {
  const valor = form.get(campo);
  return typeof valor === 'string' ? valor.trim() : '';
}

export async function POST(request: Request) {
  const form = await request.formData();

  // Un solo formulario: el dato con "@" es cuenta del equipo; sin "@" es código de estudiante.
  // Los campos antiguos (tipo/email/clave/codigo/pin) se siguen aceptando.
  const identificador = texto(form, 'identificador');
  const secreto = texto(form, 'secreto');
  const tipo = identificador
    ? identificador.includes('@')
      ? 'docente'
      : 'estudiante'
    : texto(form, 'tipo') || 'docente';

  try {
    if (tipo === 'estudiante') {
      const codigo = (identificador || texto(form, 'codigo')).toUpperCase();
      const pin = secreto || texto(form, 'pin');
      if (!codigo || !pin) return volver(request, '/login?error=datos');

      // Con un PIN de cuatro digitos, el freno importa mas que la politica.
      const identidad = `estudiante:${codigo}`;
      if ((await demasiadosFallos(identidad)) >= 5) {
        return volver(request, '/login?error=bloqueado');
      }

      const candidatos = await prisma.estudiante.findMany({
        where: { codigoAcceso: codigo },
        include: { matriculas: { where: { estado: 'ACTIVA' }, select: { cursoId: true } } },
      });

      const estudiante = candidatos.find((c) => verificarClave(pin, c.pinHash));
      if (!estudiante) {
        await registrarEvento({
          entidad: 'sesion',
          entidadId: identidad,
          accion: 'login_fallido',
          payload: { tipo: 'estudiante' },
        });
        return volver(request, '/login?error=credenciales');
      }

      await registrarEvento({
        colegioId: estudiante.colegioId,
        actorId: estudiante.id,
        entidad: 'sesion',
        entidadId: identidad,
        accion: 'login',
        payload: { tipo: 'estudiante' },
      });

      await guardarSesion({
        tipo: 'estudiante',
        id: estudiante.id,
        colegioId: estudiante.colegioId,
        nombre: `${estudiante.nombres} ${estudiante.apellidos}`.trim(),
        cursoId: estudiante.matriculas[0]?.cursoId ?? null,
      });

      return volver(request, '/alumno');
    }

    const email = (identificador || texto(form, 'email')).toLowerCase();
    const clave = secreto || texto(form, 'clave');
    if (!email || !clave) return volver(request, '/login?error=datos');

    const identidad = `usuario:${email}`;
    if ((await demasiadosFallos(identidad)) >= 5) {
      return volver(request, '/login?error=bloqueado');
    }

    const usuario = await prisma.usuario.findUnique({
      where: { email },
      include: { membresias: true },
    });

    if (!usuario || !usuario.activo || !verificarClave(clave, usuario.hashPassword)) {
      await registrarEvento({
        entidad: 'sesion',
        entidadId: identidad,
        accion: 'login_fallido',
        payload: { tipo: 'docente' },
      });
      return volver(request, '/login?error=credenciales');
    }

    await registrarEvento({
      colegioId: usuario.membresias[0]?.colegioId ?? null,
      actorId: usuario.id,
      entidad: 'sesion',
      entidadId: identidad,
      accion: 'login',
      payload: { tipo: 'docente' },
    });

    const membresia = usuario.membresias[0];
    if (!membresia) return volver(request, '/login?error=colegio');

    await guardarSesion({
      tipo: 'usuario',
      id: usuario.id,
      colegioId: membresia.colegioId,
      rol: membresia.rol as RolUsuario,
      nombre: usuario.nombre,
    });

    return volver(request, '/panel');
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : String(error);
    console.error('login', error);
    // Un secreto de sesion ausente es configuracion, no un fallo del usuario.
    const codigo = mensaje.includes('SESSION_SECRET') ? 'configuracion' : 'interno';
    return volver(request, `/login?error=${codigo}`);
  }
}
