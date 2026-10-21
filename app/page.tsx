import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'W-SIMCE · Evaluación estandarizada · Colegio Acrópolis',
  description:
    'El banco de ítems del Colegio Acrópolis: 1.926 preguntas ordenadas por curso, eje y objetivo, ensayos que se arman solos, versión imprimible, rendición en línea y reportes por habilidad.',
  openGraph: {
    title: 'W-SIMCE · Evaluación estandarizada',
    description:
      '1.926 preguntas ordenadas por curso, eje y objetivo. Ensayos, imprimible, rendición y reportes del Colegio Acrópolis.',
    type: 'website',
    locale: 'es_CL',
  },
};

const ICONOS = {
  banco: 'M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v11a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 17.5v-11ZM8 8h8M8 12h8M8 16h5',
  ensayo: 'M7 3.5h7l4 4V19a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 19V5a1.5 1.5 0 0 1 1-1.5ZM14 3.5V8h4M9 12h6M9 16h4',
  impresora: 'M7 8V4h10v4M7 17H5.5A1.5 1.5 0 0 1 4 15.5v-5A1.5 1.5 0 0 1 5.5 9h13A1.5 1.5 0 0 1 20 10.5v5a1.5 1.5 0 0 1-1.5 1.5H17M7 13h10v7H7v-7Z',
  reloj: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 7v5l3.5 2',
  check: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM8 12.5l2.5 2.5L16 9.5',
  grafico: 'M4 19h16M7 16V9M12 16V5M17 16v-4',
} as const;

const BLOQUES = [
  {
    icono: ICONOS.banco,
    titulo: 'Banco de ítems',
    texto:
      '240 preguntas por curso, filtrables por eje, objetivo de aprendizaje, habilidad y dificultad. Cada una con su clave y su justificación.',
  },
  {
    icono: ICONOS.ensayo,
    titulo: 'Ensayos',
    texto:
      'Se arman por cuotas o a mano, y evitan repetir lo que ya se aplicó en las últimas evaluaciones. Nunca salen incompletos.',
  },
  {
    icono: ICONOS.impresora,
    titulo: 'Versión imprimible',
    texto:
      'El mismo ensayo en papel, con hoja de respuestas y clave aparte. Sin rehacer nada en Word.',
  },
  {
    icono: ICONOS.reloj,
    titulo: 'Rendición en línea',
    texto:
      'Una pregunta por pantalla, con reloj del servidor, guardado en cada paso y cierre automático al expirar.',
  },
  {
    icono: ICONOS.check,
    titulo: 'Corrección',
    texto:
      'Al enviar: puntaje, nivel de logro y desglose por eje, habilidad, Bloom y dificultad.',
  },
  {
    icono: ICONOS.grafico,
    titulo: 'Reportes',
    texto:
      'Informe por curso, por alumno y por ítem, con exportación para la reunión de UTP.',
  },
];

