import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { sesionActual } from '@/lib/auth';
import { Panel } from '@/components/panel';
import { aHoraChile } from '@/lib/fechas';

export const dynamic = 'force-dynamic';

const CLASE_INPUT =
  'mt-1 w-full rounded-lg border border-borde bg-white px-3 py-2 text-sm text-marca';

const ERRORES: Record<string, string> = {
  datos: 'Falta el curso o la evaluación.',
  fechas: 'Las fechas no se pudieron interpretar.',
  orden: 'El cierre tiene que ser posterior a la apertura.',
  intentos: 'Los intentos permitidos van de 1 a 5.',
  curso: 'Ese curso no pertenece a tu colegio.',
  ensayo: 'Esa evaluación no existe o no es de tu colegio.',
  vacio: 'Esa evaluación no tiene preguntas.',
  duplicada: 'Ya hay una asignación vigente de esta evaluación a ese curso.',
  interno: 'No se pudo asignar. Inténtalo otra vez.',
};

export default async function AsignarEnsayo({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const sesion = await sesionActual();
  if (!sesion) redirect('/login');
  if (sesion.tipo !== 'usuario') redirect('/alumno');

  const { id } = await params;
  const { error } = await searchParams;

  const ensayo = await prisma.ensayo.findFirst({
    where: { id, colegioId: sesion.colegioId },
    include: {
      nivel: true,
      asignatura: true,
      _count: { select: { items: true } },
      asignaciones: {
        include: { curso: true },
        orderBy: { creadaEn: 'desc' },
      },
    },
  });

  if (!ensayo) redirect('/ensayos?error=ensayo');

  const cursos = await prisma.curso.findMany({
    where: { colegioId: sesion.colegioId },
    orderBy: { nombre: 'asc' },
  });

  const ahora = new Date();
  const enUnaSemana = new Date(ahora.getTime() + 7 * 24 * 60 * 60 * 1000);

  return (
    <Panel nombre={sesion.nombre} rol={sesion.rol} activo="/ensayos">
      <div className="mx-auto max-w-3xl space-y-6 px-6 py-8">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-marca">Asignar evaluación</h1>
          <p className="text-xs text-tenue">
            {ensayo.titulo} · {ensayo.nivel.nombre} · {ensayo.asignatura.nombre} ·{' '}
            {ensayo._count.items} preguntas
          </p>
        </div>

        {error ? (
          <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {ERRORES[error] ?? ERRORES.interno}
          </p>
        ) : null}

        {ensayo.estado === 'BORRADOR' ? (
          <p className="rounded-xl bg-acento-suave px-4 py-3 text-sm text-marca">
            Al asignarla, la evaluación pasa de borrador a publicada.
          </p>
        ) : null}

        <section className="rounded-2xl border border-borde bg-white p-6">
          <form action="/api/ensayos/asignar" method="post" className="space-y-4">
            <input type="hidden" name="ensayoId" value={ensayo.id} />

            <label className="block text-xs font-medium uppercase tracking-wide text-tenue">
              Curso
              <select name="cursoId" required className={CLASE_INPUT}>
                {cursos.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-xs font-medium uppercase tracking-wide text-tenue">
                Abre
                <input
                  type="datetime-local"
                  name="abreEn"
                  required
                  defaultValue={aHoraChile(ahora)}
                  className={CLASE_INPUT}
                />
              </label>
              <label className="block text-xs font-medium uppercase tracking-wide text-tenue">
                Cierra
                <input
                  type="datetime-local"
                  name="cierraEn"
                  required
                  defaultValue={aHoraChile(enUnaSemana)}
                  className={CLASE_INPUT}
                />
              </label>
            </div>

            <label className="block text-xs font-medium uppercase tracking-wide text-tenue">
              Intentos permitidos
              <select
                name="intentosPermitidos"
                defaultValue="1"
                className={CLASE_INPUT}
              >
                <option value="1">1 intento</option>
                <option value="2">2 intentos</option>
                <option value="3">3 intentos</option>
              </select>
            </label>

            <p className="text-xs text-tenue">
              Las horas son de Chile. El servidor cierra la evaluación al vencer, aunque el alumno
              cierre el navegador.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button className="pulsable rounded-lg bg-marca px-4 py-2 text-sm font-medium text-white hover:bg-marca-oscuro">
                Asignar y publicar
              </button>
              <a href="/ensayos" className="pulsable text-xs text-tenue hover:text-marca">
                Volver a ensayos
              </a>
            </div>
          </form>
        </section>

        {ensayo.asignaciones.length > 0 ? (
          <section className="rounded-2xl border border-borde bg-white">
            <div className="border-b border-borde px-5 py-4">
              <h2 className="font-semibold text-marca">Ya asignada a</h2>
            </div>
            <ul className="divide-y divide-borde">
              {ensayo.asignaciones.map((a) => (
                <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3">
                  <span className="text-sm text-slate-800">{a.curso.nombre}</span>
                  <span className="text-xs text-tenue">
                    {aHoraChile(a.abreEn).replace('T', ' ')} a {aHoraChile(a.cierraEn).replace('T', ' ')} ·{' '}
                    {a.intentosPermitidos} intento{a.intentosPermitidos > 1 ? 's' : ''}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </Panel>
  );
}
