import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'W-SIMCE · Evaluación estandarizada · Colegio Acrópolis',
  description:
    'Plataforma de evaluación estandarizada del Colegio Acrópolis: banco de ítems, ensayos, rendición en línea, corrección automática y reportes por eje y habilidad.',
  openGraph: {
    title: 'W-SIMCE · Evaluación estandarizada',
    description:
      'Banco de ítems, ensayos, rendición en línea, corrección automática y reportes del Colegio Acrópolis.',
    type: 'website',
    locale: 'es_CL',
  },
};

const BLOQUES = [
  {
    numero: '01',
    titulo: 'Banco de ítems',
    texto:
      '1.926 ítems de 4° básico a II medio, con figuras, textos de lectura y clave. Búsqueda por nivel, eje y habilidad.',
  },
  {
    numero: '02',
    titulo: 'Ensayos',
    texto:
      'Armado manual o al azar por cuotas. Evita repetir preguntas de las últimas evaluaciones e incluye la versión imprimible con hoja de respuestas.',
  },
  {
    numero: '03',
    titulo: 'Rendición',
    texto:
      'Una pregunta por pantalla, con reloj del servidor, guardado en cada paso y cierre automático cuando se acaba el tiempo.',
  },
  {
    numero: '04',
    titulo: 'Corrección',
    texto:
      'Al enviar: puntaje, nivel de logro y desglose por eje, habilidad, Bloom y dificultad. Sin planillas intermedias.',
  },
  {
    numero: '05',
    titulo: 'Reportes',
    texto:
      'Informe por curso, por alumno y por ítem, comparación entre aplicaciones y exportación en CSV o PDF para UTP.',
  },
  {
    numero: '06',
    titulo: 'Administración',
    texto:
      'Nómina por curso con RUN, importación desde Excel, credenciales y registro de cada acción realizada.',
  },
];

const PASOS = [
  {
    numero: '01',
    titulo: 'Se asigna',
    texto: 'El docente elige el ensayo y el curso. El estudiante lo ve al entrar con su código.',
  },
  {
    numero: '02',
    titulo: 'Se rinde',
    texto: 'Cada respuesta se guarda sola. El tiempo lo controla el servidor, no el navegador.',
  },
  {
    numero: '03',
    titulo: 'Se analiza',
    texto: 'La corrección es automática y el informe queda listo para la reunión de UTP.',
  },
];

const PRIVACIDAD = [
  {
    titulo: 'Alojamiento y tránsito',
    texto: 'Datos en PostgreSQL sobre Neon, con cifrado en tránsito y conexiones separadas para lectura y migraciones.',
  },
  {
    titulo: 'Sesión firmada',
    texto: 'Cookie httpOnly con firma HMAC SHA-256. La clave de cada ítem nunca viaja al navegador durante la prueba.',
  },
  {
    titulo: 'Trazabilidad',
    texto: 'Cada acceso, cambio de clave y edición queda en un registro de eventos con fecha y responsable.',
  },
  {
    titulo: 'Acceso por rol',
    texto: 'Administración, UTP y docentes ven solo lo que les corresponde. El estudiante ve únicamente sus evaluaciones.',
  },
];

const ACCESOS = [
  { href: '#plataforma', texto: 'Plataforma' },
  { href: '#como-funciona', texto: 'Cómo funciona' },
  { href: '#privacidad', texto: 'Privacidad' },
];

function Emblema({ className }: { className: string }) {
  return (
    <img
      src="/logo-acropolis.webp"
      alt="Emblema del Colegio Acrópolis"
      width={372}
      height={378}
      className={className}
    />
  );
}

