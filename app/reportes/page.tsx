import { redirect } from 'next/navigation';
import { sesionActual } from '@/lib/auth';
import { Panel } from '@/components/panel';
import { asignacionesDelColegio, informeDeAsignacion } from '@/lib/reportes';
import { Cabecera, EstadoVacio } from '@/components/ui-panel';

export const dynamic = 'force-dynamic';

const COLOR_NIVEL: Record<string, string> = {
  Insuficiente: 'bg-rose-50 text-rose-700',
  Elemental: 'bg-amber-50 text-amber-800',
  Adecuado: 'bg-acento-suave text-marca',
};

function Barras({ filas }: { filas: Array<{ clave: string; pct: number; correctas: number; total: number }> }) {
  const tope = Math.max(100, ...filas.map((f) => f.pct));
  return (
    <ul className="space-y-2">
      {filas.map((f) => (
        <li key={f.clave} className="grid grid-cols-[minmax(0,10rem)_1fr_auto] items-center gap-3">
          <span className="truncate text-xs text-slate-700" title={f.clave}>
            {f.clave}
          </span>
          <span className="h-2 overflow-hidden rounded-full bg-borde">
            <span
              className="block h-2 rounded-full bg-acento"
              style={{ width: `${Math.round((f.pct / tope) * 100)}%` }}
            />
          </span>
          <span className="tabular text-xs text-tenue">
            {f.pct}% <span className="text-tenue/70">({f.correctas}/{f.total})</span>
          </span>
        </li>
      ))}
      {filas.length === 0 ? <li className="text-xs text-tenue">Sin datos.</li> : null}
    </ul>
  );
}

