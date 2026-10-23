import { NextResponse } from 'next/server';
import { sesionActual } from '@/lib/auth';
import { aniosDe, COOKIE_ANIO } from '@/lib/anio';

// Cambia el año escolar que se está mirando. Se guarda en una cookie y se valida
// contra los años del colegio: nunca se acepta un id ajeno.
export async function POST(request: Request) {
  const sesion = await sesionActual();
  if (!sesion || sesion.tipo !== 'usuario') {
    return NextResponse.redirect(new URL('/login', request.url), 303);
  }

  const form = await request.formData();
  const pedido = String(form.get('anioId') ?? '').trim();

  const anios = await aniosDe(sesion);
  const elegido = anios.find((a) => a.id === pedido) ?? anios.find((a) => a.estado === 'activo');

  const destino = new URL('/panel', request.url);
  const respuesta = NextResponse.redirect(destino, 303);
  if (elegido) {
    respuesta.cookies.set(COOKIE_ANIO, elegido.id, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 60,
    });
  }
  return respuesta;
}
