import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { sesionActual } from '@/lib/auth';
import { Panel } from '@/components/panel';
import { aHoraChile } from '@/lib/fechas';

export const dynamic = 'force-dynamic';

const ETIQUETA: Record<string, string> = {
  EN_CURSO: 'En curso',
  ENVIADO: 'Enviada',
  EXPIRADO: 'Cerrada por tiempo',
  ANULADO: 'Anulada',
};

const COLOR: Record<string, string> = {
  EN_CURSO: 'bg-amber-50 text-amber-800',
  ENVIADO: 'bg-acento-suave text-marca',
  EXPIRADO: 'bg-borde text-tenue',
  ANULADO: 'bg-rose-50 text-rose-700',
};

const AVISOS: Record<string, string> = {
  ok: '',
  anulado: 'Intento anulado. El alumno puede volver a rendir si le quedan intentos.',
  prorrogado: 'Plazo extendido.',
  intentos: 'Se habilitó un intento más para todo el curso.',
};

export default async function Seguimiento({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const sesion = await sesionActual();
  if (!sesion) redirect('/login');
  if (sesion.tipo !== 'usuario') redirect('/alumno');

  const { id } = await params;
  const { ok, error } = await searchParams;

  const asignacion = await prisma.asignacion.findFirst({
    where: { id, curso: { colegioId: sesion.colegioId } },
    include: {
      ensayo: { select: { titulo: true, tiempoMin: true } },
      curso: {
        include: {
          matriculas: {
            where: { estado: 'ACTIVA' },
            include: {
              estudiante: {
                select: { id: true, nombres: true, apellidos: true, codigoAcceso: true },
              },
            },
          },
        },
      },
      intentos: { include: { resultado: true }, orderBy: { iniciadoEn: 'asc' } },
    },
  });

  if (!asignacion) redirect('/ensayos');

  const alumnos = asignacion.curso.matriculas
    .map((m) => {
      const intentos = asignacion.intentos.filter((i) => i.estudianteId === m.estudianteId);
      return { estudiante: m.estudiante, intentos };
    })
    .sort((a, b) => a.estudiante.apellidos.localeCompare(b.estudiante.apellidos));

  const enCurso = asignacion.intentos.filter((i) => i.estado === 'EN_CURSO').length;
  const rendidos = asignacion.intentos.filter((i) => i.estado === 'ENVIADO' || i.estado === 'EXPIRADO').length;

  return (
    <Panel nombre={sesion.nombre} rol={sesion.rol} activo="/ensayos">
      <div className="mx-auto max-w-5xl space-y-6 px-6 py-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-marca">Seguimiento</h1>
            <p className="text-xs text-tenue">
              {asignacion.ensayo.titulo} · {asignacion.curso.nombre} · abre{' '}
              {aHoraChile(asignacion.abreEn).replace('T', ' ')} y cierra{' '}
              {aHoraChile(asignacion.cierraEn).replace('T', ' ')}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-acento-suave px-3 py-1 text-xs font-medium text-marca">
              {rendidos} rendidas
            </span>
            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800">
              {enCurso} en curso
            </span>
            <span className="rounded-full bg-fondo px-3 py-1 text-xs text-tenue">
              {asignacion.intentosPermitidos} intento{asignacion.intentosPermitidos > 1 ? 's' : ''} por alumno
            </span>
          </div>
        </div>

        {ok && AVISOS[ok] ? (
          <p className="rounded-xl bg-acento-suave px-4 py-3 text-sm text-marca">{AVISOS[ok]}</p>
        ) : null}

        {error ? (
          <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error === 'noabierto'
              ? 'Solo se puede prorrogar un intento que esté en curso.'
              : error === 'tope'
                ? 'El máximo es de cinco intentos por alumno.'
                : error === 'minutos'
                  ? 'La prórroga va de 1 a 120 minutos.'
                  : 'No se pudo completar la operación.'}
          </p>
        ) : null}

        <section className="rounded-2xl border border-borde bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold text-marca">Intentos por alumno</h2>
              <p className="text-xs text-tenue">
                Anular libera el intento. Prorrogar extiende el plazo solo a ese alumno.
              </p>
            </div>
            <form action="/api/asignaciones/intentos" method="post">
              <input type="hidden" name="asignacionId" value={asignacion.id} />
              <button className="rounded-lg border border-borde px-3 py-1.5 text-xs text-slate-700 hover:bg-fondo">
                Dar un intento más al curso
              </button>
            </form>
          </div>
        </section>

        <section className="rounded-2xl border border-borde bg-white">
          <ul className="divide-y divide-borde">
            {alumnos.map(({ estudiante, intentos }) => (
              <li key={estudiante.id} className="px-5 py-4">
                <div className="flex flex-wrap items-baseline gap-3">
                  <span className="w-20 font-mono text-xs text-tenue">{estudiante.codigoAcceso}</span>
                  <span className="text-sm font-medium text-slate-800">
                    {estudiante.nombres} {estudiante.apellidos}
                  </span>
                  <span className="text-xs text-tenue">
                    {intentos.length === 0 ? 'Sin intentos' : `${intentos.length} de ${asignacion.intentosPermitidos}`}
                  </span>
                </div>

                {intentos.map((i) => (
                  <div
                    key={i.id}
                    className="mt-2 flex flex-wrap items-center gap-2 rounded-xl bg-fondo px-3 py-2 text-xs"
                  >
                    <span className={`rounded-full px-2 py-0.5 font-medium ${COLOR[i.estado] ?? 'bg-borde text-tenue'}`}>
                      {ETIQUETA[i.estado] ?? i.estado}
                    </span>
                    <span className="text-tenue">
                      intento {i.numero} · desde {aHoraChile(i.iniciadoEn).replace('T', ' ')}
                    </span>
                    {i.estado === 'EN_CURSO' ? (
                      <span className="text-tenue">
                        vence {aHoraChile(i.fechaLimite).replace('T', ' ')}
                      </span>
                    ) : null}
                    {i.resultado ? (
                      <span className="tabular text-tenue">
                        {i.resultado.correctas}/{i.resultado.total} · {Number(i.resultado.pctLogro)}% · escala{' '}
                        {i.resultado.puntajeEscala ?? '—'}
                      </span>
                    ) : null}

                    <span className="ml-auto flex items-center gap-1">
                      {i.estado === 'EN_CURSO' ? (
                        <form action="/api/intentos/ampliar" method="post" className="flex items-center gap-1">
                          <input type="hidden" name="intentoId" value={i.id} />
                          <input
                            name="minutos"
                            type="number"
                            min="1"
                            max="120"
                            defaultValue={15}
                            className="w-16 rounded border border-borde px-1.5 py-1 text-xs"
                          />
                          <button className="rounded border border-borde bg-white px-2 py-1 text-xs text-slate-700 hover:bg-fondo">
                            Prorrogar
                          </button>
                        </form>
                      ) : null}

                      {i.estado !== 'ANULADO' ? (
                        <form action="/api/intentos/anular" method="post">
                          <input type="hidden" name="intentoId" value={i.id} />
                          <button className="rounded border border-acento px-2 py-1 text-xs text-acento-oscuro hover:bg-acento-suave">
                            Anular
                          </button>
                        </form>
                      ) : null}
                    </span>
                  </div>
                ))}

                {intentos.length === 0 ? (
                  <p className="mt-1 text-xs text-tenue">Todavía no ha abierto la evaluación.</p>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </Panel>
  );
}
