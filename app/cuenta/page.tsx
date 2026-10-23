import { redirect } from 'next/navigation';
import { sesionReal } from '@/lib/auth';
import { Panel } from '@/components/panel';
import { Cabecera } from '@/components/ui-panel';

export const dynamic = 'force-dynamic';

const CLASE_INPUT =
  'mt-1 w-full rounded-lg border border-borde bg-white px-3 py-2 text-sm text-marca outline-none focus:border-acento';

const ERRORES: Record<string, string> = {
  datos: 'Escribe tu clave actual y la nueva.',
  corta: 'La clave nueva debe tener al menos 8 caracteres.',
  distinta: 'Las dos claves nuevas no coinciden.',
  actual: 'Tu clave actual no es correcta.',
  modo: 'No puedes cambiar claves mientras usas "ver como". Vuelve a tu cuenta primero.',
  interno: 'No se pudo guardar. Inténtalo de nuevo.',
};

export default async function Cuenta({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const sesion = await sesionReal();
  if (!sesion) redirect('/login');

  const { ok, error } = await searchParams;
  const aviso = ok === 'guardada' ? 'Tu clave quedó actualizada.' : null;
  const fallo = error ? (ERRORES[error] ?? ERRORES.interno) : null;

  if (sesion.tipo === 'estudiante') redirect('/alumno');

  return (
    <Panel nombre={sesion.nombre} rol={sesion.rol} activo="/cuenta">
      <div className="mx-auto max-w-2xl space-y-6 px-6 py-8">
        <Cabecera titulo="Mi cuenta" detalle={sesion.nombre} />

        {aviso ? (
          <p className="rounded-xl bg-acento-suave px-4 py-3 text-sm text-marca">{aviso}</p>
        ) : null}
        {fallo ? (
          <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{fallo}</p>
        ) : null}

        <section className="rounded-2xl border border-borde bg-white p-6">
          <h2 className="text-base font-semibold text-marca">Cambiar mi clave</h2>
          <p className="mt-1 mb-4 text-xs text-tenue">
            Necesitas tu clave actual. El administrador técnico también puede restablecerla, pero
            este camino no depende de nadie.
          </p>
          <form action="/api/cuenta" method="post" className="space-y-3">
            <label className="block text-xs font-medium uppercase tracking-wide text-tenue">
              Clave actual
              <input
                name="actual"
                type="password"
                required
                autoComplete="current-password"
                className={CLASE_INPUT}
              />
            </label>
            <label className="block text-xs font-medium uppercase tracking-wide text-tenue">
              Clave nueva
              <input
                name="nueva"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                className={CLASE_INPUT}
              />
            </label>
            <label className="block text-xs font-medium uppercase tracking-wide text-tenue">
              Repite la clave nueva
              <input
                name="repetir"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                className={CLASE_INPUT}
              />
            </label>
            <button className="pulsable rounded-lg bg-marca px-4 py-2 text-sm font-medium text-white hover:bg-marca-oscuro">
              Guardar clave
            </button>
          </form>
        </section>
      </div>
    </Panel>
  );
}
