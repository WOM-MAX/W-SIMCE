import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { estudianteActual, cerrarSiVencido, formatoDuracion } from '@/lib/rendicion';
import { Marca } from '@/components/marca';

export const dynamic = 'force-dynamic';

export default async function Fin({ params }: { params: Promise<{ id: string }> }) {
  const sesion = await estudianteActual();
  if (!sesion) redirect('/login');

  const { id } = await params;
  await cerrarSiVencido(id);

  const intento = await prisma.intento.findFirst({
    where: { id, estudianteId: sesion.id },
    include: {
      asignacion: { include: { ensayo: true } },
      items: { select: { respuesta: { select: { letra: true } } } },
      resultado: {
        select: {
          pctLogro: true,
          puntajeEscala: true,
          nivelLogro: true,
          correctas: true,
          total: true,
        },
      },
    },
  });

  if (!intento) redirect('/alumno');

  const total = intento.items.length;
  const respondidas = intento.items.filter((i) => i.respuesta?.letra).length;
  const expirado = intento.estado === 'EXPIRADO';

  const configuracion = await prisma.configuracionColegio.findUnique({
    where: { colegioId: sesion.colegioId },
  });
  const verResultados = configuracion?.estudiantesVenResultados ?? false;
  const resultado = verResultados ? intento.resultado : null;

  return (
    <div className="min-h-dvh bg-fondo">
      <header className="border-b border-borde bg-white">
        <div className="mx-auto max-w-3xl px-6 py-4">
          <Marca subtitulo={intento.asignacion.ensayo.titulo} />
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-5 px-6 py-10">
        <section className="rounded-2xl border border-borde bg-white p-6">
          <h2 className="text-base font-semibold text-marca">
            {expirado ? 'Se terminó el tiempo' : 'Evaluación enviada'}
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            {expirado
              ? 'El servidor cerró tu evaluación al cumplirse el plazo, con lo que tenías respondido.'
              : 'Tus respuestas quedaron guardadas.'}{' '}
            {sesion.nombre}, puedes cerrar esta página.
          </p>

          <dl className="mt-5 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl bg-fondo p-4">
              <dt className="text-xs uppercase tracking-wide text-tenue">Respondidas</dt>
              <dd className="tabular mt-1 text-2xl font-semibold text-marca">
                {respondidas}
                <span className="text-sm font-normal text-tenue"> de {total}</span>
              </dd>
            </div>
            <div className="rounded-xl bg-fondo p-4">
              <dt className="text-xs uppercase tracking-wide text-tenue">Tiempo usado</dt>
              <dd className="tabular mt-1 text-2xl font-semibold text-marca">
                {expirado ? 'Completo' : formatoDuracion(intento.tiempoUsadoSeg)}
              </dd>
            </div>
            <div className="rounded-xl bg-fondo p-4">
              <dt className="text-xs uppercase tracking-wide text-tenue">Estado</dt>
              <dd className="mt-1 text-sm font-medium text-slate-800">
                {expirado ? 'Cerrada por tiempo' : 'Enviada'}
              </dd>
            </div>
          </dl>

          {resultado ? (
            <div className="mt-5 rounded-xl bg-acento-suave px-4 py-4">
              <p className="text-xs uppercase tracking-wide text-marca/70">Tu resultado</p>
              <div className="mt-2 flex flex-wrap items-end gap-4">
                <p className="tabular text-3xl font-semibold text-marca">
                  {resultado.puntajeEscala ?? '—'}
                  <span className="ml-1 text-xs font-normal text-tenue">puntos</span>
                </p>
                <p className="text-sm text-slate-700">
                  {resultado.correctas} de {resultado.total} correctas ·{' '}
                  {Number(resultado.pctLogro)}% de logro
                </p>
                <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-marca">
                  {resultado.nivelLogro ?? 'Sin nivel'}
                </span>
              </div>
            </div>
          ) : (
            <p className="mt-5 rounded-xl bg-amber-50 px-4 py-3 text-xs text-amber-800">
              El resultado se publica cuando el colegio lo habilita. Todavía no está disponible.
            </p>
          )}

          <a
            href="/alumno"
            className="mt-5 inline-block rounded-lg bg-marca px-4 py-2 text-sm font-medium text-white hover:bg-marca-oscuro"
          >
            Volver a mis evaluaciones
          </a>
        </section>
      </main>
    </div>
  );
}
