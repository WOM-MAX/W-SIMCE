import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'W-SIMCE · Todo para evaluar, en un solo lugar · Colegio Acrópolis',
  description:
    'El banco de ítems del Colegio Acrópolis en un solo lugar: preguntas con su objetivo y su clave, ensayos que se arman solos, versión imprimible, rendición en línea, corrección automática y reportes por eje y habilidad.',
  openGraph: {
    title: 'W-SIMCE · Todo para evaluar, en un solo lugar',
    description:
      'Preguntas con su objetivo y su clave, ensayos, imprimible, rendición y reportes del Colegio Acrópolis.',
    type: 'website',
    locale: 'es_CL',
  },
};

const CICLO = [
  {
    icono: 'M10.5 10.5 21 21M10.5 3a7.5 7.5 0 1 0 0 15 7.5 7.5 0 0 0 0-15Z',
    titulo: 'Buscar',
    texto: 'Filtra por curso, eje u objetivo. La pregunta aparece con su clave.',
  },
  {
    icono: 'M7 3.5h7l4 4V19a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 19V5a1.5 1.5 0 0 1 1-1.5ZM14 3.5V8h4M9 12h6M9 16h4',
    titulo: 'Armar',
    texto: 'El ensayo se compone por cuotas y evita repetir lo ya aplicado.',
  },
  {
    icono: 'M7 8V4h10v4M7 17H5.5A1.5 1.5 0 0 1 4 15.5v-5A1.5 1.5 0 0 1 5.5 9h13A1.5 1.5 0 0 1 20 10.5v5a1.5 1.5 0 0 1-1.5 1.5H17M7 13h10v7H7v-7Z',
    titulo: 'Aplicar',
    texto: 'En papel con hoja de respuestas, o en línea con reloj y guardado.',
  },
  {
    icono: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM8 12.5l2.5 2.5L16 9.5',
    titulo: 'Corregir',
    texto: 'Automática al enviar: puntaje, nivel de logro y desglose.',
  },
  {
    icono: 'M4 19h16M7 16V9M12 16V5M17 16v-4',
    titulo: 'Leer',
    texto: 'Informe por curso, alumno y eje, listo para la reunión de UTP.',
  },
];

const ROLES = [
  {
    titulo: 'Dirección',
    texto:
      'Qué se evalúa, con qué criterio y qué muestran los resultados. Cada cambio queda registrado y el acceso va por rol.',
  },
  {
    titulo: 'Coordinación académica',
    texto:
      'El material en un solo banco, cada pregunta con su objetivo, su clave y su figura. Sin adaptar formatos a mano.',
  },
  {
    titulo: 'Docentes',
    texto:
      'Elegir el ensayo, imprimirlo o aplicarlo en línea. La corrección y el informe no son trabajo extra.',
  },
];

const FICHA = [
  { etiqueta: 'Objetivo', valor: 'OA 14 · Números' },
  { etiqueta: 'Eje', valor: 'Números y operaciones' },
  { etiqueta: 'Habilidad', valor: 'Resolver problemas' },
  { etiqueta: 'Bloom', valor: 'Aplicación' },
  { etiqueta: 'Dificultad', valor: 'Media' },
];

