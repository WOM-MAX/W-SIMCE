import { redirect } from 'next/navigation';
import { sesionActual } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Marca } from '@/components/marca';

export const dynamic = 'force-dynamic';

function fecha(d: Date) {
  return d.toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default async function Alumno({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const sesion = await sesionActual();
  if (!sesion) redirect('/login');
  if (sesion.tipo !== 'estudiante') redirect('/');

  const ahora = new Date();

  const asignaciones = sesion.cursoId
    ? await prisma.asignacion.findMany({
        where: { cursoId: sesion.cursoId, cierraEn: { gt: ahora } },
        include: {
          curso: true,
          ensayo: { include: { asignatura: true, _count: { select: { items: true } } } },
        },
        orderBy: { abreEn: 'desc' },
      })
    : [];

  const intentos = await prisma.intento.findMany({
    where: { estudianteId: sesion.id },
    select: { id: true, asignacionId: true, estado: true, numero: true },
  });

  const { error } = await searchParams;
  const MENSAJES: Record<string, string> = {
    asignacion: 'Esa evaluación no está disponible para tu curso.',
    noabre: 'Todavía no se abre esa evaluación.',
    cerrada: 'El plazo de esa evaluación ya terminó.',
    intentos: 'Ya usaste los intentos permitidos.',
    vacio: 'La evaluación no tiene preguntas cargadas.',
    interno: 'No se pudo comenzar. Inténtalo otra vez.',
  };
  const aviso = error ? (MENSAJES[error] ?? MENSAJES.interno) : null;

  return (
    <div className="min-h-dvh bg-fondo">
      <header className="border-b border-borde bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-6 py-4">
          <Marca subtitulo={`Hola, ${sesion.nombre}`} />
          <form action="/api/auth/logout" method="post">
            <button className="rounded-lg border border-borde px-3 py-1.5 text-xs text-slate-600 hover:bg-fondo">
              Salir
            </button>
          </form>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-6 px-6 py-8">
        <h2 className="text-base font-semibold text-marca">Tus evaluaciones</h2>

        {aviso ? (
          <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{aviso}</p>
        ) : null}

        {!sesion.cursoId ? (
          <p className="rounded-2xl border border-dashed border-borde bg-white p-6 text-sm text-slate-600">
            No tienes una matrícula activa. Pide a tu profesor que revise tu situación.
          </p>
        ) : asignaciones.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-borde bg-white p-6 text-sm text-slate-600">
            No hay evaluaciones abiertas para tu curso.
          </p>
        ) : (
          <ul className="space-y-3">
            {asignaciones.map((a) => {
              const propios = intentos.filter((i) => i.asignacionId === a.id);
              const enviado = propios.some((i) => i.estado === 'ENVIADO');
              const enCurso = propios.some((i) => i.estado === 'EN_CURSO');
              const disponible = a.abreEn <= ahora && !enviado;

              const etiqueta = enviado
                ? 'Rendida'
                : enCurso
                  ? 'En curso'
                  : disponible
                    ? 'Disponible'
                    : 'Aún no abre';
              const color = enviado
                ? 'bg-borde text-slate-600'
                : disponible
                  ? 'bg-acento-suave text-acento'
                  : 'bg-amber-50 text-amber-700';

              return (
                <li key={a.id} className="rounded-2xl border border-borde bg-white p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-slate-800">{a.ensayo.titulo}</p>
                      <p className="text-xs text-tenue">
                        {a.ensayo.asignatura.nombre} · {a.curso.nombre} ·{' '}
                        {a.ensayo._count.items} preguntas · {a.ensayo.tiempoMin} min
                      </p>
                      <p className="mt-1 text-xs text-tenue">
                        Abre {fecha(a.abreEn)} · cierra {fecha(a.cierraEn)}
                      </p>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${color}`}>
                      {etiqueta}
                    </span>
                  </div>

                  {enviado ? (
                    <p className="mt-4 text-xs text-tenue">Ya la rendiste.</p>
                  ) : enCurso ? (
                    <a
                      href={`/rendir/${propios.find((i) => i.estado === 'EN_CURSO')?.id}/1`}
                      className="mt-4 inline-block rounded-lg bg-acento px-4 py-2 text-sm font-medium text-white hover:bg-acento-oscuro"
                    >
                      Continuar donde quedaste
                    </a>
                  ) : disponible ? (
                    <form action="/api/rendir/iniciar" method="post" className="mt-4">
                      <input type="hidden" name="asignacionId" value={a.id} />
                      <button className="rounded-lg bg-acento px-4 py-2 text-sm font-medium text-white hover:bg-acento-oscuro">
                        Comenzar
                      </button>
                    </form>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}
