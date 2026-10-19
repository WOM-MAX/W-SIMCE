import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { guardarSesion, verificarClave, type RolUsuario } from '@/lib/auth';

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
  const tipo = texto(form, 'tipo') || 'docente';

  try {
    if (tipo === 'estudiante') {
      const codigo = texto(form, 'codigo').toUpperCase();
      const pin = texto(form, 'pin');
      if (!codigo || !pin) return volver(request, '/login?error=datos');

      const candidatos = await prisma.estudiante.findMany({
        where: { codigoAcceso: codigo },
        include: { matriculas: { where: { estado: 'ACTIVA' }, select: { cursoId: true } } },
      });

      const estudiante = candidatos.find((c) => verificarClave(pin, c.pinHash));
      if (!estudiante) return volver(request, '/login?error=credenciales');

      await guardarSesion({
        tipo: 'estudiante',
        id: estudiante.id,
        colegioId: estudiante.colegioId,
        nombre: `${estudiante.nombres} ${estudiante.apellidos}`.trim(),
        cursoId: estudiante.matriculas[0]?.cursoId ?? null,
      });

      return volver(request, '/alumno');
    }

    const email = texto(form, 'email').toLowerCase();
    const clave = texto(form, 'clave');
    if (!email || !clave) return volver(request, '/login?error=datos');

    const usuario = await prisma.usuario.findUnique({
      where: { email },
      include: { membresias: true },
    });

    if (!usuario || !usuario.activo || !verificarClave(clave, usuario.hashPassword)) {
      return volver(request, '/login?error=credenciales');
    }

    const membresia = usuario.membresias[0];
    if (!membresia) return volver(request, '/login?error=colegio');

    await guardarSesion({
      tipo: 'usuario',
      id: usuario.id,
      colegioId: membresia.colegioId,
      rol: membresia.rol as RolUsuario,
      nombre: usuario.nombre,
    });

    return volver(request, '/');
  } catch (error) {
    console.error('login', error);
    return volver(request, '/login?error=interno');
  }
}
