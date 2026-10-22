import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { sesionActual } from '@/lib/auth';
import { Panel } from '@/components/panel';
import { MODULOS } from '@/lib/modulos';
import { Cabecera, CabezaTarjeta, EstadoVacio, EtiquetaEstado, Tarjeta } from '@/components/ui-panel';

export const dynamic = 'force-dynamic';

const ICONOS: Record<string, string> = {
  estudiantes: 'M16 19a4 4 0 0 0-8 0M12 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6M20 19a3 3 0 0 0-3-3M18 11a2.5 2.5 0 1 0 0-5',
  ensayos: 'M7 3.5h7l4 4V20a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1ZM13 9h4M9 13h6M9 16.5h4',
  items: 'M4 5h16v14H4V5ZM4 10h16M10 10v9',
  cursos: 'M4 6h16M4 12h16M4 18h10',
  colegios: 'M3 20V9l7-4v15M10 20V9l7 4v7M21 20V9',
};

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

  // La primera tarjeta manda: se destaca en azul y el resto acompaña.
  const tarjetas = [
    { clave: 'estudiantes', etiqueta: 'Estudiantes', valor: estudiantes, nota: 'matriculados' },
    { clave: 'ensayos', etiqueta: 'Ensayos', valor: ensayos, nota: 'generados' },
    { clave: 'items', etiqueta: 'Ítems en banco', valor: items, nota: 'disponibles' },
    { clave: 'cursos', etiqueta: 'Cursos', valor: cursos, nota: 'activos' },
    { clave: 'colegios', etiqueta: 'Colegios', valor: colegios, nota: 'en la plataforma' },
  ];

  const listos = MODULOS.filter((m) => m.estado === 'listo').length;
  const avance = Math.round((listos / MODULOS.length) * 100);

  return (
    <Panel nombre={sesion.nombre} rol={sesion.rol} activo="/panel">
      <div className="mx-auto max-w-6xl space-y-6 px-6 py-8">
        <Cabecera
          titulo="Inicio"
          detalle="Evaluación estandarizada · Colegio Acrópolis"
          accion={
            <a
              href="/ensayos/nuevo"
              className="inline-flex items-center gap-2 rounded-xl bg-acento-boton px-4 py-2.5 text-sm font-medium text-white transition hover:bg-acento-boton-hover focus:outline-none focus-visible:ring-4 focus-visible:ring-acento/25"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Generar ensayo
            </a>
          }
        />

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {tarjetas.map((t, i) => {
            const destacada = i === 0;
            return (
              <div
                key={t.clave}
                className={`rounded-2xl border p-5 transition-shadow hover:shadow-[0_10px_28px_rgba(32,40,88,0.08)] ${
                  destacada ? 'border-marca bg-marca' : 'border-borde bg-white'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <p
                    className={`text-[11px] font-medium uppercase tracking-[0.14em] ${
                      destacada ? 'text-white/60' : 'text-tenue'
                    }`}
                  >
                    {t.etiqueta}
                  </p>
                  <svg
                    viewBox="0 0 24 24"
                    className={`h-4 w-4 shrink-0 ${destacada ? 'text-acento' : 'text-tenue/50'}`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d={ICONOS[t.clave]} />
                  </svg>
                </div>
                <p
                  className={`tabular mt-2 text-[34px] font-semibold leading-none ${
                    destacada ? 'text-white' : 'text-marca'
                  }`}
                >
                  {t.valor}
                </p>
                <p className={`mt-1.5 text-[11px] ${destacada ? 'text-white/50' : 'text-tenue/80'}`}>
                  {t.nota}
                </p>
              </div>
            );
          })}
        </section>

        <Tarjeta>
          <CabezaTarjeta
            titulo="Asignaciones de la rebanada"
            extra={
              <span className="rounded-full bg-acento-suave px-2.5 py-1 text-[11px] font-medium text-acento-boton-hover">
                Fase 0 · 4° básico Matemática
              </span>
            }
          />
          {asignaciones.length === 0 ? (
            <EstadoVacio
              titulo="Sin asignaciones todavía"
              detalle="Un ensayo se crea en borrador y recién existe para los alumnos cuando lo asignas a un curso con fecha de apertura y cierre."
              accion={
                <a
                  href="/ensayos/nuevo"
                  className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-acento-boton-hover transition hover:underline"
                >
                  Generar el primero
                  <span aria-hidden="true">→</span>
                </a>
              }
            />
          ) : (
            <div className="divide-y divide-borde">
              {asignaciones.map((a) => (
                <div key={a.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                  <div>
                    <p className="text-[14px] font-medium text-marca">{a.ensayo.titulo}</p>
                    <p className="text-xs text-tenue">
                      {a.curso.nombre} · abre {a.abreEn.toLocaleDateString('es-CL')} · cierra{' '}
                      {a.cierraEn.toLocaleDateString('es-CL')}
                    </p>
                  </div>
                  <span className="rounded-full bg-fondo px-2.5 py-1 text-xs text-tenue">
                    {a.ensayo.tiempoMin} min
                  </span>
                </div>
              ))}
            </div>
          )}
        </Tarjeta>

        <Tarjeta>
          <CabezaTarjeta
            titulo="Módulos"
            extra={
              <div className="flex items-center gap-3">
                <div className="h-1.5 w-28 overflow-hidden rounded-full bg-fondo">
                  <span
                    className="block h-full rounded-full bg-teal"
                    style={{ width: `${avance}%` }}
                  />
                </div>
                <span className="text-[11px] text-tenue">
                  {listos} de {MODULOS.length}
                </span>
              </div>
            }
          />
          <ul className="divide-y divide-borde">
            {MODULOS.map((m) => (
              <li
                key={m.id}
                className="flex flex-wrap items-start gap-3 px-5 py-4 transition-colors hover:bg-fondo/60"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-medium text-marca">{m.nombre}</p>
                  <p className="text-xs text-tenue">{m.detalle}</p>
                </div>
                <EtiquetaEstado estado={m.estado} />
              </li>
            ))}
          </ul>
        </Tarjeta>
      </div>
    </Panel>
  );
}
