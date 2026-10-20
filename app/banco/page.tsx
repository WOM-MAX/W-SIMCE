import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { sesionActual } from '@/lib/auth';
import { Panel } from '@/components/panel';
import { Figura } from '@/components/figura';
import { TextoPotencia } from '@/components/texto-potencia';

export const dynamic = 'force-dynamic';

const POR_PAGINA = 10;

const COLOR_BLOOM: Record<string, string> = {
  conocimiento: 'bg-borde text-tenue',
  comprension: 'bg-fondo text-slate-700',
  aplicacion: 'bg-acento-suave text-marca',
  analisis: 'bg-amber-50 text-amber-800',
  sintesis: 'bg-rose-50 text-rose-700',
  evaluacion: 'bg-emerald-50 text-emerald-800',
};

export default async function Banco({
  searchParams,
}: {
  searchParams: Promise<{ filtro?: string; pagina?: string; codigo?: string; figura?: string }>;
}) {
  const sesion = await sesionActual();
  if (!sesion) redirect('/login');
  if (sesion.tipo !== 'usuario') redirect('/alumno');

  const params = await searchParams;
  const filtro = params.filtro === 'todos' ? 'todos' : 'generados';
  const soloFiguras = params.figura === '1';
  const pagina = Math.max(0, Number.parseInt(params.pagina ?? '0', 10) || 0);
  const busqueda = (params.codigo ?? '').trim();

  const where = {
    ...(filtro === 'generados' ? { codigo: { startsWith: 'GEN' } } : {}),
    ...(soloFiguras ? { figuraId: { not: null } } : {}),
    ...(busqueda ? { codigo: { contains: busqueda, mode: 'insensitive' as const } } : {}),
  };

  const [total, items] = await Promise.all([
    prisma.item.count({ where }),
    prisma.item.findMany({
      where,
      include: {
        nivel: true,
        asignatura: true,
        eje: true,
        figura: true,
        versiones: { include: { alternativas: { orderBy: { letra: 'asc' } } } },
      },
      orderBy: { codigo: 'asc' },
      skip: pagina * POR_PAGINA,
      take: POR_PAGINA,
    }),
  ]);

  const paginas = Math.max(1, Math.ceil(total / POR_PAGINA));

  return (
    <Panel nombre={sesion.nombre} rol={sesion.rol} activo="/banco">
      <div className="mx-auto max-w-4xl space-y-6 px-6 py-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-marca">Banco de ítems</h1>
            <p className="text-xs text-tenue">
              {total} ítems en este filtro. Los generados llevan código GEN.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              href="/banco"
              className={`rounded-lg border px-3 py-1.5 text-xs ${
                filtro === 'generados' && !soloFiguras
                  ? 'border-acento bg-acento-suave text-marca'
                  : 'border-borde text-slate-700'
              }`}
            >
              Generados
            </a>
            <a
              href="/banco?figura=1"
              className={`rounded-lg border px-3 py-1.5 text-xs ${
                filtro === 'generados' && soloFiguras
                  ? 'border-acento bg-acento-suave text-marca'
                  : 'border-borde text-slate-700'
              }`}
            >
              Generados con figura
            </a>
            <a
              href="/banco?filtro=todos&figura=1"
              className={`rounded-lg border px-3 py-1.5 text-xs ${
                filtro === 'todos' && soloFiguras
                  ? 'border-acento bg-acento-suave text-marca'
                  : 'border-borde text-slate-700'
              }`}
            >
              Todos con figura
            </a>
            <a
              href="/banco?filtro=todos"
              className={`rounded-lg border px-3 py-1.5 text-xs ${
                filtro === 'todos' && !soloFiguras
                  ? 'border-acento bg-acento-suave text-marca'
                  : 'border-borde text-slate-700'
              }`}
            >
              Todos
            </a>
          </div>
        </div>

        <form action="/banco" method="get" className="flex flex-wrap items-end gap-2">
          <input type="hidden" name="filtro" value={filtro} />`n          {soloFiguras ? <input type="hidden" name="figura" value="1" /> : null}
          <label className="block text-xs font-medium uppercase tracking-wide text-tenue">
            Buscar por código
            <input
              name="codigo"
              defaultValue={busqueda}
              placeholder="GEN2M-MAT-014"
              className="mt-1 w-56 rounded-lg border border-borde px-3 py-2 text-sm text-marca"
            />
          </label>
          <button className="rounded-lg border border-borde px-3 py-2 text-xs text-slate-700 hover:bg-fondo">
            Buscar
          </button>
        </form>

        <ul className="space-y-4">
          {items.map((item) => {
            const v = item.versiones[0];
            return (
              <li key={item.id} className="rounded-2xl border border-borde bg-white p-5">
                <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-mono text-tenue">{item.codigo}</span>
                  <span className="text-tenue">
                    {item.nivel.nombre} · {item.asignatura.nombre} · {item.eje.nombre}
                  </span>
                  <span className={`rounded-full px-2 py-0.5 font-medium ${COLOR_BLOOM[item.bloom] ?? 'bg-borde text-tenue'}`}>
                    {item.bloom}
                  </span>
                  <span className="rounded-full bg-fondo px-2 py-0.5 text-tenue">{item.habilidad}</span>
                  <span className="rounded-full bg-fondo px-2 py-0.5 text-tenue">{item.dificultad}</span>
                  {item.figura ? (
                    <span className="rounded-full bg-acento-suave px-2 py-0.5 text-marca">con figura</span>
                  ) : null}
                </div>

                <TextoPotencia className="block whitespace-pre-line text-sm text-slate-800" texto={v?.enunciado ?? ``} />

                {item.figura ? (
                  <div className="my-3 max-w-sm border border-borde p-2 text-slate-900">
                    <Figura primitivas={item.figura.primitivas} className="max-h-64 w-full" />
                  </div>
                ) : null}

                <ul className="mt-2 space-y-1">
                  {(v?.alternativas ?? []).map((a) => (
                    <li
                      key={a.id}
                      className={`flex gap-2 rounded px-2 py-1 text-sm ${
                        a.letra === v?.clave ? 'bg-acento-suave font-medium text-marca' : 'text-slate-700'
                      }`}
                    >
                      <span className="w-4 shrink-0 font-semibold">{a.letra}</span>
                      <span><TextoPotencia texto={a.texto ?? ``} /></span>
                      {a.letra === v?.clave ? (
                        <span className="ml-auto text-xs uppercase tracking-wide">clave</span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </li>
            );
          })}
          {items.length === 0 ? (
            <li className="rounded-2xl border border-dashed border-borde bg-white p-6 text-sm text-tenue">
              No hay ítems con ese filtro.
            </li>
          ) : null}
        </ul>

        {paginas > 1 ? (
          <div className="flex items-center justify-between text-xs text-tenue">
            <a
              href={`/banco?filtro=${filtro}&pagina=${Math.max(0, pagina - 1)}${soloFiguras ? "&figura=1" : ""}`}
              className={`rounded-lg border border-borde px-3 py-1.5 ${
                pagina === 0 ? 'pointer-events-none opacity-40' : 'hover:bg-fondo'
              }`}
            >
              Anterior
            </a>
            <span>
              Página {pagina + 1} de {paginas}
            </span>
            <a
              href={`/banco?filtro=${filtro}&pagina=${Math.min(paginas - 1, pagina + 1)}${soloFiguras ? "&figura=1" : ""}`}
              className={`rounded-lg border border-borde px-3 py-1.5 ${
                pagina >= paginas - 1 ? 'pointer-events-none opacity-40' : 'hover:bg-fondo'
              }`}
            >
              Siguiente
            </a>
          </div>
        ) : null}
      </div>
    </Panel>
  );
}
