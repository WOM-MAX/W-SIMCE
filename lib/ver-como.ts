// "Ver como": el administrador técnico mira la plataforma con los ojos de otra
// persona, sin escribir en su nombre. La cookie guarda una sesión firmada con
// caducidad corta; la sesión real del administrador no se toca, así que volver
// es solo borrar esta cookie.

import crypto from 'node:crypto';
import { cookies } from 'next/headers';
import type { Sesion } from '@/lib/auth';

const COOKIE = 'wsimce_ver_como';
const DURACION_MS = 60 * 60 * 1000;

function secreto(): string {
  const valor = process.env['SESSION_SECRET'];
  if (!valor || valor.length < 32) throw new Error('Falta SESSION_SECRET o es demasiado corto.');
  return valor;
}

function firmar(cuerpo: string): string {
  return crypto.createHmac('sha256', secreto()).update(cuerpo).digest('base64url');
}

export async function guardarVerComo(sesion: Sesion): Promise<void> {
  const cuerpo = Buffer.from(
    JSON.stringify({ s: sesion, e: Date.now() + DURACION_MS }),
    'utf8',
  ).toString('base64url');

  const store = await cookies();
  store.set(COOKIE, `${cuerpo}.${firmar(cuerpo)}`, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60,
  });
}

export async function leerVerComo(): Promise<Sesion | null> {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (!token) return null;

  const partes = token.split('.');
  if (partes.length !== 2) return null;

  const [cuerpo, mac] = partes;
  if (mac !== firmar(cuerpo)) return null;

  try {
    const datos = JSON.parse(Buffer.from(cuerpo, 'base64url').toString('utf8')) as {
      s: Sesion;
      e: number;
    };
    if (!datos?.s || typeof datos.e !== 'number' || datos.e < Date.now()) return null;
    return datos.s;
  } catch {
    return null;
  }
}

export async function borrarVerComo(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE);
}

export async function hayVerComo(): Promise<boolean> {
  return (await leerVerComo()) !== null;
}