const PASOS = [
  {
    numero: '01',
    titulo: 'Se elige',
    texto: 'Filtra el banco por curso, eje u objetivo y arma el ensayo en minutos.',
  },
  {
    numero: '02',
    titulo: 'Se aplica',
    texto: 'En papel con hoja de respuestas, o en línea con reloj y guardado automático.',
  },
  {
    numero: '03',
    titulo: 'Se lee',
    texto: 'La corrección es automática y el informe queda listo por eje y habilidad.',
  },
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
    texto:
      'Cada acceso, cambio de clave y edición queda en un registro con fecha y responsable.',
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

function Icono({ d }: { d: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-6 w-6"
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  );
}

/** Composición del hero: el emblema como sello, con la órbita del colegio girando. */
function Sello() {
  return (
    <div className="relative mx-auto flex h-[21rem] w-[21rem] items-center justify-center sm:h-[26rem] sm:w-[26rem]">
      {/* halo cálido */}
      <div
        aria-hidden="true"
        className="absolute h-64 w-64 rounded-full bg-acento/25 blur-[80px]"
      />

      {/* órbita: dos elipses inclinadas + tres esferas */}
      <svg
        viewBox="0 0 400 400"
        className="orbita absolute inset-0 h-full w-full"
        aria-hidden="true"
      >
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

      {/* sello blanco con el emblema */}
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
          {/* retícula tenue de fondo */}
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
                Colegio Acrópolis · Evaluación estandarizada
              </p>

              <h1 className="mt-7 text-balance text-4xl font-semibold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-[3.6rem]">
                Encontrar material no debería ser un dolor de cabeza.
              </h1>

              <p className="mt-6 max-w-xl text-pretty text-base leading-relaxed text-white/70 sm:text-lg">
                1.926 preguntas ordenadas por curso, eje y objetivo. Ensayos que se arman solos, se
                imprimen listos y se corrigen solos.
              </p>

              <div className="mt-9 flex flex-wrap items-center gap-3">
                <a
                  href="/login"
                  className="rounded-full bg-acento px-6 py-3 text-sm font-medium text-white transition hover:bg-acento-oscuro"
                >
                  Ingresar a la plataforma
                </a>
                <a
                  href="#plataforma"
                  className="rounded-full border border-white/25 px-6 py-3 text-sm font-medium text-white/90 transition hover:border-white/50 hover:bg-white/5"
                >
                  Ver qué incluye
                </a>
              </div>

              <p className="mt-7 text-xs text-white/45">
                Para docentes, UTP y estudiantes del Colegio Acrópolis.
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
                El problema
              </p>
              <blockquote className="mt-5 border-l-2 border-acento pl-6">
                <p className="text-balance text-2xl font-medium leading-snug tracking-tight text-marca sm:text-3xl">
                  «El material es escaso, y lo poco que hay no viene listo.»
                </p>
              </blockquote>
              <p className="mt-6 text-pretty leading-relaxed text-tenue">
                Es lo primero que aparece cuando se le pregunta a coordinación académica. No es la
                corrección ni el informe: es conseguir la pregunta adecuada, en el formato adecuado,
                a tiempo.
              </p>
            </div>

            <ul className="divide-y divide-borde border-y border-borde">
              {[
                {
                  titulo: 'Está repartido',
                  texto:
                    'PDFs, Word, presentaciones y pruebas antiguas. Encontrar una pregunta de un eje específico puede costar más que aplicarla.',
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

        {/* ------------------------------------------------------------- cifras */}
        <section className="border-y border-borde bg-fondo">
          <div className="mx-auto grid max-w-6xl grid-cols-2 gap-y-8 px-6 py-12 text-center sm:grid-cols-4 sm:divide-x sm:divide-borde">
            {[
              { valor: '1.926', etiqueta: 'preguntas con clave' },
              { valor: '240', etiqueta: 'por curso, promedio' },
              { valor: '114', etiqueta: 'objetivos con material' },
              { valor: '0', etiqueta: 'objetivos sin preguntas' },
            ].map((c) => (
              <div key={c.etiqueta} className="px-4">
                <p className="tabular text-3xl font-semibold tracking-tight text-marca sm:text-4xl">
                  {c.valor}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-tenue">{c.etiqueta}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ------------------------------------------------------------ bloques */}
        <section id="plataforma" className="scroll-mt-20 bg-white">
          <div className="mx-auto max-w-6xl px-6 py-20 md:py-24">
            <div className="max-w-2xl">
              <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-tenue">
                La plataforma
              </p>
              <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-marca sm:text-4xl">
                Lo que reemplaza a la carpeta de siempre.
              </h2>
              <p className="mt-4 text-pretty leading-relaxed text-tenue">
                Seis piezas que ya funcionan con los cursos del colegio, no una maqueta.
              </p>
            </div>

            <ul className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-borde bg-borde sm:grid-cols-2 lg:grid-cols-3">
              {BLOQUES.map((b) => (
                <li key={b.titulo} className="group bg-white p-7 transition hover:bg-fondo">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-acento-suave text-marca transition group-hover:bg-marca group-hover:text-white">
                    <Icono d={b.icono} />
                  </span>
                  <h3 className="mt-5 text-base font-semibold tracking-tight text-marca">
                    {b.titulo}
                  </h3>
                  <p className="mt-2 text-pretty text-sm leading-relaxed text-tenue">{b.texto}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* --------------------------------------------------------- cómo funciona */}
        <section id="como-funciona" className="scroll-mt-20 bg-marca">
          <div className="mx-auto max-w-6xl px-6 py-20 md:py-24">
            <div className="max-w-2xl">
              <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-white/50">
                Cómo funciona
              </p>
              <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                Tres pasos, y ninguno es una planilla.
              </h2>
            </div>

            <ol className="mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
              {PASOS.map((p) => (
                <li key={p.numero} className="border-t border-white/15 pt-6">
                  <p className="text-[11px] font-medium tracking-[0.2em] text-acento">{p.numero}</p>
                  <h3 className="mt-3 text-lg font-semibold tracking-tight text-white">{p.titulo}</h3>
                  <p className="mt-2 text-pretty text-sm leading-relaxed text-white/60">{p.texto}</p>
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
