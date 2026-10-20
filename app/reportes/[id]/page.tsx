import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { sesionActual } from '@/lib/auth';
import { Panel } from '@/components/panel';
import { informeDeAsignacion, estadisticasPorItem } from '@/lib/reportes';

export const dynamic = 'force-dynamic';

const COLOR_NIVEL: Record<string, string> = {
  Insuficiente: 'bg-rose-50 text-rose-700',
  Elemental: 'bg-amber-50 text-amber-800',
  Adecuado: 'bg-acento-suave text-marca',
};

function delta(a: number, b: number): string {
  const d = Math.round((b - a) * 10) / 10;
  if (d === 0) return 'igual';
  return `${d > 0 ? '+' : ''}${d}`;
}

export default async function DetalleReporte({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ comparar?: string }>;
}) {
  const sesion = await sesionActual();
  if (!sesion) redirect('/login');
  if (sesion.tipo !== 'usuario') redirect('/alumno');

  const { id } = await params;
  const { comparar } = await searchParams;

  const informe = await informeDeAsignacion(id, sesion.colegioId);
  if (!informe) redirect('/reportes');

  const asignacion = await prisma.asignacion.findFirst({
    where: { id, curso: { colegioId: sesion.colegioId } },
    select: { cursoId: true },
  });

  const hermanas = asignacion
    ? await prisma.asignacion.findMany({
        where: { cursoId: asignacion.cursoId, id: { not: id } },
        include: { ensayo: { select: { titulo: true } } },
        orderBy: { creadaEn: 'desc' },
      })
    : [];

  const items = await estadisticasPorItem(id);
  const masDificiles = [...items].sort((a, b) => a.pct - b.pct).slice(0, 5);
  const otra = comparar ? await informeDeAsignacion(comparar, sesion.colegioId) : null;

  return (
    <Panel nombre={sesion.nombre} rol={sesion.rol} activo="/reportes">
      <div className="mx-auto max-w-6xl space-y-6 px-6 py-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-marca">{informe.titulo}</h1>
            <p className="text-xs text-tenue">
              {informe.curso} · {informe.rendidos} rendidos · logro promedio {informe.promedioPct}%
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              href={`/seguimiento/${informe.id}`}
              className="rounded-lg border border-borde bg-white px-3 py-1.5 text-xs text-slate-700 hover:bg-fondo"
            >
              Seguimiento
            </a>
            <a
              href={`/api/reportes/csv?asignacion=${informe.id}`}
              className="rounded-lg border border-borde bg-white px-3 py-1.5 text-xs text-slate-700 hover:bg-fondo"
            >
              Descargar CSV
            </a>
            <a href="/reportes" className="rounded-lg border border-borde bg-white px-3 py-1.5 text-xs text-slate-700 hover:bg-fondo">
              Volver
            </a>
          </div>
        </div>

        <section className="rounded-2xl border border-borde bg-white p-5">
          <h2 className="mb-3 font-semibold text-marca">Las cinco preguntas más difíciles</h2>
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
            {masDificiles.map((i) => (
              <li key={i.orden} className="rounded-xl bg-fondo p-3">
                <p className="text-xs text-tenue">Pregunta {i.orden}</p>
                <p className="tabular text-lg font-semibold text-marca">{i.pct}%</p>
                <p className="text-xs text-tenue">clave {i.clave}</p>
              </li>
            ))}
            {masDificiles.length === 0 ? <li className="text-xs text-tenue">Sin datos.</li> : null}
          </ul>
        </section>

        <section className="rounded-2xl border border-borde bg-white">
          <div className="border-b border-borde px-5 py-4">
            <h2 className="font-semibold text-marca">Detalle por pregunta</h2>
            <p className="text-xs text-tenue">
              Porcentaje de acierto y qué alternativa eligió el curso en cada una.
            </p>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-tenue">
                <th className="px-5 py-2 font-medium">N.º</th>
                <th className="px-3 py-2 font-medium">Clave</th>
                <th className="px-3 py-2 text-right font-medium">Acierto</th>
                <th className="px-5 py-2 font-medium">Distribución de respuestas</th>
              </tr>
            </thead>
            <tbody>
              {items.map((i) => {
                const maximo = Math.max(1, ...i.distribucion.map((d) => d.cantidad));
                return (
                  <tr key={i.orden} className="border-t border-borde align-top">
                    <td className="px-5 py-2 font-semibold text-slate-700">{i.orden}</td>
                    <td className="px-3 py-2 font-mono text-xs text-tenue">{i.clave}</td>
                    <td className="tabular px-3 py-2 text-right text-slate-700">{i.pct}%</td>
                    <td className="px-5 py-2">
                      <div className="flex flex-wrap gap-2">
                        {i.distribucion.map((d) => (
                          <span
                            key={d.letra}
                            className={`flex items-center gap-1 rounded px-1.5 py-0.5 text-xs ${
                              d.letra === i.clave ? 'bg-acento-suave text-marca' : 'bg-fondo text-tenue'
                            }`}
                            title={`${d.cantidad} de ${i.respondidas}`}
                          >
                            <span className="font-mono">{d.letra}</span>
                            <span className="tabular">{d.cantidad}</span>
                            <span
                              className="block h-1 rounded bg-acento"
                              style={{ width: `${Math.round((d.cantidad / maximo) * 28)}px` }}
                            />
                          </span>
                        ))}
                        {i.respondidas === 0 ? (
                          <span className="text-xs text-tenue">Sin respuestas.</span>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>

        {hermanas.length > 0 ? (
          <section className="rounded-2xl border border-borde bg-white p-5">
            <h2 className="mb-1 font-semibold text-marca">Comparar con otra evaluación del curso</h2>
            <p className="mb-3 text-xs text-tenue">
              Útil para ver si el refuerzo entre una aplicación y otra movió el logro por eje.
            </p>
            <form action={`/reportes/${informe.id}`} method="get" className="flex flex-wrap items-end gap-3">
              <label className="block text-xs font-medium uppercase tracking-wide text-tenue">
                Comparar con
                <select
                  name="comparar"
                  defaultValue={comparar ?? ''}
                  className="mt-1 w-full rounded-lg border border-borde bg-white px-3 py-2 text-sm text-marca"
                >
                  <option value="">Elige una evaluación</option>
                  {hermanas.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.ensayo.titulo}
                    </option>
                  ))}
                </select>
              </label>
              <button className="rounded-lg bg-marca px-4 py-2 text-sm font-medium text-white hover:bg-marca-oscuro">
                Comparar
              </button>
            </form>

            {otra ? (
              <div className="mt-5 space-y-4">
                <p className="text-xs text-tenue">
                  Contra: {otra.titulo} · {otra.rendidos} rendidos · logro promedio {otra.promedioPct}%
                </p>

                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wide text-tenue">
                      <th className="py-2 font-medium">Eje</th>
                      <th className="py-2 text-right font-medium">Esta</th>
                      <th className="py-2 text-right font-medium">La otra</th>
                      <th className="py-2 text-right font-medium">Diferencia</th>
                    </tr>
                  </thead>
                  <tbody>
                    {informe.porEje.map((eje) => {
                      const par = otra.porEje.find((x) => x.clave === eje.clave);
                      return (
                        <tr key={eje.clave} className="border-t border-borde">
                          <td className="py-2 text-slate-700">{eje.clave}</td>
                          <td className="tabular py-2 text-right text-slate-700">{eje.pct}%</td>
                          <td className="tabular py-2 text-right text-slate-700">
                            {par ? `${par.pct}%` : '—'}
                          </td>
                          <td className="tabular py-2 text-right font-medium text-marca">
                            {par ? delta(eje.pct, par.pct) : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : null}
          </section>
        ) : null}

        <section className="rounded-2xl border border-borde bg-white">
          <div className="border-b border-borde px-5 py-4">
            <h2 className="font-semibold text-marca">Estudiantes</h2>
          </div>
          <ul className="divide-y divide-borde">
            {informe.estudiantes.map((e) => (
              <li key={e.intentoId} className="flex flex-wrap items-center gap-3 px-5 py-3">
                <span className="w-20 font-mono text-xs text-tenue">{e.codigo}</span>
                <a
                  href={`/estudiantes/${e.estudianteId}`}
                  className="min-w-0 flex-1 truncate text-sm text-slate-800 hover:text-marca hover:underline"
                >
                  {e.nombre}
                </a>
                <span className="tabular text-xs text-tenue">
                  {e.correctas}/{e.total} · {e.pct}% · {e.escala ?? '—'}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    COLOR_NIVEL[e.nivel ?? ''] ?? 'bg-borde text-tenue'
                  }`}
                >
                  {e.nivel ?? 'Sin nivel'}
                </span>
              </li>
            ))}
            {informe.estudiantes.length === 0 ? (
              <li className="px-5 py-6 text-sm text-tenue">Nadie ha rendido esta evaluación.</li>
            ) : null}
          </ul>
        </section>
      </div>
    </Panel>
  );
}
