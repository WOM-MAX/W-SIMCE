import Link from 'next/link';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { sesionActual } from '@/lib/auth';
import { Marca } from '@/components/marca';
import { MODULOS, ETIQUETA_ESTADO, CLASE_ESTADO } from '@/lib/modulos';

export const dynamic = 'force-dynamic';

export default async function Inicio() {
  const sesion = await sesionActual();
  if (!sesion) redirect('/login');
  if (sesion.tipo === 'estudiante') redirect('/alumno');

  const [colegios, cursos, estudiantes, items, ensayos, asignaciones] = await Promise.all([
    prisma.colegio.count(),
    prisma.curso.count(),
    prisma.estudiante.count(),
    prisma.item.count(),
    prisma.ensayo.count(),
    prisma.asignacion.findMany({
      include: { ensayo: true, curso: true },
      orderBy: { creadaEn: 'desc' },
      take: 5,
    }),
  ]);

  const tarjetas = [
    { etiqueta: 'Colegios', valor: colegios },
    { etiqueta: 'Cursos', valor: cursos },
    { etiqueta: 'Estudiantes', valor: estudiantes },
    { etiqueta: 'Ítems en banco', valor: items },
    { etiqueta: 'Ensayos', valor: ensayos },
  ];

  return (
    <div className="min-h-dvh">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Marca subtitulo="Evaluación estandarizada · Colegio Acrópolis" />
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-slate-500 sm:inline">
              {sesion.nombre} · {sesion.rol}
            </span>
            {sesion.rol === 'ADMIN' || sesion.rol === 'UTP' ? (
              <a
                href="/admin"
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
              >
                Administración
              </a>
            ) : null}
            <Link
              href="/api/health"
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
            >
              Estado de la base
            </Link>
            <form action="/api/auth/logout" method="post">
              <button className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50">
                Salir
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-6 py-8">
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {tarjetas.map((t) => (
            <div key={t.etiqueta} className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{t.etiqueta}</p>
              <p className="tabular mt-1 text-3xl font-semibold text-slate-900">{t.valor}</p>
            </div>
          ))}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h2 className="font-semibold text-slate-900">Asignaciones de la rebanada</h2>
            <span className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-medium text-teal-700">
              Fase 0 · 4° básico Matemática
            </span>
          </div>
          <div className="divide-y divide-slate-50">
            {asignaciones.map((a) => (
              <div key={a.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                <div>
                  <p className="font-medium text-slate-800">{a.ensayo.titulo}</p>
                  <p className="text-xs text-slate-500">
                    {a.curso.nombre} · abre {a.abreEn.toLocaleDateString('es-CL')} · cierra{' '}
                    {a.cierraEn.toLocaleDateString('es-CL')}
                  </p>
                </div>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
                  {a.ensayo.tiempoMin} min
                </span>
              </div>
            ))}
            {asignaciones.length === 0 && (
              <p className="px-5 py-10 text-center text-sm text-slate-500">
                Todavía no hay asignaciones. Corre <code className="rounded bg-slate-100 px-1">pnpm db:seed</code>.
              </p>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h2 className="font-semibold text-slate-900">Módulos</h2>
            <span className="text-xs text-slate-400">
              {MODULOS.filter((m) => m.estado === 'listo').length} de {MODULOS.length} listos
            </span>
          </div>
          <ul className="divide-y divide-slate-50">
            {MODULOS.map((m) => (
              <li key={m.id} className="flex flex-wrap items-start gap-3 px-5 py-4">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-slate-800">{m.nombre}</p>
                  <p className="text-xs text-slate-500">{m.detalle}</p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${CLASE_ESTADO[m.estado]}`}
                >
                  {ETIQUETA_ESTADO[m.estado]}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
