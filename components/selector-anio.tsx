import { sesionActual } from '@/lib/auth';
import { anioActual, aniosDe } from '@/lib/anio';

// Selector del año escolar. Vive en el armazón del panel, así que aparece en
// todas las pantallas internas.
export async function SelectorAnio() {
  const sesion = await sesionActual();
  if (!sesion || sesion.tipo !== 'usuario') return null;

  const [anios, actual] = await Promise.all([aniosDe(sesion), anioActual(sesion)]);
  if (anios.length === 0) return null;

  return (
    <form action="/api/anio" method="post" className="flex items-center gap-1.5">
      <label htmlFor="selector-anio" className="sr-only">
        Año escolar
      </label>
      <select
        id="selector-anio"
        name="anioId"
        defaultValue={actual?.id ?? ''}
        className="w-full rounded-lg border border-white/15 bg-white/[0.08] px-2 py-1.5 text-xs text-white outline-none focus:border-acento"
      >
        {anios.map((a) => (
          <option key={a.id} value={a.id} className="text-marca">
            {a.anio}
            {a.estado === 'cerrado'
              ? ' · cerrado'
              : a.estado === 'planificacion'
                ? ' · planificación'
                : ''}
          </option>
        ))}
      </select>
      <button className="pulsable shrink-0 rounded-lg border border-white/20 px-2 py-1.5 text-[11px] text-white/80 transition hover:bg-white/10 hover:text-white">
        Ir
      </button>
    </form>
  );
}
