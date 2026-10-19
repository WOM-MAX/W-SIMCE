import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { sesionActual } from '@/lib/auth';
import { Panel } from '@/components/panel';

export const dynamic = 'force-dynamic';

const CANTIDADES = [5, 10, 20, 30];
const TIEMPOS = [
  { valor: 0, etiqueta: 'Sin límite' },
  { valor: 10, etiqueta: '10 min' },
  { valor: 20, etiqueta: '20 min' },
  { valor: 30, etiqueta: '30 min' },
  { valor: 45, etiqueta: '45 min' },
  { valor: 60, etiqueta: '60 min' },
];

const CLASE_TARJETA =
  'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-borde bg-white px-4 py-6 text-center text-sm transition hover:border-acento has-[:checked]:border-acento has-[:checked]:bg-acento-suave has-[:checked]:font-medium';

export default async function NuevoEnsayo({
  searchParams,
}: {
  searchParams: Promise<{
    nivel?: string;
    asignatura?: string;
    ok?: string;
    n?: string;
    id?: string;
    error?: string;
  }>;
}) {
  const sesion = await sesionActual();
  if (!sesion) redirect('/login');
  if (sesion.tipo !== 'usuario') redirect('/alumno');

  const params = await searchParams;

  const [niveles, asignaturas] = await Promise.all([
    prisma.nivel.findMany({ orderBy: { orden: 'asc' } }),
    prisma.asignatura.findMany({ orderBy: { nombre: 'asc' } }),
  ]);

  const nivel =
    niveles.find((n) => n.codigo === params.nivel) ?? niveles.find((n) => n.codigo === '4B') ?? niveles[0];
  const asignatura =
    asignaturas.find((a) => a.codigo === params.asignatura) ??
    asignaturas.find((a) => a.codigo === 'matematica') ??
    asignaturas[0];

  const ejes = nivel && asignatura
    ? await prisma.eje.findMany({
        where: { nivelId: nivel.id, asignaturaId: asignatura.id },
        orderBy: { nombre: 'asc' },
      })
    : [];

  const conteos = new Map<string, number>();
  for (const eje of ejes) {
    conteos.set(
      eje.id,
      await prisma.itemVersion.count({
        where: { item: { ejeId: eje.id, estado: 'APROBADO' } },
      })
    );
  }

  const totalGeneral = [...conteos.values()].reduce((suma, n) => suma + n, 0);

  return (
    <Panel nombre={sesion.nombre} rol={sesion.rol} activo="/ensayos/nuevo">
      <div className="mx-auto max-w-3xl space-y-6 px-6 py-8">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-marca">Generar ensayo</h1>
          <p className="text-xs text-tenue">
            Queda como borrador y lo asignas a un curso cuando quieras.
          </p>
        </div>

        {params.ok === 'creado' ? (
          <p className="rounded-xl bg-acento-suave px-4 py-3 text-sm text-marca">
            Ensayo creado con {params.n ?? '0'} preguntas.{' '}
            <a href="/ensayos" className="underline">
              Ver mis ensayos
            </a>
          </p>
        ) : null}

        {params.error ? (
          <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {params.error === 'sinitems'
              ? 'Ese eje no tiene ítems aprobados suficientes para generar el ensayo.'
              : params.error === 'preguntas'
                ? 'La cantidad de preguntas debe ir de 1 a 100.'
                : params.error === 'tiempo'
                  ? 'El tiempo debe ir de 0 a 180 minutos.'
                  : params.error === 'eje'
                    ? 'Ese eje no corresponde al nivel y la asignatura elegidos.'
                    : 'No se pudo generar el ensayo.'}
          </p>
        ) : null}

        <div className="flex gap-2 rounded-xl bg-borde/40 p-1">
          <span className="flex-1 rounded-lg bg-white px-4 py-2 text-center text-xs font-medium text-marca shadow-sm">
            Interactivo
          </span>
          <span
            className="flex-1 rounded-lg px-4 py-2 text-center text-xs text-tenue"
            title="La versión imprimible todavía no está disponible"
          >
            Imprimible (PDF) · pronto
          </span>
        </div>

        <form action="/ensayos/nuevo" method="get" className="flex flex-wrap items-end gap-3">
          <label className="block text-xs font-medium uppercase tracking-wide text-tenue">
            Nivel
            <select
              name="nivel"
              defaultValue={nivel?.codigo}
              className="mt-1 w-full rounded-lg border border-borde bg-white px-3 py-2 text-sm text-marca"
            >
              {niveles.map((n) => (
                <option key={n.id} value={n.codigo}>
                  {n.nombre}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-medium uppercase tracking-wide text-tenue">
            Asignatura
            <select
              name="asignatura"
              defaultValue={asignatura?.codigo}
              className="mt-1 w-full rounded-lg border border-borde bg-white px-3 py-2 text-sm text-marca"
            >
              {asignaturas.map((a) => (
                <option key={a.id} value={a.codigo}>
                  {a.nombre}
                </option>
              ))}
            </select>
          </label>
          <button className="rounded-lg border border-borde bg-white px-3 py-2 text-xs text-slate-700 hover:bg-fondo">
            Cambiar
          </button>
        </form>

        <form action="/api/ensayos/crear" method="post" className="space-y-6">
          <input type="hidden" name="nivelId" value={nivel?.id ?? ''} />
          <input type="hidden" name="asignaturaId" value={asignatura?.id ?? ''} />

          <section>
            <h2 className="text-base font-semibold text-marca">Elige el tipo de ensayo</h2>
            <p className="mb-3 text-xs text-tenue">
              Preguntas variadas o de un área específica de {asignatura?.nombre} · {nivel?.nombre}
            </p>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className={CLASE_TARJETA}>
                <input type="radio" name="eje" value="" defaultChecked className="sr-only" />
                <span className="font-medium text-marca">Aleatorio (Variado)</span>
                <span className="text-xs text-tenue">
                  Preguntas de todas las áreas mezcladas · {totalGeneral} disponibles
                </span>
              </label>

              {ejes.map((eje) => {
                const disponibles = conteos.get(eje.id) ?? 0;
                const vacio = disponibles === 0;
                return (
                  <label
                    key={eje.id}
                    className={`${CLASE_TARJETA} ${vacio ? 'opacity-50' : ''}`}
                    title={vacio ? 'Este eje no tiene ítems aprobados' : undefined}
                  >
                    <input
                      type="radio"
                      name="eje"
                      value={eje.id}
                      disabled={vacio}
                      className="sr-only"
                    />
                    <span className="font-medium text-marca">{eje.nombre}</span>
                    <span className="text-xs text-tenue">{disponibles} disponibles</span>
                  </label>
                );
              })}
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-marca">Número de preguntas</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {CANTIDADES.map((cantidad) => (
                <label key={cantidad} className={CLASE_TARJETA}>
                  <input
                    type="radio"
                    name="preguntas"
                    value={cantidad}
                    defaultChecked={cantidad === 10}
                    className="sr-only"
                  />
                  <span className="tabular text-lg font-semibold text-marca">{cantidad}</span>
                </label>
              ))}
            </div>
            <label className="mt-3 flex items-center gap-2 text-xs text-tenue">
              o personalizado:
              <input
                name="preguntasPersonalizado"
                type="number"
                min="1"
                max="100"
                placeholder="ej: 50"
                className="w-24 rounded-lg border border-borde px-2 py-1.5 text-sm text-marca"
              />
              preguntas (máx. 100)
            </label>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-marca">Tiempo límite</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {TIEMPOS.map((t) => (
                <label key={t.valor} className={CLASE_TARJETA}>
                  <input
                    type="radio"
                    name="tiempoMin"
                    value={t.valor}
                    defaultChecked={t.valor === 30}
                    className="sr-only"
                  />
                  <span className="text-sm font-medium text-marca">{t.etiqueta}</span>
                </label>
              ))}
            </div>
            <label className="mt-3 flex items-center gap-2 text-xs text-tenue">
              o personalizado:
              <input
                name="tiempoPersonalizado"
                type="number"
                min="0"
                max="180"
                placeholder="ej: 90"
                className="w-24 rounded-lg border border-borde px-2 py-1.5 text-sm text-marca"
              />
              minutos (máx. 180)
            </label>
          </section>

          <button className="w-full rounded-xl bg-marca px-4 py-3 text-sm font-medium text-white hover:bg-marca-oscuro">
            Generar ensayo
          </button>
        </form>
      </div>
    </Panel>
  );
}