export default function Portada() {
  return (
    <div className="min-h-dvh bg-white">
      <header className="sticky top-0 z-40 border-b border-borde/80 bg-white/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <a href="/" className="flex items-center gap-3" aria-label="W-SIMCE, inicio">
            <Emblema className="h-9 w-9" />
            <span className="flex items-baseline gap-2">
              <span className="text-[15px] font-semibold tracking-tight text-marca">W-SIMCE</span>
              <span className="hidden text-xs text-tenue sm:inline">Colegio Acrópolis</span>
            </span>
          </a>

          <nav className="hidden items-center gap-7 text-sm text-tenue md:flex">
            {ACCESOS.map((a) => (
              <a key={a.href} href={a.href} className="transition hover:text-marca">
                {a.texto}
              </a>
            ))}
          </nav>

          <a
            href="/login"
            className="rounded-full bg-marca px-5 py-2 text-sm font-medium text-white transition hover:bg-marca-oscuro"
          >
            Ingresar
          </a>
        </div>
      </header>

      <main>
        {/* ------------------------------------------------------------- portada */}
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:py-24">
          <div>
            <p className="flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.22em] text-tenue">
              <span className="h-px w-8 bg-acento" aria-hidden="true" />
              Evaluación estandarizada
            </p>

            <h1 className="mt-6 text-balance text-4xl font-semibold leading-[1.08] tracking-tight text-marca sm:text-5xl lg:text-[3.4rem]">
              Del ensayo al informe, sin planillas en el camino.
            </h1>

            <p className="mt-6 max-w-xl text-pretty text-base leading-relaxed text-tenue sm:text-lg">
              W-SIMCE reúne el banco de ítems, la rendición en línea, la corrección automática y
              los reportes del colegio en una sola plataforma.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <a
                href="/login"
                className="rounded-full bg-marca px-6 py-3 text-sm font-medium text-white transition hover:bg-marca-oscuro"
              >
                Ingresar a la plataforma
              </a>
              <a
                href="#plataforma"
                className="rounded-full border border-borde px-6 py-3 text-sm font-medium text-marca transition hover:border-marca/30 hover:bg-fondo"
              >
                Conocer la plataforma
              </a>
            </div>

            <p className="mt-6 text-xs text-tenue">
              Para docentes, UTP y estudiantes del Colegio Acrópolis.
            </p>
          </div>

          <div className="relative flex items-center justify-center">
            <div
              aria-hidden="true"
              className="absolute h-[17rem] w-[17rem] rounded-full border border-borde sm:h-[21rem] sm:w-[21rem] lg:h-[23rem] lg:w-[23rem]"
            />
            <div
              aria-hidden="true"
              className="absolute h-40 w-40 rounded-full bg-acento-suave blur-3xl sm:h-56 sm:w-56"
            />
            <Emblema className="relative h-44 w-44 drop-shadow-[0_10px_28px_rgba(32,40,88,0.14)] sm:h-56 sm:w-56 lg:h-64 lg:w-64" />
          </div>
        </section>

        {/* ------------------------------------------------------------ garantías */}
        <section className="border-y border-borde bg-fondo">
          <div className="mx-auto grid max-w-6xl grid-cols-2 gap-y-7 px-6 py-7 text-center sm:grid-cols-4 sm:divide-x sm:divide-borde">
            {[
              '4° básico a II medio',
              '30 preguntas por ensayo',
              'Corrección automática',
              'Exportación CSV y PDF',
            ].map((texto) => (
              <p
                key={texto}
                className="px-4 text-xs leading-relaxed tracking-wide text-tenue sm:text-[12.5px]"
              >
                {texto}
              </p>
            ))}
          </div>
        </section>

        {/* ------------------------------------------------------------- bloques */}
        <section id="plataforma" className="scroll-mt-20 bg-white">
          <div className="mx-auto max-w-6xl px-6 py-20 md:py-24">
            <div className="max-w-2xl">
              <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-tenue">
                La plataforma
              </p>
              <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-marca sm:text-4xl">
                Seis piezas que ya están funcionando.
              </h2>
              <p className="mt-4 text-pretty leading-relaxed text-tenue">
                No es una maqueta: cada bloque de abajo se usa hoy con los cursos del colegio y el
                banco completo de ítems.
              </p>
            </div>

            <ul className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-borde bg-borde sm:grid-cols-2 lg:grid-cols-3">
              {BLOQUES.map((b) => (
                <li key={b.numero} className="group bg-white p-7 transition hover:bg-fondo">
                  <p className="text-[11px] font-medium tracking-[0.2em] text-acento">{b.numero}</p>
                  <h3 className="mt-4 text-base font-semibold tracking-tight text-marca">
                    {b.titulo}
                  </h3>
                  <p className="mt-2 text-pretty text-sm leading-relaxed text-tenue">{b.texto}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* -------------------------------------------------------- cómo funciona */}
        <section id="como-funciona" className="scroll-mt-20 border-y border-borde bg-fondo">
          <div className="mx-auto max-w-6xl px-6 py-20 md:py-24">
            <div className="max-w-2xl">
              <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-tenue">
                Cómo funciona
              </p>
              <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-marca sm:text-4xl">
                Tres pasos, tres actores.
              </h2>
            </div>

            <ol className="mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
              {PASOS.map((p) => (
                <li key={p.numero} className="border-t border-marca/15 pt-6">
                  <p className="text-[11px] font-medium tracking-[0.2em] text-tenue">{p.numero}</p>
                  <h3 className="mt-3 text-lg font-semibold tracking-tight text-marca">{p.titulo}</h3>
                  <p className="mt-2 text-pretty text-sm leading-relaxed text-tenue">{p.texto}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ----------------------------------------------------------- privacidad */}
        <section id="privacidad" className="scroll-mt-20 bg-white">
          <div className="mx-auto grid max-w-6xl gap-12 px-6 py-20 md:grid-cols-[0.85fr_1.15fr] md:gap-16 md:py-24">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-tenue">
                Privacidad y datos
              </p>
              <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-marca sm:text-4xl">
                Datos de menores, tratados con cuidado.
              </h2>
              <p className="mt-4 text-pretty leading-relaxed text-tenue">
                La plataforma guarda nombres, cursos y resultados de aprendizaje. Nada más de lo
                necesario para evaluar, y con acceso restringido por rol.
              </p>

              <div className="mt-8 rounded-2xl border border-borde bg-fondo p-5">
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-tenue">
                  Estado para producción
                </p>
                <p className="mt-2 text-sm leading-relaxed text-tenue">
                  Antes de operar con datos definitivos falta cerrar la base legal, la minimización,
                  el plazo de retención y el control de acceso conforme a la Ley 21.719. El
                  repositorio del proyecto está público y debe pasar a privado.
                </p>
              </div>
            </div>

            <ul className="divide-y divide-borde border-y border-borde">
              {PRIVACIDAD.map((p) => (
                <li key={p.titulo} className="grid gap-1 py-5 sm:grid-cols-[10rem_1fr] sm:gap-6">
                  <h3 className="text-sm font-semibold text-marca">{p.titulo}</h3>
                  <p className="text-pretty text-sm leading-relaxed text-tenue">{p.texto}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>

      <footer className="border-t border-borde bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Emblema className="h-8 w-8" />
            <div>
              <p className="text-sm font-medium text-marca">W-SIMCE · Colegio Acrópolis</p>
              <p className="text-xs text-tenue">Puente Alto, Chile</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-xs text-tenue">
            <a href="/login" className="transition hover:text-marca">
              Ingresar
            </a>
            <a href="/api/live" className="transition hover:text-marca">
              Estado del servicio
            </a>
            <span>© 2026</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
