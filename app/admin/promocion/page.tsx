import { redirect } from 'next/navigation';
import { esTecnico, sesionActual } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Panel } from '@/components/panel';
import { Cabecera } from '@/components/ui-panel';
import { cursosDeAnio, sugerirCurso } from '@/lib/promocion';

export const dynamic = 'force-dynamic';

const ERRORES: Record<string, string> = {
  datos: 'Elige dos años distintos del mismo colegio.',
  cerrado: 'El año de destino está cerrado: reábrelo a planificación antes de promover.',
  seleccion: 'No hay ningún estudiante con curso de destino.',
  interno: 'No se pudo completar la operación.',
};

export default async function Promocion({
  searchParams,
}: {
  searchParams: Promise<{
    origen?: string;
    destino?: string;
    ok?: string;
    error?: string;
    n?: string;
    o?: string;
    d?: string;
  }>;
}) {
  const sesion = await sesionActual();
  if (!sesion || sesion.tipo !== 'usuario') redirect('/login');
  if (!esTecnico(sesion)) redirect('/panel');

  const params = await searchParams;

  const anios = await prisma.anioEscolar.findMany({
    where: { colegioId: sesion.colegioId },
    orderBy: { anio: 'desc' },
  });

  if (anios.length < 2) {
    return (
      <Panel nombre={sesion.nombre} rol={sesion.rol} activo="/admin">
        <div className="mx-auto max-w-5xl space-y-6 px-6 py-8">
          <Cabecera titulo="Promoción" detalle="Pasar estudiantes al año siguiente" />
          <div className="rounded-2xl border border-borde bg-white p-6">
            <p className="text-sm text-slate-700">
              Necesitas dos años escolares: el de origen y el nuevo. Crea el año que viene en
              Administración → Años escolares.
            </p>
            <a
              href="/admin"
              className="pulsable mt-4 inline-block rounded-lg bg-marca px-4 py-2 text-sm font-medium text-white hover:bg-marca-oscuro"
            >
              Ir a Administración
            </a>
          </div>
        </div>
      </Panel>
    );
  }

  const origenId = params.origen ?? anios.find((a) => a.estado !== 'planificacion')?.id ?? anios[1].id;
  const destinoId =
    params.destino ?? anios.find((a) => a.estado === 'planificacion' && a.id !== origenId)?.id ?? anios[0].id;

  const [origenAnio, destinoAnio] = await Promise.all([
    prisma.anioEscolar.findFirst({ where: { id: origenId, colegioId: sesion.colegioId } }),
    prisma.anioEscolar.findFirst({ where: { id: destinoId, colegioId: sesion.colegioId } }),
  ]);

  if (!origenAnio || !destinoAnio) redirect('/admin');

  const [cursosOrigen, cursosDestino] = await Promise.all([
    cursosDeAnio(sesion.colegioId, origenId),
    cursosDeAnio(sesion.colegioId, destinoId),
  ]);

  const matriculas = await prisma.matricula.findMany({
    where: { estado: 'ACTIVA', curso: { colegioId: sesion.colegioId, anioId: origenId } },
    select: {
      estudianteId: true,
      cursoId: true,
      estudiante: { select: { nombres: true, apellidos: true, codigoAcceso: true } },
    },
  });

  const porCurso = new Map<string, typeof matriculas>();
  for (const m of matriculas) {
    const lista = porCurso.get(m.cursoId) ?? [];
    lista.push(m);
    porCurso.set(m.cursoId, lista);
  }

  const ordenados = [...cursosOrigen].sort(
    (a, b) => a.nivel.orden - b.nivel.orden || a.letra.localeCompare(b.letra),
  );

  // Reporte de cierre del año de origen.
  const [ensayos, asignaciones, intentos, conIntento] = await Promise.all([
    prisma.ensayo.count({ where: { colegioId: sesion.colegioId, anioId: origenId } }),
    prisma.asignacion.count({ where: { curso: { colegioId: sesion.colegioId, anioId: origenId } } }),
    prisma.intento.count({
      where: {
        asignacion: { curso: { colegioId: sesion.colegioId, anioId: origenId } },
        estado: { in: ['ENVIADO', 'EXPIRADO'] },
      },
    }),
    prisma.intento.findMany({
      where: {
        asignacion: { curso: { colegioId: sesion.colegioId, anioId: origenId } },
        estado: { in: ['ENVIADO', 'EXPIRADO'] },
      },
      select: { estudianteId: true },
      distinct: ['estudianteId'],
    }),
  ]);

  const aviso =
    params.ok === 'cursos'
      ? `Cursos creados en ${destinoAnio.anio}: ${params.n ?? '0'}.`
      : params.ok === 'promovidos'
        ? `Matrículas creadas: ${params.n ?? '0'}. Omitidas: ${params.o ?? '0'}. Fuera de alcance: ${params.d ?? '0'}.`
        : null;
  const fallo = params.error ? (ERRORES[params.error] ?? ERRORES.interno) : null;

  return (
    <Panel nombre={sesion.nombre} rol={sesion.rol} activo="/admin">
      <div className="mx-auto max-w-6xl space-y-6 px-6 py-8">
        <Cabecera
          titulo="Promoción"
          detalle="Pasar estudiantes al año siguiente"
          accion={
            <a
              href="/admin"
              className="pulsable rounded-xl border border-borde bg-white px-4 py-2.5 text-sm font-medium text-marca hover:bg-fondo"
            >
              Volver a Administración
            </a>
          }
        />

        {aviso ? (
          <p className="rounded-xl bg-acento-suave px-4 py-3 text-sm text-marca">{aviso}</p>
        ) : null}
        {fallo ? (
          <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{fallo}</p>
        ) : null}

        <section className="rounded-2xl border border-borde bg-white p-6">
          <h2 className="text-base font-semibold text-marca">Años</h2>
          <form method="get" className="mt-3 flex flex-wrap items-end gap-3">
            <label className="text-xs font-medium uppercase tracking-wide text-tenue">
              Desde
              <select
                name="origen"
                defaultValue={origenId}
                className="mt-1 block rounded-lg border border-borde px-3 py-2 text-sm text-marca"
              >
                {anios.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.anio} · {a.estado}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs font-medium uppercase tracking-wide text-tenue">
              Hacia
              <select
                name="destino"
                defaultValue={destinoId}
                className="mt-1 block rounded-lg border border-borde px-3 py-2 text-sm text-marca"
              >
                {anios.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.anio} · {a.estado}
                  </option>
                ))}
              </select>
            </label>
            <button className="pulsable rounded-lg border border-borde px-3 py-2 text-sm text-slate-700 hover:bg-fondo">
              Ver
            </button>
          </form>
        </section>

        <section className="rounded-2xl border border-borde bg-white p-6">
          <h2 className="text-base font-semibold text-marca">
            Cierre de {origenAnio.anio}
          </h2>
          <p className="mt-1 text-xs text-tenue">
            Foto del año que se cierra. Sirve para revisar antes de pasar a {destinoAnio.anio}.
          </p>
          <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ['Estudiantes', matriculas.length],
              ['Ensayos', ensayos],
              ['Asignaciones', asignaciones],
              ['Pruebas rendidas', intentos],
            ].map(([etiqueta, valor]) => (
              <div key={String(etiqueta)} className="rounded-xl border border-borde px-4 py-3">
                <dt className="text-[11px] uppercase tracking-wide text-tenue">{etiqueta}</dt>
                <dd className="mt-1 text-xl font-semibold text-marca">{valor}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 text-xs text-tenue">
            {conIntento.length} de {matriculas.length} estudiantes alcanzaron a rendir al menos
            una prueba.
          </p>
        </section>

        {cursosDestino.length === 0 ? (
          <section className="rounded-2xl border border-borde bg-white p-6">
            <h2 className="text-base font-semibold text-marca">Primero, los cursos</h2>
            <p className="mt-1 text-xs text-tenue">
              {destinoAnio.anio} todavía no tiene cursos. Se copian los de {origenAnio.anio}: misma
              letra y mismo nivel.
            </p>
            <form action="/api/admin/promocion" method="post" className="mt-4">
              <input type="hidden" name="accion" value="copiar-cursos" />
              <input type="hidden" name="origenId" value={origenId} />
              <input type="hidden" name="destinoId" value={destinoId} />
              <button className="pulsable rounded-lg bg-marca px-4 py-2 text-sm font-medium text-white hover:bg-marca-oscuro">
                Copiar cursos de {origenAnio.anio}
              </button>
            </form>
          </section>
        ) : (
          <form action="/api/admin/promocion" method="post" className="space-y-6">
            <input type="hidden" name="accion" value="promover" />
            <input type="hidden" name="origenId" value={origenId} />
            <input type="hidden" name="destinoId" value={destinoId} />

            <section className="rounded-2xl border border-borde bg-white">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-borde px-5 py-4">
                <h2 className="font-semibold text-marca">Estudiantes a promover</h2>
                <span className="text-xs text-tenue">
                  {matriculas.length} en {origenAnio.anio} · destino {destinoAnio.anio}
                </span>
              </div>

              <div className="max-h-[32rem] overflow-y-auto">
                {ordenados.map((curso) => {
                  const lista = porCurso.get(curso.id) ?? [];
                  if (lista.length === 0) return null;
                  const sugeridoBase = sugerirCurso(curso, cursosDestino);
                  return (
                    <div key={curso.id} className="border-b border-borde last:border-b-0">
                      <div className="flex flex-wrap items-center gap-2 bg-fondo px-5 py-2">
                        <span className="text-sm font-medium text-marca">{curso.nombre}</span>
                        <span className="text-xs text-tenue">{lista.length} estudiantes</span>
                        <span className="text-xs text-tenue">
                          → {sugeridoBase ? sugeridoBase.nombre : 'egresan'}
                        </span>
                      </div>
                      <ul>
                        {lista.map((m) => (
                          <li
                            key={m.estudianteId}
                            className="flex flex-wrap items-center gap-3 px-5 py-1.5"
                          >
                            <span className="min-w-0 flex-1 truncate text-sm text-slate-700">
                              {m.estudiante.apellidos}, {m.estudiante.nombres}
                              <span className="ml-2 text-xs text-tenue">
                                {m.estudiante.codigoAcceso}
                              </span>
                            </span>
                            <select
                              name={`destino-${m.estudianteId}`}
                              defaultValue={sugeridoBase?.id ?? ''}
                              className="rounded-lg border border-borde px-2 py-1 text-xs text-marca"
                            >
                              <option value="">No promover</option>
                              {cursosDestino.map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.nombre}
                                </option>
                              ))}
                            </select>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-borde px-5 py-4">
                <p className="text-xs text-tenue">
                  Los que queden en “No promover” no se matriculan: repitentes que se cargan aparte
                  o estudiantes que egresan.
                </p>
                <button className="pulsable rounded-lg bg-acento-boton px-4 py-2 text-sm font-medium text-white hover:bg-acento-boton-hover">
                  Promover seleccionados
                </button>
              </div>
            </section>
          </form>
        )}
      </div>
    </Panel>
  );
}
