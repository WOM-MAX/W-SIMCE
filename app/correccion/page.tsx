import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { sesionActual } from '@/lib/auth';
import { corregirIntento } from '@/lib/correccion';
import { Panel } from '@/components/panel';
import { Cabecera, EstadoVacio } from '@/components/ui-panel';

export const dynamic = 'force-dynamic';

const COLOR_NIVEL: Record<string, string> = {
  Insuficiente: 'bg-rose-50 text-rose-700',
  Elemental: 'bg-ambar-suave text-ambar-texto',
  Adecuado: 'bg-teal-suave text-teal-texto',
};

export default async function Correccion() {
  const sesion = await sesionActual();
  if (!sesion) redirect('/login');
  if (sesion.tipo !== 'usuario') redirect('/alumno');

  const asignaciones = await prisma.asignacion.findMany({
    where: { curso: { colegioId: sesion.colegioId } },
    include: {
      ensayo: true,
      curso: true,
      intentos: {
        where: { estado: { in: ['ENVIADO', 'EXPIRADO'] } },
        include: {
          resultado: true,
          estudiante: { select: { nombres: true, apellidos: true, codigoAcceso: true } },
        },
        orderBy: { enviadoEn: 'asc' },
      },
    },
    orderBy: { creadaEn: 'desc' },
  });

  // Corrige lo que falte antes de mostrar, para que un intento viejo no quede sin nota.
  for (const asignacion of asignaciones) {
    for (const intento of asignacion.intentos) {
      if (!intento.resultado) {
        await corregirIntento(intento.id);
      }
    }
  }

  const refrescadas = await prisma.asignacion.findMany({
    where: { curso: { colegioId: sesion.colegioId } },
    include: {
      ensayo: true,
      curso: true,
      intentos: {
        where: { estado: { in: ['ENVIADO', 'EXPIRADO'] } },
        include: {
          resultado: true,
          estudiante: { select: { nombres: true, apellidos: true, codigoAcceso: true } },
        },
        orderBy: { enviadoEn: 'asc' },
      },
    },
    orderBy: { creadaEn: 'desc' },
  });

  return (
    <Panel nombre={sesion.nombre} rol={sesion.rol} activo="/correccion">
      <div className="mx-auto max-w-6xl space-y-6 px-6 py-8">
        <Cabecera
          titulo="Corrección"
          detalle="Resultados por curso y por estudiante"
          accion={
            <a
              href="/reportes"
              className="pulsable rounded-xl border border-borde bg-white px-4 py-2.5 text-sm font-medium text-marca transition hover:bg-fondo"
            >
              Ver reportes
            </a>
          }
        />
        {refrescadas.length === 0 ? (
          <div className="rounded-2xl border border-borde bg-white">
            <EstadoVacio
              titulo="Todavía no hay evaluaciones asignadas"
              detalle="Cuando asignes un ensayo a un curso, aquí aparece el detalle por alumno: correctas, logro, escala y nivel, con la opción de anular un intento o prorrogar el plazo."
              accion={
                <a
                  href="/ensayos"
                  className="pulsable mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-acento-boton-hover transition hover:underline"
                >
                  Ir a los ensayos
                  <span aria-hidden="true">→</span>
                </a>
              }
            />
          </div>
        ) : null}

        {refrescadas.map((asignacion) => {
          const conNota = asignacion.intentos.filter((i) => i.resultado);
          const promedio = conNota.length
            ? Math.round(
                (conNota.reduce((suma, i) => suma + Number(i.resultado?.pctLogro ?? 0), 0) /
                  conNota.length) *
                  10
              ) / 10
            : 0;

          const porNivel = new Map<string, number>();
          for (const intento of conNota) {
            const nivel = intento.resultado?.nivelLogro ?? 'Sin nivel';
            porNivel.set(nivel, (porNivel.get(nivel) ?? 0) + 1);
          }

          return (
            <section key={asignacion.id} className="rounded-2xl border border-borde bg-white">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-borde px-5 py-4">
                <div>
                  <h2 className="font-semibold text-marca">{asignacion.ensayo.titulo}</h2>
                  <p className="text-xs text-tenue">
                    {asignacion.curso.nombre} · {asignacion.ensayo.tiempoMin} min ·{' '}
                    {conNota.length} de {asignacion.intentos.length} con resultado
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-fondo px-2.5 py-1 text-xs text-tenue">
                    Logro promedio {promedio}%
                  </span>
                  {[...porNivel.entries()].map(([nivel, cantidad]) => (
                    <span
                      key={nivel}
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        COLOR_NIVEL[nivel] ?? 'bg-borde text-tenue'
                      }`}
                    >
                      {nivel}: {cantidad}
                    </span>
                  ))}
                  <a
                    href={`/seguimiento/${asignacion.id}`}
                    className="pulsable rounded-lg bg-marca px-3 py-1.5 text-xs font-medium text-white transition hover:bg-marca-oscuro"
                  >
                    Seguimiento
                  </a>
                </div>
              </div>

              {conNota.length === 0 ? (
                <p className="px-5 py-6 text-sm text-tenue">
                  Nadie ha rendido esta evaluación todavía.
                </p>
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
                    {conNota.map((intento) => {
                      const r = intento.resultado;
                      const nivel = r?.nivelLogro ?? '';
                      return (
                        <tr key={intento.id} className="border-t border-borde">
                          <td className="px-5 py-2 font-mono text-xs text-tenue">
                            {intento.estudiante.codigoAcceso}
                          </td>
                          <td className="px-3 py-2 text-slate-800">
                            {intento.estudiante.nombres} {intento.estudiante.apellidos}
                          </td>
                          <td className="tabular px-3 py-2 text-right text-slate-700">
                            {r?.correctas ?? 0} / {r?.total ?? 0}
                          </td>
                          <td className="tabular px-3 py-2 text-right text-slate-700">
                            {Number(r?.pctLogro ?? 0)}%
                          </td>
                          <td className="tabular px-3 py-2 text-right text-slate-700">
                            {r?.puntajeEscala ?? '—'}
                          </td>
                          <td className="px-5 py-2">
                            <span
                              className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                                COLOR_NIVEL[nivel] ?? 'bg-borde text-tenue'
                              }`}
                            >
                              {nivel || 'Sin nivel'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </section>
          );
        })}
      </div>
    </Panel>
  );
}