const PRIVACIDAD = [
  {
    titulo: 'Alojamiento',
    texto:
      'Datos en PostgreSQL sobre Neon, con cifrado en tránsito y conexiones separadas para lectura y migraciones.',
  },
  {
    titulo: 'Sesión firmada',
    texto:
      'Cookie httpOnly con firma HMAC SHA-256. La clave de cada ítem nunca viaja al navegador durante la prueba.',
  },
  {
    titulo: 'Trazabilidad',
    texto: 'Cada acceso, cambio de clave y edición queda en un registro con fecha y responsable.',
  },
  {
    titulo: 'Acceso por rol',
    texto:
      'Administración, UTP y docentes ven solo lo que les corresponde. El estudiante ve únicamente sus evaluaciones.',
  },
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

function Icono({ d, className = 'h-6 w-6' }: { d: string; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  );
}

/** El emblema como sello, con la órbita del colegio girando muy lento. */
function Sello() {
  return (
    <div className="relative mx-auto flex h-[21rem] w-[21rem] items-center justify-center sm:h-[26rem] sm:w-[26rem]">
      <div aria-hidden="true" className="absolute h-64 w-64 rounded-full bg-acento/25 blur-[80px]" />

      <svg viewBox="0 0 400 400" className="orbita absolute inset-0 h-full w-full" aria-hidden="true">
        <ellipse
          cx="200"
          cy="200"
          rx="186"
          ry="70"
          transform="rotate(-22 200 200)"
          fill="none"
          stroke="#ffffff"
          strokeOpacity="0.22"
          strokeWidth="1.2"
        />
        <circle cx="372" cy="158" r="8" fill="#ffffff" fillOpacity="0.6" />
        <circle cx="30" cy="244" r="6" fill="#f84828" />
        <circle cx="322" cy="296" r="5" fill="#ffffff" fillOpacity="0.4" />
      </svg>
      <svg viewBox="0 0 400 400" className="absolute inset-0 h-full w-full" aria-hidden="true">
        <ellipse
          cx="200"
          cy="200"
          rx="176"
          ry="60"
          transform="rotate(18 200 200)"
          fill="none"
          stroke="#ffffff"
          strokeOpacity="0.08"
          strokeWidth="1"
        />
      </svg>

      <div className="relative grid h-44 w-44 place-items-center rounded-full bg-white shadow-[0_28px_70px_rgba(0,0,0,0.4)] sm:h-56 sm:w-56">
        <Emblema className="h-36 w-36 sm:h-44 sm:w-44" />
      </div>
    </div>
  );
}

export default function Portada() {
  return (
    <div className="min-h-dvh bg-white">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-marca/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <a href="/" className="flex items-center gap-3" aria-label="W-SIMCE, inicio">
            <Emblema className="h-9 w-9 rounded-full bg-white/90 p-0.5" />
            <span className="flex items-baseline gap-2">
              <span className="text-[15px] font-semibold tracking-tight text-white">W-SIMCE</span>
              <span className="hidden text-xs text-white/50 sm:inline">Colegio Acrópolis</span>
            </span>
          </a>
          <a
            href="/login"
            className="rounded-full bg-acento px-5 py-2 text-sm font-medium text-white transition hover:bg-acento-oscuro"
          >
            Ingresar
          </a>
        </div>
      </header>

      <main>
        {/* ------------------------------------------------------------- hero */}
        <section className="relative overflow-hidden bg-marca">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-[0.05]"
            style={{
              backgroundImage:
                'linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)',
              backgroundSize: '64px 64px',
            }}
          />
          <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-6 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10 lg:py-24">
            <div className="aparecer">
              <p className="flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.24em] text-white/50">
                <span className="h-px w-8 bg-acento" aria-hidden="true" />
                Colegio Acrópolis
              </p>

              <h1 className="mt-7 text-balance text-4xl font-semibold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-[3.5rem]">
                Todo lo que necesitas para evaluar, en un solo lugar.
              </h1>

              <p className="mt-6 max-w-xl text-pretty text-base leading-relaxed text-white/70 sm:text-lg">
                Preguntas con su objetivo y su clave, ensayos que se arman solos, corrección
                automática y reportes para la reunión. Sin carpetas, sin formatos, sin planillas.
              </p>

              <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-3">
                <a
                  href="/login"
                  className="rounded-full bg-acento px-6 py-3 text-sm font-medium text-white transition hover:bg-acento-oscuro"
                >
                  Ingresar
                </a>
                <a
                  href="#ciclo"
                  className="text-sm font-medium text-white/70 underline-offset-4 transition hover:text-white hover:underline"
                >
                  Ver el ciclo completo
                </a>
              </div>

              <p className="mt-8 text-xs text-white/45">
                En uso hoy en los cursos del colegio, con coordinación académica.
              </p>
            </div>

            <Sello />
          </div>
        </section>

        {/* ---------------------------------------------------------- el problema */}
        <section className="bg-white">
          <div className="mx-auto grid max-w-6xl gap-10 px-6 py-20 md:grid-cols-[0.95fr_1.05fr] md:gap-16 md:py-24">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-tenue">
                De dónde viene
              </p>
              <blockquote className="mt-5 border-l-2 border-acento pl-6">
                <p className="text-balance text-2xl font-medium leading-snug tracking-tight text-marca sm:text-3xl">
                  «El material es escaso, y lo poco que hay no viene listo.»
                </p>
              </blockquote>
              <p className="mt-6 text-pretty leading-relaxed text-tenue">
                No es la corrección ni el informe: es conseguir la pregunta adecuada. Y no es el
                problema de una persona —está en dirección, en coordinación y en el aula—, así que la
                solución tampoco puede vivir en una carpeta compartida.
              </p>
            </div>

            <ul className="divide-y divide-borde border-y border-borde">
              {[
                {
                  titulo: 'Está repartido',
                  texto:
                    'PDFs, Word, presentaciones y pruebas antiguas. Buscar una pregunta de un eje específico puede costar más que aplicarla.',
                },
                {
                  titulo: 'No viene listo',
                  texto:
                    'Lo descargado trae otro formato, otro nivel o ninguna clave. Adaptarlo a mano es el trabajo que nadie ve.',
                },
                {
                  titulo: 'La calidad es despareja',
                  texto:
                    'Preguntas sin respuesta correcta, figuras mal dibujadas, alternativas incompletas. Se termina usando lo mismo de siempre.',
                },
              ].map((d) => (
                <li key={d.titulo} className="grid gap-1 py-5 sm:grid-cols-[9.5rem_1fr] sm:gap-6">
                  <h3 className="text-sm font-semibold text-marca">{d.titulo}</h3>
                  <p className="text-pretty text-sm leading-relaxed text-tenue">{d.texto}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* --------------------------------------------------------------- ciclo */}
        <section id="ciclo" className="scroll-mt-20 border-y border-borde bg-fondo">
          <div className="mx-auto max-w-6xl px-6 py-20 md:py-24">
            <div className="max-w-2xl">
              <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-tenue">
                El ciclo completo
              </p>
              <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-marca sm:text-4xl">
                Cinco pasos que hoy viven en cinco lugares distintos.
              </h2>
            </div>

            <ol className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-5 lg:gap-5">
              {CICLO.map((p, i) => (
                <li key={p.titulo} className="relative border-t border-marca/15 pt-6">
                  <span className="absolute -top-[5px] left-0 h-2 w-2 rounded-full bg-acento" />
                  <p className="text-[11px] font-medium tracking-[0.2em] text-tenue">
                    {String(i + 1).padStart(2, '0')}
                  </p>
                  <span className="mt-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white text-marca ring-1 ring-borde">
                    <Icono d={p.icono} className="h-5 w-5" />
                  </span>
                  <h3 className="mt-3 text-base font-semibold text-marca">{p.titulo}</h3>
                  <p className="mt-1.5 text-pretty text-sm leading-relaxed text-tenue">{p.texto}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* --------------------------------------------------------------- roles */}
        <section className="bg-marca">
          <div className="mx-auto max-w-6xl px-6 py-20 md:py-24">
            <div className="max-w-2xl">
              <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-white/50">
                Para quién
              </p>
              <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                Tres lecturas de la misma plataforma.
              </h2>
              <p className="mt-4 text-pretty leading-relaxed text-white/60">
                Dirección, coordinación y aula miran cosas distintas. Cada una tiene su vista, y
                ninguna necesita pedirle una planilla a otra.
              </p>
            </div>

            <ul className="mt-12 grid gap-6 md:grid-cols-3">
              {ROLES.map((r) => (
                <li key={r.titulo} className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
                  <h3 className="text-base font-semibold text-white">{r.titulo}</h3>
                  <p className="mt-2 text-pretty text-sm leading-relaxed text-white/60">{r.texto}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ------------------------------------------------------------- anatomía */}
        <section className="bg-white">
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 md:grid-cols-[0.9fr_1.1fr] md:gap-16 md:py-24">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-tenue">
                La diferencia
              </p>
              <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-marca sm:text-4xl">
                Cada pregunta viene con su ficha.
              </h2>
              <p className="mt-4 text-pretty leading-relaxed text-tenue">
                No es un PDF con una pregunta suelta: es un ítem con su objetivo, su habilidad, su
                dificultad, su clave y su justificación. Por eso se puede buscar, combinar y
                corregir sin volver a leerlo todo.
              </p>
              <p className="mt-4 text-pretty leading-relaxed text-tenue">
                Cuando falte algo, se nota: el filtro del banco muestra qué eje u objetivo quedó
                corto antes de armar el ensayo, no después de aplicarlo.
              </p>
            </div>

            {/* ficha de ejemplo, dibujada: no es una captura de la app */}
            <div className="rounded-2xl border border-borde bg-white p-6 shadow-[0_20px_60px_rgba(32,40,88,0.08)]">
              <p className="mb-3 text-[10px] uppercase tracking-[0.18em] text-tenue/70">
                Ejemplo de ficha
              </p>
              <div className="flex flex-wrap gap-1.5">
                {FICHA.map((f) => (
                  <span
                    key={f.etiqueta}
                    className="rounded-full bg-fondo px-2.5 py-1 text-[11px] text-tenue ring-1 ring-borde"
                  >
                    <span className="text-tenue/60">{f.etiqueta}</span>{' '}
                    <span className="font-medium text-marca">{f.valor}</span>
                  </span>
                ))}
              </div>

              <p className="mt-5 text-sm leading-relaxed text-slate-800">
                Un número se le resta 5 y el resultado se multiplica por 2, obteniendo 11. ¿Qué
                ecuación representa la situación?
              </p>

              <ul className="mt-4 space-y-1.5 text-sm">
                {['2x − 5 = 11', '2(x − 5) = 11', '2x + 5 = 11', 'x/2 − 5 = 11'].map((a, i) => (
                  <li
                    key={a}
                    className={`flex items-center gap-2 rounded-lg px-2 py-1 ${
                      i === 1 ? 'bg-acento-suave font-medium text-marca' : 'text-slate-600'
                    }`}
                  >
                    <span className="w-4 text-xs font-semibold">{'ABCD'[i]}</span>
                    {a}
                    {i === 1 ? (
                      <span className="ml-auto text-[10px] uppercase tracking-wide">clave</span>
                    ) : null}
                  </li>
                ))}
              </ul>

              <p className="mt-4 border-t border-borde pt-3 text-xs leading-relaxed text-tenue">
                <span className="font-medium text-marca">Justificación.</span> Se multiplica por 2 la
                diferencia entre el número y 5: 2(x − 5) = 11.
              </p>
            </div>
          </div>
        </section>

        {/* ----------------------------------------------------------- privacidad */}
        <section id="privacidad" className="scroll-mt-20 border-t border-borde bg-white">
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

      <footer className="bg-marca-oscuro">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Emblema className="h-8 w-8 rounded-full bg-white/90 p-0.5" />
            <div>
              <p className="text-sm font-medium text-white">W-SIMCE · Colegio Acrópolis</p>
              <p className="text-xs text-white/50">Puente Alto, Chile</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-xs text-white/50">
            <a href="/login" className="transition hover:text-white">
              Ingresar
            </a>
            <a href="/api/live" className="transition hover:text-white">
              Estado del servicio
            </a>
            <span>© 2026</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
