import { redirect } from 'next/navigation';
import { sesionActual } from '@/lib/auth';
import { Panel } from '@/components/panel';
import { ensayosDelColegio } from '@/lib/ensayos';
import { Cabecera, EstadoVacio, Tarjeta } from '@/components/ui-panel';
import { EliminarEnsayo } from '@/components/eliminar-ensayo';

export const dynamic = 'force-dynamic';

const AVISOS: Record<string, string> = {
  eliminado: 'Ensayo eliminado.',
  duplicado: 'Ensayo duplicado como borrador.',
  renombrado: 'Nombre actualizado.',
};

const ERRORES: Record<string, string> = {
  ensayo: 'Esa evaluación no existe o no es de tu colegio.',
  'con-asignaciones': 'No se puede eliminar: el ensayo tiene asignaciones a cursos.',
  'titulo-corto': 'El nombre necesita al menos tres caracteres.',
  generico: 'No se pudo completar la operación.',
};

export default async function Ensayos({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string; curso?: string; nombre?: string }>;
}) {
  const sesion = await sesionActual();
  if (!sesion) redirect('/login');
  if (sesion.tipo !== 'usuario') redirect('/alumno');

  const { ok, error, curso, nombre } = await searchParams;
  const ensayos = await ensayosDelColegio(sesion.colegioId);

  const mensajeOk =
    ok === 'asignado'
      ? `Evaluación publicada y asignada a ${curso ?? 'el curso'}.`
      : ok
        ? (AVISOS[ok] ?? null)
        : null;

  const mensajeError = error ? (ERRORES[error] ?? ERRORES.generico) : null;

  return (
    <Panel nombre={sesion.nombre} rol={sesion.rol} activo="/ensayos">
      <div className="mx-auto max-w-5xl space-y-6 px-6 py-8">
        <Cabecera
          titulo="Ensayos"
          detalle="Los generados quedan en borrador hasta que los asignes a un curso."
          accion={
            <a
              href="/ensayos/nuevo"
              className="inline-flex items-center gap-2 rounded-xl bg-acento-boton px-4 py-2.5 text-sm font-medium text-white transition hover:bg-acento-boton-hover focus:outline-none focus-visible:ring-4 focus-visible:ring-acento/25"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Generar ensayo
            </a>
          }
        />

        {mensajeOk ? (
          <p className="rounded-xl border border-teal/30 bg-teal-suave px-4 py-3 text-sm text-teal-texto">
            {mensajeOk}
            {nombre ? ` «${nombre}»` : ''}
          </p>
        ) : null}

        {mensajeError ? (
          <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {mensajeError}
          </p>
        ) : null}

        <Tarjeta>
          {ensayos.length === 0 ? (
            <EstadoVacio
              titulo="Todavía no hay ensayos"
              detalle="Un ensayo nace del banco de ítems: eliges nivel, asignatura y cantidad de preguntas, y queda en borrador hasta asignarlo a un curso."
              accion={
                <a
                  href="/ensayos/nuevo"
                  className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-acento-boton-hover transition hover:underline"
                >
                  Generar el primero
                  <span aria-hidden="true">→</span>
                </a>
              }
            />
          ) : (
            <ul className="divide-y divide-borde">
              {ensayos.map((e) => {
                const asignado = e._count.asignaciones > 0;
                return (
                  <li key={e.id} className="px-5 py-4 transition-colors hover:bg-fondo/50">
                    <div className="flex flex-wrap items-start gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-[14px] font-medium text-marca">{e.titulo}</p>
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                              e.estado === 'PUBLICADO'
                                ? 'bg-teal-suave text-teal-texto'
                                : 'bg-fondo text-tenue'
                            }`}
                          >
                            <span
                              aria-hidden="true"
                              className={`h-1.5 w-1.5 rounded-full ${
                                e.estado === 'PUBLICADO' ? 'bg-teal' : 'bg-tenue/40'
                              }`}
                            />
                            {e.estado === 'PUBLICADO' ? 'Publicado' : 'Borrador'}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-tenue">
                          {e.nivel.nombre} · {e.asignatura.nombre} ·{' '}
                          {e.tiempoMin === 0 ? 'sin límite' : `${e.tiempoMin} min`} ·{' '}
                          {e._count.items} preguntas ·{' '}
                          {asignado
                            ? `${e._count.asignaciones} ${e._count.asignaciones === 1 ? 'curso' : 'cursos'}`
                            : 'sin asignar'}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-1">
                        <a
                          href={`/ensayos/${e.id}/imprimir`}
                          className="rounded-lg border border-borde px-3 py-1.5 text-xs text-marca transition hover:bg-fondo"
                        >
                          Imprimir
                        </a>
                        <a
                          href={`/ensayos/${e.id}/asignar`}
                          className="rounded-lg border border-borde px-3 py-1.5 text-xs text-marca transition hover:bg-fondo"
                        >
                          Asignar
                        </a>

                        <form method="post" action={`/api/ensayos/${e.id}/duplicar`}>
                          <button className="rounded-lg border border-borde px-3 py-1.5 text-xs text-marca transition hover:bg-fondo">
                            Duplicar
                          </button>
                        </form>

                        <details className="relative">
                          <summary className="cursor-pointer list-none rounded-lg border border-borde px-3 py-1.5 text-xs text-marca transition hover:bg-fondo">
                            Renombrar
                          </summary>
                          <form
                            method="post"
                            action={`/api/ensayos/${e.id}/renombrar`}
                            className="absolute right-0 z-20 mt-2 w-72 rounded-xl border border-borde bg-white p-3 shadow-xl"
                          >
                            <label className="block text-[11px] font-medium uppercase tracking-wide text-tenue">
                              Nuevo nombre
                              <input
                                name="titulo"
                                defaultValue={e.titulo}
                                required
                                minLength={3}
                                maxLength={120}
                                className="mt-1.5 w-full rounded-lg border border-borde px-2.5 py-2 text-sm text-marca outline-none focus:border-acento/50 focus:ring-4 focus:ring-acento/10"
                              />
                            </label>
                            <button className="mt-3 w-full rounded-lg bg-marca px-3 py-2 text-xs font-medium text-white transition hover:bg-marca-oscuro">
                              Guardar nombre
                            </button>
                          </form>
                        </details>

                        <EliminarEnsayo
                          id={e.id}
                          titulo={e.titulo}
                          asignaciones={e._count.asignaciones}
                        />
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Tarjeta>
      </div>
    </Panel>
  );
}
