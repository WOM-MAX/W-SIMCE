import { esTecnico, sesionReal } from '@/lib/auth';
import { borrarVerComo } from '@/lib/ver-como';
import { volver } from '@/lib/http';

// Salir de "ver como": se borra la cookie de suplantación y vuelve la sesión real.
export async function POST(request: Request) {
  const real = await sesionReal();
  if (!real || real.tipo !== 'usuario') return volver(request, '/login');
  if (!esTecnico(real)) return volver(request, '/panel');

  await borrarVerComo();
  return volver(request, '/admin?ok=ver-como-fin');
}
