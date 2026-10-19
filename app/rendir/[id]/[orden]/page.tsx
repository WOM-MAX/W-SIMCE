import { redirect } from 'next/navigation';
import { estudianteActual, cerrarSiVencido, intentoDelEstudiante } from '@/lib/rendicion';
import { Marca } from '@/components/marca';
import { Figura } from '@/components/figura';
import { Reloj } from '@/components/reloj';

export const dynamic = 'force-dynamic';

export default async function Pregunta({
  params,
}: {
  params: Promise<{ id: string; orden: string }>;
}) {
  const sesion = await estudianteActual();
  if (!sesion) redirect('/login');

  const { id, orden } = await params;
  const pedido = Number.parseInt(orden, 10);

  const vencido = await cerrarSiVencido(id);
  if (vencido) redirect(`/rendir/${id}/fin`);

  const intento = await intentoDelEstudiante(id, sesion.id);
  if (!intento) redirect('/alumno');
  if (intento.estado !== 'EN_CURSO') redirect(`/rendir/${id}/fin`);

  const total = intento.items.length;
  if (total === 0) redirect(`/rendir/${id}/fin`);

  const actual = Number.isFinite(pedido) ? Math.min(Math.max(1, pedido), total) : 1;
  if (actual !== pedido) redirect(`/rendir/${id}/${actual}`);

  const item = intento.items[actual - 1];
  const version = item.itemVersion;
  const lectura = version.item.texto;
  const figura = version.item.figura;
  const elegida = item.respuesta?.letra ?? null;

  const respondidas = intento.items.filter((i) => i.respuesta?.letra).length;
  const ultima = actual === total;

  return (
    <div className="min-h-dvh bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 px-6 py-4">
          <Marca subtitulo={intento.asignacion.ensayo.titulo} />
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500">
              Pregunta {actual} de {total}
            </span>
            <Reloj limiteIso={intento.fechaLimite.toISOString()} />
          </div>
        </div>
        <div className="h-1 w-full bg-slate-100">
          <div
            className="h-1 bg-teal-500 transition-all"
            style={{ width: `${Math.round((respondidas / total) * 100)}%` }}
          />
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-5 px-6 py-8">
        {lectura ? (
          <details className="rounded-2xl border border-slate-200 bg-white px-5 py-4" open={actual === 1}>
            <summary className="cursor-pointer text-sm font-medium text-slate-700">
              Texto de lectura: {lectura.titulo}
            </summary>
            <div className="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-700">
              {lectura.cuerpo}
            </div>
            {lectura.fuente ? (
              <p className="mt-3 text-xs text-slate-400">Fuente: {lectura.fuente}</p>
            ) : null}
          </details>
        ) : null}

        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <p className="mb-4 whitespace-pre-line text-base leading-relaxed text-slate-900">
            {version.enunciado}
          </p>

          {figura ? (
            <div className="mb-5 rounded-xl border border-slate-100 bg-white p-3 text-slate-900">
              <Figura primitivas={figura.primitivas} />
            </div>
          ) : null}

          <form action="/api/rendir/respuesta" method="post" className="space-y-3">
            <input type="hidden" name="intentoId" value={intento.id} />
            <input type="hidden" name="orden" value={actual} />

            <div className="space-y-2">
              {version.alternativas.map((alt) => (
                <label
                  key={alt.id}
                  className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-3 text-sm transition hover:border-teal-400 has-[:checked]:border-teal-500 has-[:checked]:bg-teal-50/40"
                >
                  <input
                    type="radio"
                    name="letra"
                    value={alt.letra}
                    defaultChecked={elegida === alt.letra}
                    className="mt-0.5 h-4 w-4 accent-teal-600"
                  />
                  <span className="font-mono text-xs text-slate-400">{alt.letra}</span>
                  <span className="flex-1 text-slate-800">{alt.texto ?? ''}</span>
                </label>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <button
                type="submit"
                name="accion"
                value="anterior"
                disabled={actual === 1}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40"
              >
                Anterior
              </button>

              <span className="text-xs text-slate-400">
                {respondidas} de {total} respondidas
              </span>

              {ultima ? (
                <button
                  type="submit"
                  name="accion"
                  value="enviar"
                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
                >
                  Enviar evaluación
                </button>
              ) : (
                <button
                  type="submit"
                  name="accion"
                  value="siguiente"
                  className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
                >
                  Guardar y seguir
                </button>
              )}
            </div>
          </form>
        </section>

        <p className="text-center text-xs text-slate-400">
          Cada paso guarda tu respuesta. Si el tiempo termina, el servidor cierra la evaluación
          con lo que lleves respondido.
        </p>
      </main>
    </div>
  );
}
