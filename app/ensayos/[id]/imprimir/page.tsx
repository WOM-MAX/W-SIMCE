import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { sesionActual } from '@/lib/auth';
import { Figura } from '@/components/figura';
import { TextoPotencia } from '@/components/texto-potencia';
import { TAMANOS, tamanoDe } from '@/lib/documento';

export const dynamic = 'force-dynamic';

const LETRAS = ['A', 'B', 'C', 'D', 'E'];

export default async function Imprimir({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ clave?: string; tamano?: string }>;
}) {
  const sesion = await sesionActual();
  if (!sesion) redirect('/login');
  if (sesion.tipo !== 'usuario') redirect('/alumno');

  const { id } = await params;
  const { clave, tamano } = await searchParams;
  const conClave = clave === '1';
  const medida = tamanoDe(tamano);
  const hoja = TAMANOS[medida];

  const ensayo = await prisma.ensayo.findFirst({
    where: { id, colegioId: sesion.colegioId },
    include: {
      nivel: true,
      asignatura: true,
      colegio: true,
      items: {
        orderBy: { orden: 'asc' },
        include: {
          itemVersion: {
            include: {
              alternativas: { orderBy: { letra: 'asc' } },
              item: { include: { texto: true, figura: true } },
            },
          },
        },
      },
    },
  });

  if (!ensayo) redirect('/ensayos?error=ensayo');

  // Cada texto de lectura se imprime una sola vez, antes de su primer ítem.
  const textosVistos = new Set<string>();
  const bloques = ensayo.items.map((ei) => {
    const texto = ei.itemVersion.item.texto;
    const primeraVez = texto && !textosVistos.has(texto.id);
    if (texto) textosVistos.add(texto.id);
    return { item: ei, textoPrimeraVez: primeraVez };
  });

  return (
    <div className="min-h-dvh bg-fondo">
      <div className="no-imprimir sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-borde bg-white px-6 py-3">
        <div>
          <p className="text-sm font-medium text-marca">{ensayo.titulo}</p>
          <p className="text-xs text-tenue">
            {conClave ? 'Versión del docente, con la clave marcada' : 'Versión del estudiante'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={`/ensayos/${ensayo.id}/imprimir?clave=${conClave ? '0' : '1'}`}
            className="pulsable rounded-lg border border-borde px-3 py-1.5 text-xs text-slate-700 hover:bg-fondo"
          >
            {conClave ? 'Ver como estudiante' : 'Ver con la clave'}
          </a>
          <a
            href="/ensayos"
            className="pulsable rounded-lg border border-borde px-3 py-1.5 text-xs text-slate-700 hover:bg-fondo"
          >
            Volver
          </a>
          <a
            href={`/api/ensayos/${ensayo.id}/docx?tamano=${medida}${conClave ? '&clave=1' : ''}`}
            className="pulsable rounded-lg bg-marca px-3 py-1.5 text-xs font-medium text-white hover:bg-marca-oscuro"
          >
            Descargar Word
          </a>
          <a
            href={`/api/ensayos/${ensayo.id}/pdf?tamano=${medida}${conClave ? '&clave=1' : ''}`}
            className="pulsable rounded-lg bg-marca px-3 py-1.5 text-xs font-medium text-white hover:bg-marca-oscuro"
          >
            Descargar PDF
          </a>
        </div>
      </div>

      <style>{`@page { size: ${hoja.css}; margin: 0; }`}</style>

      <main
        className="mx-auto bg-white px-8 py-10 text-slate-900 print:px-0 print:py-0"
        style={{ maxWidth: `${hoja.mm[0]}mm` }}
      >
        <header className="hoja mb-8 border-b border-slate-300 pb-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            {ensayo.colegio?.nombre ?? 'Colegio'}
          </p>
          <h1 className="mt-1 text-2xl font-semibold">{ensayo.titulo}</h1>
          <p className="mt-1 text-sm text-slate-600">
            {ensayo.asignatura.nombre} · {ensayo.nivel.nombre} · {ensayo.items.length} preguntas ·{' '}
            {ensayo.tiempoMin === 0 ? 'sin límite de tiempo' : `${ensayo.tiempoMin} minutos`}
          </p>
          <div className="mt-6 grid grid-cols-2 gap-6 text-sm">
            <p>Nombre: ______________________________________</p>
            <p>Curso: ______________ Fecha: ____________</p>
          </div>
          <p className="mt-6 text-xs text-slate-600">
            Instrucciones: marca una sola alternativa por pregunta. Usa la hoja de respuestas del
            final. No se permite el uso de calculadora salvo que el profesor lo indique.
          </p>
        </header>

        {bloques.map(({ item, textoPrimeraVez }, indice) => {
          const v = item.itemVersion;
          const lectura = v.item.texto;
          const figura = v.item.figura;

          return (
            <section key={item.id} className="hoja mb-6">
              {textoPrimeraVez && lectura ? (
                <div className="mb-5 rounded border border-slate-300 p-4 print:border-slate-400">
                  <p className="mb-2 text-sm font-semibold">{lectura.titulo}</p>
                  <div className="whitespace-pre-line text-sm leading-relaxed">{lectura.cuerpo}</div>
                  {lectura.fuente ? (
                    <p className="mt-2 text-xs text-slate-500">Fuente: {lectura.fuente}</p>
                  ) : null}
                </div>
              ) : null}

              <div className="flex gap-3">
                <span className="w-6 shrink-0 text-right text-sm font-semibold">{indice + 1}.</span>
                <div className="min-w-0 flex-1">
                  <TextoPotencia className="block whitespace-pre-line text-sm leading-relaxed" texto={v.enunciado} />

                  {figura ? (
                    <div className="my-3 max-w-md border border-slate-200 p-2 text-slate-900 print:border-slate-400">
                      <Figura primitivas={figura.primitivas} className="max-h-64 w-full" />
                    </div>
                  ) : null}

                  <ul className="mt-3 space-y-1.5">
                    {v.alternativas.map((alt) => {
                      const esClave = alt.letra === v.clave;
                      return (
                        <li key={alt.id} className="flex gap-2 text-sm">
                          <span className="w-4 shrink-0 font-semibold">{alt.letra}</span>
                          <span className="flex-1">
                            {alt.texto ?? ''}
                            {conClave && esClave ? (
                              <span className="ml-2 rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-700">
                                clave
                              </span>
                            ) : null}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            </section>
          );
        })}

        <section className="salto mt-10 border-t border-slate-300 pt-6">
          <h2 className="text-lg font-semibold">Hoja de respuestas</h2>
          <p className="mt-1 text-xs text-slate-600">
            Nombre: ______________________________________ Curso: ______________
          </p>

          <table className="mt-5 w-full text-sm">
            <thead>
              <tr>
                <th className="w-12 py-1 text-left text-xs uppercase tracking-wide text-slate-500">
                  N.º
                </th>
                {LETRAS.map((l) => (
                  <th key={l} className="w-12 py-1 text-center text-xs uppercase tracking-wide text-slate-500">
                    {l}
                  </th>
                ))}
                <th className="w-12 py-1 text-left text-xs uppercase tracking-wide text-slate-500">
                  N.º
                </th>
                {LETRAS.map((l) => (
                  <th key={`b-${l}`} className="w-12 py-1 text-center text-xs uppercase tracking-wide text-slate-500">
                    {l}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: Math.ceil(ensayo.items.length / 2) }).map((_, fila) => {
                const a = fila + 1;
                const b = fila + 1 + Math.ceil(ensayo.items.length / 2);
                return (
                  <tr key={fila} className="border-t border-slate-200">
                    <td className="py-1.5 font-semibold">{a}</td>
                    {LETRAS.map((l) => (
                      <td key={`a-${a}-${l}`} className="py-1.5 text-center text-slate-400">
                        ○
                      </td>
                    ))}
                    <td className="py-1.5 font-semibold">{b <= ensayo.items.length ? b : ''}</td>
                    {LETRAS.map((l) => (
                      <td key={`b-${b}-${l}`} className="py-1.5 text-center text-slate-400">
                        {b <= ensayo.items.length ? '○' : ''}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>

          {conClave ? (
            <div className="mt-8">
              <h3 className="text-sm font-semibold">Clave de corrección</h3>
              <p className="mt-2 font-mono text-xs leading-relaxed">
                {ensayo.items.map((i, n) => `${n + 1}:${i.itemVersion.clave}`).join('  ')}
              </p>
            </div>
          ) : null}
        </section>
      </main>
    </div>
  );
}
