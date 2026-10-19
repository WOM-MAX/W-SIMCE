import crypto from 'node:crypto';
import { cookies } from 'next/headers';

// Sesión sin dependencias: cookie firmada con HMAC-SHA256.
// El formato del hash de claves lo fija prisma/seed.mjs: scrypt$sal$hash(64 bytes hex).

const COOKIE = 'wsimce_sesion';
const DURACION_SEG = 60 * 60 * 12;

export type RolUsuario = 'ADMIN' | 'UTP' | 'DOCENTE';

export type Sesion =
  | {
      tipo: 'usuario';
      id: string;
      colegioId: string;
      rol: RolUsuario;
      nombre: string;
    }
  | {
      tipo: 'estudiante';
      id: string;
      colegioId: string;
      nombre: string;
      cursoId: string | null;
    };

function secreto(): string {
  const valor = process.env['SESSION_SECRET'];
  if (!valor || valor.length < 32) {
    throw new Error('Falta SESSION_SECRET en el entorno, o tiene menos de 32 caracteres.');
  }
  return valor;
}

function firmar(cuerpo: string): string {
  return crypto.createHmac('sha256', secreto()).update(cuerpo).digest('base64url');
}

function compararSeguro(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export function firmarSesion(datos: Sesion): string {
  const cuerpo = Buffer.from(JSON.stringify(datos), 'utf8').toString('base64url');
  return `${cuerpo}.${firmar(cuerpo)}`;
}

export function verificarSesion(token: string | undefined | null): Sesion | null {
  if (!token) return null;
  const partes = token.split('.');
  if (partes.length !== 2) return null;
  const [cuerpo, mac] = partes;
  if (!compararSeguro(mac, firmar(cuerpo))) return null;
  try {
    return JSON.parse(Buffer.from(cuerpo, 'base64url').toString('utf8')) as Sesion;
  } catch {
    return null;
  }
}

// Verifica una clave o PIN contra el hash guardado por el seed.
export function verificarClave(texto: string, guardado: string): boolean {
  const partes = guardado.split('$');
  if (partes.length !== 3 || partes[0] !== 'scrypt') return false;
  const sal = partes[1];
  const esperado = partes[2];
  const calculado = crypto.scryptSync(texto, sal, 64).toString('hex');
  return compararSeguro(calculado, esperado);
}

export function hashClave(texto: string): string {
  const sal = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(texto, sal, 64).toString('hex');
  return `scrypt$${sal}$${hash}`;
}

export async function guardarSesion(datos: Sesion): Promise<void> {
  const store = await cookies();
  store.set(COOKIE, firmarSesion(datos), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: DURACION_SEG,
  });
}

export async function borrarSesion(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE);
}

export async function sesionActual(): Promise<Sesion | null> {
  const store = await cookies();
  return verificarSesion(store.get(COOKIE)?.value);
}

// Para páginas: si no hay sesión, manda al login.
export async function exigirSesion(): Promise<Sesion> {
  const sesion = await sesionActual();
  if (!sesion) throw new Error('SIN_SESION');
  return sesion;
}

// Administración: solo ADMIN y UTP de un colegio.
export async function sesionAdmin(): Promise<Extract<Sesion, { tipo: 'usuario' }> | null> {
  const sesion = await sesionActual();
  if (!sesion || sesion.tipo !== 'usuario') return null;
  if (sesion.rol !== 'ADMIN' && sesion.rol !== 'UTP') return null;
  return sesion;
}