export default async function Reportes({
  searchParams,
}: {
  searchParams: Promise<{ asignacion?: string }>;
}) {
  const sesion = await sesionActual();
  if (!sesion) redirect('/login');
  if (sesion.tipo !== 'usuario') redirect('/alumno');

  const { asignacion } = await searchParams;
  const asignaciones = await asignacionesDelColegio(sesion.colegioId);

  if (asignaciones.length === 0) {
    return (
      <Panel nombre={sesion.nombre} rol={sesion.rol} activo="/reportes">
        <div className="mx-auto max-w-6xl space-y-6 px-6 py-8">
          <Cabecera titulo="Reportes" detalle="Resultados por curso, eje y habilidad" />
          <div className="rounded-2xl border border-borde bg-white">
            <EstadoVacio
              titulo="Todavía no hay evaluaciones asignadas"
              detalle="El informe se arma solo cuando un curso rinde un ensayo asignado. Mientras tanto, aquí no hay nada que mostrar."
              accion={
                <a href="/ensayos" className="pulsable mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-acento-boton-hover transition hover:underline">
                  Ir a los ensayos
                  <span aria-hidden="true">→</span>
                </a>
              }
            />
          </div>
        </div>
      </Panel>
    );
  }

  const elegida = asignacion ?? asignaciones[0].id;
  const informe = await informeDeAsignacion(elegida, sesion.colegioId);

  return (
    <Panel nombre={sesion.nombre} rol={sesion.rol} activo="/reportes">
      <div className="mx-auto max-w-6xl space-y-6 px-6 py-8">
        <Cabecera
          titulo="Reportes"
          detalle="Resultados por curso, eje y habilidad"
          accion={
            informe ? (
              <div className="flex gap-2">
                <a
                  href={`/reportes/${informe.id}`}
                  className="pulsable rounded-xl border border-borde bg-white px-4 py-2.5 text-sm font-medium text-marca transition hover:bg-fondo"
                >
                  Detalle por pregunta
                </a>
                <a
                  href={`/api/reportes/csv?asignacion=${informe.id}`}
                  className="pulsable rounded-xl border border-borde bg-white px-4 py-2.5 text-sm font-medium text-marca transition hover:bg-fondo"
                >
                  Descargar CSV
                </a>
              </div>
            ) : null
          }
        />

        <div className="flex flex-wrap gap-2">
          {asignaciones.map((a) => (
            <a
              key={a.id}
              href={`/reportes?asignacion=${a.id}`}
              className={`rounded-full border px-3 py-1.5 text-xs ${
                a.id === elegida
                  ? 'border-acento bg-acento-suave font-medium text-marca'
                  : 'border-borde bg-white text-slate-700 hover:bg-fondo'
              }`}
            >
              {a.curso.nombre} · {a.ensayo.titulo}
            </a>
          ))}
        </div>

        {!informe ? (
          <div className="rounded-2xl border border-borde bg-white">
            <EstadoVacio
              titulo="Esa evaluación no pertenece a tu colegio"
              detalle="Elige otra evaluación en la lista de arriba."
            />
          </div>
        ) : (
          <>
            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-borde bg-white p-5">
                <p className="text-xs font-medium uppercase tracking-wide text-tenue">Rendidos</p>
                <p className="tabular mt-1 text-3xl font-semibold text-marca">{informe.rendidos}</p>
              </div>
              <div className="rounded-2xl border border-borde bg-white p-5">
                <p className="text-xs font-medium uppercase tracking-wide text-tenue">Logro promedio</p>
                <p className="tabular mt-1 text-3xl font-semibold text-marca">{informe.promedioPct}%</p>
              </div>
              <div className="rounded-2xl border border-borde bg-white p-5">
                <p className="text-xs font-medium uppercase tracking-wide text-tenue">Escala promedio</p>
                <p className="tabular mt-1 text-3xl font-semibold text-marca">
                  {informe.promedioEscala}
                </p>
              </div>
              <div className="rounded-2xl border border-borde bg-white p-5">
                <p className="text-xs font-medium uppercase tracking-wide text-tenue">Distribución</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {informe.porNivel.length === 0 ? (
                    <span className="text-xs text-tenue">Sin datos</span>
                  ) : (
                    informe.porNivel.map((n) => (
                      <span
                        key={n.nivel}
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          COLOR_NIVEL[n.nivel] ?? 'bg-borde text-tenue'
                        }`}
                      >
                        {n.nivel} {n.cantidad}
                      </span>
                    ))
                  )}
                </div>
              </div>
            </section>

            <section className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-borde bg-white p-5">
                <h2 className="mb-4 font-semibold text-marca">Logro por eje</h2>
                <Barras filas={informe.porEje} />
              </div>
              <div className="rounded-2xl border border-borde bg-white p-5">
                <h2 className="mb-4 font-semibold text-marca">Logro por habilidad</h2>
                <Barras filas={informe.porHabilidad} />
              </div>
            </section>

            <section className="rounded-2xl border border-borde bg-white">
              <div className="flex items-center justify-between border-b border-borde px-5 py-4">
                <h2 className="font-semibold text-marca">Detalle por estudiante</h2>
                <span className="text-xs text-tenue">
                  {informe.curso} · {informe.tiempoMin} min
                </span>
              </div>
              {informe.estudiantes.length === 0 ? (
                <p className="px-5 py-6 text-sm text-tenue">Nadie ha rendido esta evaluación.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wide text-tenue">
                      <th className="px-5 py-2 font-medium">Código</th>
                      <th className="px-3 py-2 font-medium">Estudiante</th>
                      <th className="px-3 py-2 text-right font-medium">Correctas</th>
                      <th className="px-3 py-2 text-right font-medium">Logro</th>
                      <th className="px-3 py-2 text-right font-medium">Escala</th>
                      <th className="px-5 py-2 font-medium">Nivel</th>
                    </tr>
                  </thead>
                  <tbody>
                    {informe.estudiantes.map((e) => (
                      <tr key={e.intentoId} className="border-t border-borde">
                        <td className="px-5 py-2 font-mono text-xs text-tenue">{e.codigo}</td>
                        <td className="px-3 py-2 text-slate-800">
                          <a href={`/estudiantes/${e.estudianteId}`} className="pulsable hover:text-marca hover:underline">
                            {e.nombre}
                          </a>
                        </td>
                        <td className="tabular px-3 py-2 text-right text-slate-700">
                          {e.correctas} / {e.total}
                        </td>
                        <td className="tabular px-3 py-2 text-right text-slate-700">{e.pct}%</td>
                        <td className="tabular px-3 py-2 text-right text-slate-700">
                          {e.escala ?? '—'}
                        </td>
                        <td className="px-5 py-2">
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                              COLOR_NIVEL[e.nivel ?? ''] ?? 'bg-borde text-tenue'
                            }`}
                          >
                            {e.nivel ?? 'Sin nivel'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          </>
        )}
      </div>
    </Panel>
  );
}
