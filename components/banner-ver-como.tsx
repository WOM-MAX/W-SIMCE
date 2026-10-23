import { sesionReal } from '@/lib/auth';
import { leerVerComo } from '@/lib/ver-como';

// Aviso permanente mientras dura el modo "ver como". Deja claro quién mira y
// cómo volver, para que nunca haya duda de en qué sesión se está.
export async function BannerVerComo() {
  const real = await sesionReal();
  if (!real || real.tipo !== 'usuario' || real.rol !== 'ADMIN') return null;

  const suplente = await leerVerComo();
  if (!suplente) return null;

  const rol = suplente.tipo === 'usuario' ? suplente.rol : 'ESTUDIANTE';

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-amber-300 bg-amber-50 px-4 py-2 text-xs text-amber-900">
      <span className="font-semibold">Estás viendo como {suplente.nombre}</span>
      <span className="rounded-full bg-white/80 px-2 py-0.5 font-medium">{rol}</span>
      <span className="text-amber-800">Solo lectura: no puedes modificar nada en este modo.</span>
      <form action="/api/admin/ver-como/salir" method="post" className="ml-auto">
        <button className="pulsable rounded-lg border border-amber-400 bg-white px-2.5 py-1 font-semibold text-amber-900 hover:bg-amber-100">
          Volver a administrador
        </button>
      </form>
    </div>
  );
}
