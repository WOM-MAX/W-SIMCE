import { prisma } from '@/lib/prisma';
import { esTecnico, sesionReal, type RolUsuario, type Sesion } from '@/lib/auth';
import { guardarVerComo } from '@/lib/ver-como';
import { registrarEvento } from '@/lib/eventos';
import { texto, volver } from '@/lib/http';

// Entrar en modo "ver como": solo el administrador técnico, solo personas de su
// colegio. La sesión real no se modifica.
export async function POST(request: Request) {
  const real = await sesionReal();
  if (!real || real.tipo !== 'usuario') return volver(request, '/login');
  if (!esTecnico(real)) return volver(request, '/panel');

  const form = await request.formData();
  const usuarioId = texto(form, 'usuarioId');
  if (!usuarioId) return volver(request, '/admin?error=datos');

  const objetivo = await prisma.usuario.findFirst({
    where: {
      id: usuarioId,
      activo: true,
      membresias: { some: { colegioId: real.colegioId } },
    },
    include: { membresias: { where: { colegioId: real.colegioId } } },
  });

  const membresia = objetivo?.membresias[0];
  if (!objetivo || !membresia) return volver(request, '/admin?error=datos');

  const suplente: Sesion = {
    tipo: 'usuario',
    id: objetivo.id,
    colegioId: membresia.colegioId,
    rol: membresia.rol as RolUsuario,
    nombre: objetivo.nombre,
  };

  await guardarVerComo(suplente);

  await registrarEvento({
    colegioId: real.colegioId,
    actorId: real.id,
    entidad: 'sesion',
    entidadId: `ver_como:${objetivo.id}`,
    accion: 'ver_como',
    payload: { rol: membresia.rol },
  });

  return volver(request, '/panel');
}
