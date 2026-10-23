import { redirect } from 'next/navigation';
import { sesionActual, veTodoElColegio } from '@/lib/auth';
import { anioActual, aniosDe } from '@/lib/anio';
import { resumenDireccion } from '@/lib/direccion';
import { Panel } from '@/components/panel';
import { AvisoNiveles } from '@/components/aviso-niveles';
import { Cabecera, EstadoVacio } from '@/components/ui-panel';

export const dynamic = 'force-dynamic';

function Tarjeta({ etiqueta, valor, nota }: { etiqueta: string; valor: string; nota?: string }) {
  return (
    <div className="rounded-2xl border border-borde bg-white px-5 py-4">
      <p className="text-[11px] uppercase tracking-wide text-tenue">{etiqueta}</p>
      <p className="mt-1 text-2xl font-semibold tabular text-marca">{valor}</p>
      {nota ? <p className="mt-1 text-[11px] text-tenue">{nota}</p> : null}
    </div>
  );
}

function Barra({ pct }: { pct: number }) {
  const ancho = Math.max(0, Math.min(100, pct));
  return (
    <span className="flex items-center gap-2">
      <span className="h-1.5 w-24 overflow-hidden rounded-full bg-borde">
        <span className="block h-full rounded-full bg-acento" style={{ width: `${ancho}%` }} />
      </span>
      <span className="tabular text-xs text-slate-700">{pct.toFixed(1)}%</span>
    </span>
  );
}

