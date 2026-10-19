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
    },
  });

  if (!intento) redirect('/alumno');

  const total = intento.items.length;
  const respondidas = intento.items.filter((i) => i.respuesta?.letra).length;
  const expirado = intento.estado === 'EXPIRADO';

  return (
    <div className="min-h-dvh bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-3xl px-6 py-4">
          <Marca subtitulo={intento.asignacion.ensayo.titulo} />
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-5 px-6 py-10">
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-base font-semibold text-slate-900">
            {expirado ? 'Se terminó el tiempo' : 'Evaluación enviada'}
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            {expirado
              ? 'El servidor cerró tu evaluación al cumplirse el plazo, con lo que tenías respondido.'
              : 'Tus respuestas quedaron guardadas.'}{' '}
            {sesion.nombre}, puedes cerrar esta página.
          </p>

          <dl className="mt-5 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl bg-slate-50 p-4">
              <dt className="text-xs uppercase tracking-wide text-slate-400">Respondidas</dt>
              <dd className="tabular mt-1 text-2xl font-semibold text-slate-900">
                {respondidas}
                <span className="text-sm font-normal text-slate-400"> de {total}</span>
              </dd>
            </div>
            <div className="rounded-xl bg-slate-50 p-4">
              <dt className="text-xs uppercase tracking-wide text-slate-400">Tiempo usado</dt>
              <dd className="tabular mt-1 text-2xl font-semibold text-slate-900">
                {expirado ? 'Completo' : formatoDuracion(intento.tiempoUsadoSeg)}
              </dd>
            </div>
            <div className="rounded-xl bg-slate-50 p-4">
              <dt className="text-xs uppercase tracking-wide text-slate-400">Estado</dt>
              <dd className="mt-1 text-sm font-medium text-slate-800">
                {expirado ? 'Cerrada por tiempo' : 'Enviada'}
              </dd>
            </div>
          </dl>

          <p className="mt-5 rounded-xl bg-amber-50 px-4 py-3 text-xs text-amber-800">
            El resultado se publica cuando el docente cierra la corrección. Todavía no está
            disponible.
          </p>

          <a
            href="/alumno"
            className="mt-5 inline-block rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Volver a mis evaluaciones
          </a>
        </section>
      </main>
    </div>
  );
}
