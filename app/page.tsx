import Link from 'next/link';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function Inicio() {
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
            <span
              className="grid h-10 w-10 place-items-center rounded-xl text-sm font-bold text-white"
              style={{ background: 'linear-gradient(135deg,#14B8A6,#10B981)' }}
            >
              W
            </span>
            <div>
              <h1 className="text-lg font-semibold tracking-tight">W-SIMCE</h1>
              <p className="text-xs text-slate-500">Evaluación estandarizada · Colegio Acrópolis</p>
            </div>
          </div>
          <Link
            href="/api/health"
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
          >
            Estado de la base
          </Link>
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

        <section className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-5 text-sm text-slate-600">
          <p className="font-medium text-slate-800">Siguiente en la rebanada</p>
          <ol className="mt-2 list-decimal space-y-1 pl-5">
            <li>Iniciar intento y rendir 30 preguntas con reloj y autoguardado.</li>
            <li>Cerrar por tiempo en el servidor.</li>
            <li>Reporte por eje y habilidad, con exportación para UTP.</li>
          </ol>
        </section>
      </main>
    </div>
  );
}
