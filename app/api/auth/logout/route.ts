import { NextResponse } from 'next/server';
import { borrarSesion } from '@/lib/auth';

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

export async function POST(request: Request) {
  await borrarSesion();
  return NextResponse.redirect(new URL('/login', origen(request)), 303);
}
