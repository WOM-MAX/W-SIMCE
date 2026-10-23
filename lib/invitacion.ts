import crypto from 'node:crypto';

// Invitación de un solo uso: el token viaja por correo y en la base queda solo
// su hash. Así, una copia de la base no permite activar cuentas ajenas.
export const DIAS_INVITACION = 7;

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function crearInvitacion(): { token: string; tokenHash: string; expira: Date } {
  const token = crypto.randomBytes(32).toString('base64url');
  return {
    token,
    tokenHash: hashToken(token),
    expira: new Date(Date.now() + DIAS_INVITACION * 24 * 60 * 60 * 1000),
  };
}

export function enlaceActivacion(base: string, token: string): string {
  return `${base.replace(/\/+$/, '')}/activar?token=${encodeURIComponent(token)}`;
}

// Clave aleatoria que nadie conoce: la cuenta queda inutilizable hasta que la
// persona define la suya. Evita dejar cuentas con una clave por defecto.
export function claveProvisional(): string {
  return crypto.randomBytes(32).toString('base64url');
}
