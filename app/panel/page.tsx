import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { sesionActual } from '@/lib/auth';
import { Panel } from '@/components/panel';
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
    <Panel nombre={sesion.nombre} rol={sesion.rol} activo="/panel">
      <div className="mx-auto max-w-6xl space-y-6 px-6 py-8">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-marca">Inicio</h1>
          <p className="text-xs text-tenue">Evaluación estandarizada · Colegio Acrópolis</p>
        </div>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {tarjetas.map((t) => (
            <div key={t.etiqueta} className="rounded-2xl border border-borde bg-white p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-tenue">{t.etiqueta}</p>
              <p className="tabular mt-1 text-3xl font-semibold text-marca">{t.valor}</p>
            </div>
          ))}
        </section>

        <section className="rounded-2xl border border-borde bg-white">
          <div className="flex items-center justify-between border-b border-borde px-5 py-4">
            <h2 className="font-semibold text-marca">Asignaciones de la rebanada</h2>
            <span className="rounded-full bg-acento-suave px-2.5 py-1 text-xs font-medium text-marca">
              Fase 0 · 4° básico Matemática
            </span>
          </div>
          <div className="divide-y divide-borde">
            {asignaciones.map((a) => (
              <div key={a.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                <div>
                  <p className="font-medium text-slate-800">{a.ensayo.titulo}</p>
                  <p className="text-xs text-tenue">
                    {a.curso.nombre} · abre {a.abreEn.toLocaleDateString('es-CL')} · cierra{' '}
                    {a.cierraEn.toLocaleDateString('es-CL')}
                  </p>
                </div>
                <span className="rounded-full bg-borde px-2.5 py-1 text-xs text-slate-600">
                  {a.ensayo.tiempoMin} min
                </span>
              </div>
            ))}
            {asignaciones.length === 0 && (
              <p className="px-5 py-10 text-center text-sm text-tenue">
                Todavía no hay asignaciones. Genera un ensayo y asígnalo a un curso.
              </p>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-borde bg-white">
          <div className="flex items-center justify-between border-b border-borde px-5 py-4">
            <h2 className="font-semibold text-marca">Módulos</h2>
            <span className="text-xs text-tenue">
              {MODULOS.filter((m) => m.estado === 'listo').length} de {MODULOS.length} listos
            </span>
          </div>
          <ul className="divide-y divide-borde">
            {MODULOS.map((m) => (
              <li key={m.id} className="flex flex-wrap items-start gap-3 px-5 py-4">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-slate-800">{m.nombre}</p>
                  <p className="text-xs text-tenue">{m.detalle}</p>
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
      </div>
    </Panel>
  );
}
