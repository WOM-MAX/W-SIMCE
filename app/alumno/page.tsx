import { redirect } from 'next/navigation';
import { sesionActual } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

function fecha(d: Date) {
  return d.toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default async function Alumno() {
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
    select: { asignacionId: true, estado: true, numero: true },
  });

  return (
    <div className="min-h-dvh bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-3">
            <span
              className="grid h-10 w-10 place-items-center rounded-xl text-sm font-bold text-white"
              style={{ background: 'linear-gradient(135deg,#14B8A6,#10B981)' }}
            >
              W
            </span>
            <div>
              <h1 className="text-lg font-semibold tracking-tight">W-SIMCE</h1>
              <p className="text-xs text-slate-500">Hola, {sesion.nombre}</p>
            </div>
          </div>
          <form action="/api/auth/logout" method="post">
            <button className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50">
              Salir
            </button>
          </form>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-6 px-6 py-8">
        <h2 className="text-base font-semibold text-slate-900">Tus evaluaciones</h2>

        {!sesion.cursoId ? (
          <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-600">
            No tienes una matrícula activa. Pide a tu profesor que revise tu situación.
          </p>
        ) : asignaciones.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-600">
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
                ? 'bg-slate-100 text-slate-600'
                : disponible
                  ? 'bg-teal-50 text-teal-700'
                  : 'bg-amber-50 text-amber-700';

              return (
                <li key={a.id} className="rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-slate-800">{a.ensayo.titulo}</p>
                      <p className="text-xs text-slate-500">
                        {a.ensayo.asignatura.nombre} · {a.curso.nombre} ·{' '}
                        {a.ensayo._count.items} preguntas · {a.ensayo.tiempoMin} min
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        Abre {fecha(a.abreEn)} · cierra {fecha(a.cierraEn)}
                      </p>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${color}`}>
                      {etiqueta}
                    </span>
                  </div>

                  {disponible || enCurso ? (
                    <button
                      disabled
                      className="mt-4 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white opacity-60"
                      title="La rendición se habilita en la siguiente entrega"
                    >
                      {enCurso ? 'Continuar' : 'Comenzar'} (próximamente)
                    </button>
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
