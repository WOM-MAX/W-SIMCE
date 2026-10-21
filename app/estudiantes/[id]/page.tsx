import { redirect } from 'next/navigation';
import { sesionActual } from '@/lib/auth';
import { Panel } from '@/components/panel';
import { historialDeEstudiante } from '@/lib/reportes';

export const dynamic = 'force-dynamic';

const COLOR_NIVEL: Record<string, string> = {
  Insuficiente: 'bg-rose-50 text-rose-700',
  Elemental: 'bg-amber-50 text-amber-800',
  Adecuado: 'bg-acento-suave text-marca',
};

function fecha(valor: Date | null): string {
  if (!valor) return '—';
  return valor.toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default async function HistorialEstudiante({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const sesion = await sesionActual();
  if (!sesion) redirect('/login');
  if (sesion.tipo !== 'usuario') redirect('/alumno');

  const { id } = await params;
  const datos = await historialDeEstudiante(id, sesion.colegioId);
  if (!datos) redirect('/reportes');

  const { estudiante, historial, porEje } = datos;
  const tope = Math.max(100, ...porEje.map((e) => e.pct));

  return (
    <Panel nombre={sesion.nombre} rol={sesion.rol} activo="/reportes">
      <div className="mx-auto max-w-5xl space-y-6 px-6 py-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-marca">
              {estudiante.nombres} {estudiante.apellidos}
            </h1>
            <p className="text-xs text-tenue">
              Código {estudiante.codigoAcceso} · RUN {estudiante.run ?? 'sin registro'} ·{' '}
              {historial.length} evaluaciones rendidas
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              href={`/api/estudiantes/${estudiante.id}/exportar`}
              className="rounded-lg border border-borde bg-white px-3 py-1.5 text-xs text-slate-700 hover:bg-fondo"
              title="Descarga todo lo que el sistema guarda de este estudiante"
            >
              Exportar sus datos
            </a>
            <a href="/reportes" className="rounded-lg border border-borde bg-white px-3 py-1.5 text-xs text-slate-700 hover:bg-fondo">
              Volver a reportes
            </a>
          </div>
        </div>

        {historial.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-borde bg-white p-6 text-sm text-tenue">
            Este estudiante no tiene evaluaciones rendidas.
          </p>
        ) : (
          <>
            <section className="rounded-2xl border border-borde bg-white">
              <div className="border-b border-borde px-5 py-4">
                <h2 className="font-semibold text-marca">Evolución</h2>
                <p className="text-xs text-tenue">De la más reciente a la más antigua.</p>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-tenue">
                    <th className="px-5 py-2 font-medium">Fecha</th>
                    <th className="px-3 py-2 font-medium">Evaluación</th>
                    <th className="px-3 py-2 text-right font-medium">Correctas</th>
                    <th className="px-3 py-2 text-right font-medium">Logro</th>
                    <th className="px-3 py-2 text-right font-medium">Escala</th>
                    <th className="px-5 py-2 font-medium">Nivel</th>
                  </tr>
                </thead>
                <tbody>
                  {historial.map((h) => (
                    <tr key={h.intentoId} className="border-t border-borde">
                      <td className="px-5 py-2 text-xs text-tenue">{fecha(h.fecha)}</td>
                      <td className="px-3 py-2 text-slate-800">{h.ensayo}</td>
                      <td className="tabular px-3 py-2 text-right text-slate-700">
                        {h.correctas}/{h.total}
                      </td>
                      <td className="tabular px-3 py-2 text-right text-slate-700">{h.pct}%</td>
                      <td className="tabular px-3 py-2 text-right text-slate-700">{h.escala ?? '—'}</td>
                      <td className="px-5 py-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            COLOR_NIVEL[h.nivel ?? ''] ?? 'bg-borde text-tenue'
                          }`}
                        >
                          {h.nivel ?? 'Sin nivel'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            <section className="rounded-2xl border border-borde bg-white p-5">
              <h2 className="mb-4 font-semibold text-marca">Logro acumulado por eje</h2>
              <ul className="space-y-2">
                {porEje.map((e) => (
                  <li key={e.clave} className="grid grid-cols-[minmax(0,10rem)_1fr_auto] items-center gap-3">
                    <span className="truncate text-xs text-slate-700" title={e.clave}>
                      {e.clave}
                    </span>
                    <span className="h-2 overflow-hidden rounded-full bg-borde">
                      <span
                        className="block h-2 rounded-full bg-acento"
                        style={{ width: `${Math.round((e.pct / tope) * 100)}%` }}
                      />
                    </span>
                    <span className="tabular text-xs text-tenue">
                      {e.pct}% <span className="text-tenue/70">({e.correctas}/{e.total})</span>
                    </span>
                  </li>
                ))}
                {porEje.length === 0 ? <li className="text-xs text-tenue">Sin desglose por eje.</li> : null}
              </ul>
            </section>
          </>
        )}
      </div>
    </Panel>
  );
}
