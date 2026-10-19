import { NextResponse } from 'next/server';

// Detras de un proxy, request.url apunta al host interno del contenedor.
// Se reconstruye el origen publico desde las cabeceras reenviadas.
export function origen(request: Request): string {
  const configurado = process.env['PUBLIC_BASE_URL'];
  if (configurado) return configurado.replace(/\/+$/, '');
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host');
  const proto =
    request.headers.get('x-forwarded-proto') ??
    (process.env.NODE_ENV === 'production' ? 'https' : 'http');
  if (host) return `${proto}://${host}`;
  return new URL(request.url).origin;
}

export function volver(request: Request, ruta: string, estado = 303): NextResponse {
  return NextResponse.redirect(new URL(ruta, origen(request)), estado);
}

export function texto(form: FormData, campo: string): string {
  const valor = form.get(campo);
  return typeof valor === 'string' ? valor.trim() : '';
}
