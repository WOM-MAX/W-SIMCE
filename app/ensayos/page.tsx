import { redirect } from 'next/navigation';
import { sesionActual } from '@/lib/auth';
import { Panel } from '@/components/panel';
import { ensayosDelColegio } from '@/lib/ensayos';

export const dynamic = 'force-dynamic';

export default async function Ensayos({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string; curso?: string }>;
}) {
  const sesion = await sesionActual();
  if (!sesion) redirect('/login');
  if (sesion.tipo !== 'usuario') redirect('/alumno');

  const { ok, error, curso } = await searchParams;
  const ensayos = await ensayosDelColegio(sesion.colegioId);

  return (
    <Panel nombre={sesion.nombre} rol={sesion.rol} activo="/ensayos">
      <div className="mx-auto max-w-5xl space-y-6 px-6 py-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-marca">Ensayos</h1>
            <p className="text-xs text-tenue">
              Los generados quedan en borrador hasta que los asignes a un curso.
            </p>
          </div>
          <a
            href="/ensayos/nuevo"
            className="rounded-lg bg-marca px-4 py-2 text-sm font-medium text-white hover:bg-marca-oscuro"
          >
            Generar ensayo
          </a>
        </div>

        {ok === 'asignado' ? (
          <p className="rounded-xl bg-acento-suave px-4 py-3 text-sm text-marca">
            Evaluación publicada y asignada a {curso ?? 'el curso'}.
          </p>
        ) : null}

        {error ? (
          <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error === 'ensayo'
              ? 'Esa evaluación no existe o no es de tu colegio.'
              : 'No se pudo completar la operación.'}
          </p>
        ) : null}

        <section className="rounded-2xl border border-borde bg-white">
          {ensayos.length === 0 ? (
            <p className="px-5 py-8 text-sm text-tenue">
              Todavía no hay ensayos generados en este colegio.
            </p>
          ) : (
            <ul className="divide-y divide-borde">
              {ensayos.map((e) => (
                <li key={e.id} className="flex flex-wrap items-center gap-3 px-5 py-4">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-800">{e.titulo}</p>
                    <p className="text-xs text-tenue">
                      {e.nivel.nombre} · {e.asignatura.nombre} ·{' '}
                      {e.tiempoMin === 0 ? 'sin límite' : `${e.tiempoMin} min`} ·{' '}
                      {e._count.items} preguntas
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      e.estado === 'PUBLICADO'
                        ? 'bg-acento-suave text-marca'
                        : 'bg-borde text-tenue'
                    }`}
                  >
                    {e.estado === 'PUBLICADO' ? 'Publicado' : 'Borrador'}
                  </span>
                  <span className="rounded-full bg-fondo px-2.5 py-1 text-xs text-tenue">
                    {e._count.asignaciones} asignaciones
                  </span>
                  <a
                    href={`/ensayos/${e.id}/asignar`}
                    className="rounded-lg border border-borde px-3 py-1.5 text-xs text-slate-700 hover:bg-fondo"
                  >
                    Asignar
                  </a>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </Panel>
  );
}
