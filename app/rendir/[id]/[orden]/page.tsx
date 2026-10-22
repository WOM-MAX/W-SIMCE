import { redirect } from 'next/navigation';
import { estudianteActual, cerrarSiVencido, intentoDelEstudiante } from '@/lib/rendicion';
import { Marca } from '@/components/marca';
import { Figura } from '@/components/figura';
import { TextoPotencia } from '@/components/texto-potencia';
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
    <div className="min-h-dvh bg-fondo">
      <header className="border-b border-borde bg-white">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 px-6 py-4">
          <Marca subtitulo={intento.asignacion.ensayo.titulo} />
          <div className="flex items-center gap-3">
            <span className="text-xs text-tenue">
              Pregunta {actual} de {total}
            </span>
            <Reloj limiteIso={intento.fechaLimite.toISOString()} />
          </div>
        </div>
        <div className="h-1 w-full bg-borde">
          <div
            className="h-1 bg-acento-suave0 transition-all"
            style={{ width: `${Math.round((respondidas / total) * 100)}%` }}
          />
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-5 px-6 py-8">
        {lectura ? (
          <details className="rounded-2xl border border-borde bg-white px-5 py-4" open={actual === 1}>
            <summary className="pulsable cursor-pointer text-sm font-medium text-slate-700">
              Texto de lectura: {lectura.titulo}
            </summary>
            <div className="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-700">
              {lectura.cuerpo}
            </div>
            {lectura.fuente ? (
              <p className="mt-3 text-xs text-tenue">Fuente: {lectura.fuente}</p>
            ) : null}
          </details>
        ) : null}

        <section className="rounded-2xl border border-borde bg-white p-6">
          <p className="mb-4 whitespace-pre-line text-base leading-relaxed text-marca">
            <TextoPotencia texto={version.enunciado} />
          </p>

          {figura ? (
            <div className="mb-5 rounded-xl border border-borde bg-white p-3 text-marca">
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
                  className="flex cursor-pointer items-start gap-3 rounded-xl border border-borde p-3 text-sm transition hover:border-acento has-[:checked]:border-acento has-[:checked]:bg-acento-suave/40"
                >
                  <input
                    type="radio"
                    name="letra"
                    value={alt.letra}
                    defaultChecked={elegida === alt.letra}
                    className="mt-0.5 h-4 w-4 accent-acento"
                  />
                  <span className="font-mono text-xs text-tenue">{alt.letra}</span>
                  <span className="flex-1 text-slate-800"><TextoPotencia texto={alt.texto ?? ''} /></span>
                </label>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <button
                type="submit"
                name="accion"
                value="anterior"
                disabled={actual === 1}
                className="pulsable rounded-lg border border-borde px-4 py-2 text-sm text-slate-600 hover:bg-fondo disabled:opacity-40"
              >
                Anterior
              </button>

              <span className="text-xs text-tenue">
                {respondidas} de {total} respondidas
              </span>

              {ultima ? (
                <button
                  type="submit"
                  name="accion"
                  value="enviar"
                  className="pulsable rounded-lg bg-marca px-4 py-2 text-sm font-medium text-white hover:bg-marca-oscuro"
                >
                  Enviar evaluación
                </button>
              ) : (
                <button
                  type="submit"
                  name="accion"
                  value="siguiente"
                  className="pulsable rounded-lg bg-acento-boton px-4 py-2 text-sm font-medium text-white hover:bg-acento-boton-hover"
                >
                  Guardar y seguir
                </button>
              )}
            </div>
          </form>
        </section>

        <p className="text-center text-xs text-tenue">
          Cada paso guarda tu respuesta. Si el tiempo termina, el servidor cierra la evaluación
          con lo que lleves respondido.
        </p>
      </main>
    </div>
  );
}