export default async function Direccion({
  searchParams,
}: {
  searchParams: Promise<{ anio?: string }>;
}) {
  const sesion = await sesionActual();
  if (!sesion || sesion.tipo !== 'usuario') redirect('/login');
  if (!veTodoElColegio(sesion)) redirect('/panel');

  const { anio: anioPedido } = await searchParams;
  const anios = await aniosDe(sesion);
  const anio = anios.find((a) => a.id === anioPedido) ?? (await anioActual(sesion));

  if (!anio) {
    return (
      <Panel nombre={sesion.nombre} rol={sesion.rol} activo="/direccion">
        <div className="mx-auto max-w-6xl space-y-6 px-6 py-8">
          <Cabecera titulo="Dirección" detalle="Resultados del colegio" />
          <div className="rounded-2xl border border-borde bg-white">
            <EstadoVacio
              titulo="Todavía no hay un año escolar"
              detalle="Cuando exista un año con cursos y estudiantes, aquí aparecerán los resultados."
            />
          </div>
        </div>
      </Panel>
    );
  }

  const resumen = await resumenDireccion(sesion.colegioId, anio.id);

  return (
    <Panel nombre={sesion.nombre} rol={sesion.rol} activo="/direccion">
      <div className="mx-auto max-w-6xl space-y-6 px-6 py-8">
        <Cabecera
          titulo="Dirección"
          detalle={`Resultados del colegio · ${anio.anio}`}
          accion={
            <a
              href={`/api/direccion/csv?anio=${anio.id}`}
              className="pulsable rounded-xl border border-borde bg-white px-4 py-2.5 text-sm font-medium text-marca hover:bg-fondo"
            >
              Descargar CSV
            </a>
          }
        />

        <AvisoNiveles />

        {anios.length > 1 ? (
          <div className="flex flex-wrap gap-2">
            {anios.map((a) => (
              <a
                key={a.id}
                href={`/direccion?anio=${a.id}`}
                className={`pulsable rounded-lg border px-3 py-1.5 text-xs ${
                  a.id === anio.id
                    ? 'border-marca bg-marca text-white'
                    : 'border-borde bg-white text-slate-700 hover:bg-fondo'
                }`}
              >
                {a.anio}
              </a>
            ))}
          </div>
        ) : null}

        <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <Tarjeta etiqueta="Estudiantes" valor={String(resumen.matriculados)} nota="matriculados" />
          <Tarjeta etiqueta="Cursos" valor={String(resumen.cursos)} />
          <Tarjeta etiqueta="Ensayos" valor={String(resumen.ensayos)} nota="del año" />
          <Tarjeta etiqueta="Asignaciones" valor={String(resumen.asignaciones)} />
          <Tarjeta etiqueta="Pruebas rendidas" valor={String(resumen.rendidos)} />
          <Tarjeta
            etiqueta="Participación"
            valor={`${resumen.participacion}%`}
            nota="rindieron al menos una"
          />
        </section>

        <section className="rounded-2xl border border-borde bg-white">
          <div className="flex items-center justify-between border-b border-borde px-5 py-4">
            <h2 className="font-semibold text-marca">Resultados por curso</h2>
            <span className="text-xs text-tenue">promedio de logro {resumen.promedioPct}%</span>
          </div>
          {resumen.porCurso.length === 0 ? (
            <EstadoVacio titulo="Sin cursos en este año" detalle="Crea los cursos o promueve desde Administración." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[46rem] text-sm">
                <thead>
                  <tr className="border-b border-borde text-left text-[11px] uppercase tracking-wide text-tenue">
                    <th className="px-5 py-2 font-medium">Curso</th>
                    <th className="px-3 py-2 font-medium">Nivel</th>
                    <th className="px-3 py-2 font-medium">Matriculados</th>
                    <th className="px-3 py-2 font-medium">Rendidos</th>
                    <th className="px-3 py-2 font-medium">Logro</th>
                    <th className="px-3 py-2 font-medium">Insuf.</th>
                    <th className="px-3 py-2 font-medium">Elem.</th>
                    <th className="px-3 py-2 font-medium">Adec.</th>
                  </tr>
                </thead>
                <tbody>
                  {resumen.porCurso.map((c) => (
                    <tr key={c.cursoId} className="border-b border-borde last:border-b-0">
                      <td className="px-5 py-2 font-medium text-slate-800">{c.nombre}</td>
                      <td className="px-3 py-2 text-slate-600">{c.nivel}</td>
                      <td className="px-3 py-2 tabular text-slate-700">{c.matriculados}</td>
                      <td className="px-3 py-2 tabular text-slate-700">{c.rendidos}</td>
                      <td className="px-3 py-2">
                        <Barra pct={c.promedioPct} />
                      </td>
                      <td className="px-3 py-2 tabular text-rose-700">{c.insuficiente}</td>
                      <td className="px-3 py-2 tabular text-amber-700">{c.elemental}</td>
                      <td className="px-3 py-2 tabular text-teal-700">{c.adecuado}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-borde bg-white p-5">
            <h2 className="font-semibold text-marca">Por nivel</h2>
            <table className="mt-3 w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wide text-tenue">
                  <th className="py-1 font-medium">Nivel</th>
                  <th className="py-1 font-medium">Cursos</th>
                  <th className="py-1 font-medium">Rendidos</th>
                  <th className="py-1 font-medium">Logro</th>
                </tr>
              </thead>
              <tbody>
                {resumen.porNivel.map((n) => (
                  <tr key={n.nivel} className="border-t border-borde">
                    <td className="py-2 text-slate-800">{n.nivel}</td>
                    <td className="py-2 tabular text-slate-700">{n.cursos}</td>
                    <td className="py-2 tabular text-slate-700">{n.rendidos}</td>
                    <td className="py-2">
                      <Barra pct={n.promedioPct} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="rounded-2xl border border-borde bg-white p-5">
            <h2 className="font-semibold text-marca">Cobertura del banco</h2>
            <p className="mt-1 text-xs text-tenue">
              Ítems aprobados por nivel y cuántos distintos se usaron este año.
            </p>
            <table className="mt-3 w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wide text-tenue">
                  <th className="py-1 font-medium">Nivel</th>
                  <th className="py-1 font-medium">Disponibles</th>
                  <th className="py-1 font-medium">Usados</th>
                </tr>
              </thead>
              <tbody>
                {resumen.banco.map((b) => (
                  <tr key={b.nivel} className="border-t border-borde">
                    <td className="py-2 text-slate-800">{b.nivel}</td>
                    <td className="py-2 tabular text-slate-700">{b.disponibles}</td>
                    <td className="py-2 tabular text-slate-700">{b.usados}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>

        <section className="rounded-2xl border border-borde bg-white p-5">
          <h2 className="font-semibold text-marca">Evolución por ensayo</h2>
          {resumen.serie.length === 0 ? (
            <p className="mt-2 text-sm text-tenue">
              Todavía no hay pruebas rendidas este año: la serie aparece cuando los cursos rinden.
            </p>
          ) : (
            <table className="mt-3 w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wide text-tenue">
                  <th className="py-1 font-medium">Fecha</th>
                  <th className="py-1 font-medium">Ensayo</th>
                  <th className="py-1 font-medium">Curso</th>
                  <th className="py-1 font-medium">Rendidos</th>
                  <th className="py-1 font-medium">Logro</th>
                </tr>
              </thead>
              <tbody>
                {resumen.serie.map((p) => (
                  <tr key={p.asignacionId} className="border-t border-borde">
                    <td className="py-2 tabular text-slate-600">
                      {p.fecha.toLocaleDateString('es-CL')}
                    </td>
                    <td className="py-2 text-slate-800">{p.titulo}</td>
                    <td className="py-2 text-slate-600">{p.curso}</td>
                    <td className="py-2 tabular text-slate-700">{p.rendidos}</td>
                    <td className="py-2">
                      <Barra pct={p.promedioPct} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </Panel>
  );
}
