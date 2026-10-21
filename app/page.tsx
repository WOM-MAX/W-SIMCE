import type { Metadata } from 'next';
import { ProgresoLectura } from '@/components/progreso-lectura';
import { Revelar } from '@/components/revelar';

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
    icono: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18ZM15.6 8.4l-2.1 5.1-5.1 2.1 2.1-5.1 5.1-2.1Z',
    texto:
      'Qué se evalúa, con qué criterio y qué muestran los resultados. Cada cambio queda registrado y el acceso va por rol.',
  },
  {
    titulo: 'Coordinación académica',
    icono: 'M12 3 3 8l9 5 9-5-9-5ZM3 13l9 5 9-5M3 17.5l9 5 9-5',
    texto:
      'El material en un solo banco, cada pregunta con su objetivo, su clave y su figura. Sin adaptar formatos a mano.',
  },
  {
    titulo: 'Docentes',
    icono: 'M4 20h4L18.5 9.5a2.5 2.5 0 0 0-3.5-3.5L4.5 16.5 4 20Z',
    texto:
      'Elegir el ensayo, imprimirlo o aplicarlo en línea. La corrección y el informe no son trabajo extra.',
  },
  {
    titulo: 'Familias y estudiantes',
    icono: 'M4 11 12 4l8 7v8a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-8Z',
    texto:
      'Un resultado que se entiende: qué se evaluó, cómo le fue y qué sigue. No un número suelto al final del semestre.',
  },
];

// Tintes de apoyo, rotando por paso. Solo superficies y glifos, nunca texto corrido.
const TONOS = [
  { fondo: 'bg-acento-suave', texto: 'text-acento-oscuro', aro: 'ring-acento/20' },
  { fondo: 'bg-ambar-suave', texto: 'text-ambar-texto', aro: 'ring-ambar/30' },
  { fondo: 'bg-teal-suave', texto: 'text-teal-texto', aro: 'ring-teal/25' },
  { fondo: 'bg-acento-suave', texto: 'text-acento-oscuro', aro: 'ring-acento/20' },
  { fondo: 'bg-ambar-suave', texto: 'text-ambar-texto', aro: 'ring-ambar/30' },
];

const FUERA_DEL_AULA = [
  {
    titulo: 'Nada se arma la última semana',
    icono: 'M4 7h16v13H4V7ZM8 3v4M16 3v4M4 11h16',
    texto:
      'El material está disponible todo el año y el ensayo se compone cuando se necesita. La prueba deja de ser una carrera contra el calendario.',
  },
  {
    titulo: 'El resultado llega con la prueba',
    icono: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18ZM8 12l3 3 5-6',
    texto:
      'La corrección es automática y el informe por curso queda el mismo día. El apoderado no espera a fin de semestre para saber cómo va su hijo.',
  },
  {
    titulo: 'El colegio puede mostrar lo que mide',
    icono: 'M4 20V5M4 20h16M8 17v-6M13 17V7M18 17v-4',
    texto:
      'Cada evaluación queda con su objetivo, su criterio y su registro de cambios. Eso es lo que sostiene el prestigio: no el discurso, la evidencia.',
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
    icono: 'M4 5h16v5H4V5ZM4 14h16v5H4v-5ZM7 7.5h.01M7 16.5h.01',
    texto:
      'Datos en PostgreSQL sobre Neon, con cifrado en tránsito y conexiones separadas para lectura y migraciones.',
  },
  {
    titulo: 'Sesión firmada',
    icono: 'M7 11V8a5 5 0 0 1 10 0v3M5 11h14v9H5v-9Z',
    texto:
      'Cookie httpOnly con firma HMAC SHA-256. La clave de cada ítem nunca viaja al navegador durante la prueba.',
  },
  {
    titulo: 'Trazabilidad',
    icono: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18ZM12 8v5l3 2',
    texto: 'Cada acceso, cambio de clave y edición queda en un registro con fecha y responsable.',
  },
  {
    titulo: 'Acceso por rol',
    icono: 'M15 7a4 4 0 1 1-3.6 5.8L9 15.4H7v2H4v-3l6.4-6.4A4 4 0 0 1 15 7Z',
    texto:
      'Administración, UTP y docentes ven solo lo que les corresponde. El estudiante ve únicamente sus evaluaciones.',
  },
];

/** Marca del colegio para tamaños pequeños: el triángulo y la A del emblema.
    El arco naranja se omite a 40 px porque se lee como una raya que corta la base. */
function Monograma({
  className,
  disco = true,
  arco = true,
}: {
  className: string;
  disco?: boolean;
  arco?: boolean;
}) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      {disco ? <circle cx="24" cy="24" r="24" fill="#ffffff" /> : null}
      {arco ? (
        <path
          d="M3.5 30.5c11.5 7 29.5 7 41 0"
          stroke="#f84828"
          strokeWidth="2.3"
          fill="none"
          strokeLinecap="round"
        />
      ) : null}
      <path d="M24 5 43 39H5Z" fill="#202858" />
      <path d="M24 13.5l8.2 17.6h-4.2l-1.5-3.4h-5l-1.5 3.4H16z" fill="#ffffff" />
    </svg>
  );
}

function Emblema({ className, src = '/logo-acropolis.webp' }: { className: string; src?: string }) {
  return (
    <img
      src={src}
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
    <div className="relative mx-auto flex aspect-square w-[min(21rem,78vw)] items-center justify-center sm:w-[26rem]">
      {/* Resplandor radial: aclara la zona del emblema para que el medallón y los
          electrones no se pierdan contra el azul plano. */}
      <div
        aria-hidden="true"
        className="absolute h-[34rem] w-[34rem] max-h-[135%] max-w-[135%] rounded-full"
        style={{
          background:
            'radial-gradient(circle, rgba(104,120,196,0.42) 0%, rgba(72,86,156,0.20) 46%, rgba(32,40,88,0) 78%)',
        }}
      />
      <div aria-hidden="true" className="absolute h-64 w-64 rounded-full bg-acento/25 blur-[80px]" />

      <svg viewBox="0 0 400 400" className="orbita absolute inset-0 h-full w-full" aria-hidden="true">
        <g transform="rotate(-22 200 200)">
          <ellipse
            cx="200"
            cy="200"
            rx="186"
            ry="70"
            fill="none"
            stroke="#ffffff"
            strokeOpacity="0.26"
            strokeWidth="1.2"
          />
          <circle r="6" fill="#f84828" className="electron" />
          <circle r="4.5" fill="#ffffff" fillOpacity="0.75" className="electron electron-lento" />
        </g>
      </svg>
      <svg viewBox="0 0 400 400" className="orbita-inversa absolute inset-0 h-full w-full" aria-hidden="true">
        <g transform="rotate(18 200 200)">
          <ellipse
            cx="200"
            cy="200"
            rx="176"
            ry="60"
            fill="none"
            stroke="#ffffff"
            strokeOpacity="0.14"
            strokeWidth="1"
          />
          <circle r="4" fill="#ffffff" fillOpacity="0.5" className="electron electron-tercero" />
        </g>
      </svg>

      {/* El emblema llena el disco: así el blanco del archivo es el propio escudo y no
          una banda añadida. Se conserva el escudo completo, con canto de 6 px y aro. */}
      <div className="relative h-44 w-44 overflow-hidden rounded-full bg-white shadow-[0_0_0_6px_var(--color-marca),0_0_0_7px_rgba(255,255,255,0.22),0_24px_60px_rgba(0,0,0,0.45)] sm:h-56 sm:w-56">
        <Emblema className="h-full w-full rounded-full object-cover" />
      </div>
    </div>
  );
}

export default function Portada() {
  return (
    <div className="min-h-dvh bg-white">
      <ProgresoLectura />
      <header className="sticky top-0 z-40 border-b border-marca/10 bg-barra/95 backdrop-blur">
        <div className="mx-auto flex h-[96px] max-w-6xl items-center justify-between px-6">
          <a href="/" className="flex items-center gap-4" aria-label="W-SIMCE, inicio">
            {/* la escala 1.06 saca el filo blanco del archivo: el anillo del
                escudo llega al borde del círculo y no queda halo */}
            <span className="block h-16 w-16 shrink-0 overflow-hidden rounded-full">
              <Emblema src="/emblema-192.png" className="h-full w-full object-cover" />
            </span>
            <span className="flex items-baseline gap-3">
              <span className="text-[26px] font-semibold tracking-[-0.02em] text-marca">
                <span className="text-acento-boton-hover">W</span>-SIMCE
              </span>
              <span className="hidden text-[13px] text-marca/60 sm:inline">Colegio Acrópolis</span>
            </span>
          </a>
          <a
            href="/login"
            className="rounded-full bg-acento-boton px-6 py-3 text-sm font-medium text-white transition hover:bg-acento-boton-hover"
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
            <div>
              <p
                className="entra flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.24em] text-white/50"
                style={{ animationDelay: '0ms' }}
              >
                <span className="h-px w-8 bg-acento" aria-hidden="true" />
                Colegio Acrópolis
              </p>

              <h1
                className="entra mt-7 text-balance text-4xl font-semibold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-[3.5rem]"
                style={{ animationDelay: '90ms' }}
              >
                Todo lo que necesitas para evaluar, en un solo lugar.
              </h1>

              <p
                className="entra mt-6 max-w-xl text-pretty text-base leading-relaxed text-white/70 sm:text-lg"
                style={{ animationDelay: '180ms' }}
              >
                Preguntas con su objetivo y su clave, ensayos que se arman solos, corrección
                automática y reportes para la reunión. Sin carpetas, sin formatos, sin planillas.
              </p>

              <div
                className="entra mt-9 flex flex-wrap items-center gap-x-6 gap-y-3"
                style={{ animationDelay: '270ms' }}
              >
                <a
                  href="/login"
                  className="rounded-full bg-acento-boton px-6 py-3 text-sm font-medium text-white transition hover:bg-acento-boton-hover"
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

              <p className="entra mt-8 text-xs text-white/60" style={{ animationDelay: '360ms' }}>
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

              {/* el desorden y el orden, dibujados: tres papeles sueltos y una ficha */}
              <Revelar>
                <div aria-hidden="true" className="mt-10 hidden items-center gap-5 sm:flex">
                  <div className="relative h-36 w-48 shrink-0">
                    {[
                      { etiqueta: 'PDF', giro: '-8deg', izq: '0px', arriba: '12px' },
                      { etiqueta: 'Word', giro: '5deg', izq: '42px', arriba: '2px' },
                      { etiqueta: 'Planilla', giro: '-3deg', izq: '84px', arriba: '18px' },
                    ].map((p) => (
                      <div
                        key={p.etiqueta}
                        className="absolute h-28 w-24 rounded-lg border border-borde bg-white p-2.5 shadow-[0_8px_20px_rgba(32,40,88,0.10)]"
                        style={{ left: p.izq, top: p.arriba, transform: `rotate(${p.giro})` }}
                      >
                        <span className="text-[9px] uppercase tracking-[0.14em] text-tenue/70">
                          {p.etiqueta}
                        </span>
                        <span className="mt-2.5 block h-1 w-full rounded-full bg-borde" />
                        <span className="mt-1.5 block h-1 w-4/5 rounded-full bg-borde" />
                        <span className="mt-1.5 block h-1 w-3/5 rounded-full bg-borde" />
                      </div>
                    ))}
                  </div>

                  <span className="text-tenue/40">→</span>

                  <div className="relative h-36 w-28 rounded-lg border border-marca/20 bg-white p-2.5 shadow-[0_14px_30px_rgba(32,40,88,0.16)]">
                    <span className="flex items-center gap-1 text-[9px] uppercase tracking-[0.14em] text-marca/60">
                      Ficha
                    </span>
                    <span className="mt-2.5 flex flex-wrap gap-1">
                      <span className="h-1.5 w-6 rounded-full bg-acento/70" />
                      <span className="h-1.5 w-4 rounded-full bg-ambar/80" />
                      <span className="h-1.5 w-5 rounded-full bg-teal/70" />
                    </span>
                    <span className="mt-3 block h-1 w-full rounded-full bg-borde" />
                    <span className="mt-1.5 block h-1 w-4/5 rounded-full bg-borde" />
                    <span className="mt-3 flex h-6 w-6 items-center justify-center rounded-full bg-acento text-white">
                      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="3">
                        <path d="M5 12l4 4 10-10" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                  </div>
                </div>
              </Revelar>
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

            <Revelar>
              <ol className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-5 lg:gap-5">
                {CICLO.map((p, i) => {
                  const tono = TONOS[i % TONOS.length];
                  return (
                    <li key={p.titulo} className="group relative border-t border-marca/10 pt-7">
                      <span
                        aria-hidden="true"
                        className="trazo-paso absolute -top-px left-0 h-[2px] w-full bg-gradient-to-r from-acento via-ambar to-teal"
                        style={{ transitionDelay: `${i * 110}ms` }}
                      />
                      <span
                        aria-hidden="true"
                        className="pointer-events-none absolute right-0 top-1 select-none text-[46px] font-semibold leading-none text-marca/[0.08]"
                      >
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span
                        className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl ring-1 transition-transform duration-300 group-hover:-translate-y-0.5 ${tono.fondo} ${tono.texto} ${tono.aro}`}
                      >
                        <Icono d={p.icono} className="h-[26px] w-[26px]" />
                      </span>
                      <h3 className="mt-4 text-base font-semibold text-marca">{p.titulo}</h3>
                      <p className="mt-1.5 text-pretty text-sm leading-relaxed text-tenue">{p.texto}</p>
                    </li>
                  );
                })}
              </ol>
            </Revelar>
          </div>
        </section>

        {/* --------------------------------------------------------------- roles */}
        <section id="roles" className="scroll-mt-20 bg-marca">
          <div className="mx-auto max-w-6xl px-6 py-20 md:py-24">
            <div className="max-w-2xl">
              <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-white/50">
                Para quién
              </p>
              <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                Cada uno mira algo distinto.
              </h2>
              <p className="mt-4 text-pretty leading-relaxed text-white/60">
                Dirección, coordinación, aula y familia. Cada uno tiene su vista, y ninguno necesita
                pedirle una planilla a otro.
              </p>
            </div>

            <Revelar>
              <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {ROLES.map((r, i) => (
                <li
                  key={r.titulo}
                  className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-6 transition-colors duration-300 hover:border-white/20 hover:bg-white/[0.07]"
                >
                  <span
                    aria-hidden="true"
                    className={`absolute inset-x-0 top-0 h-[3px] ${['bg-acento', 'bg-ambar', 'bg-teal', 'bg-acento'][i % 4]}`}
                  />
                  <span className="mt-1 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white/[0.08] text-white/80 ring-1 ring-white/10 transition-colors duration-300 group-hover:text-white">
                    <Icono d={r.icono} className="h-[22px] w-[22px]" />
                  </span>
                  <h3 className="mt-4 text-base font-semibold text-white">{r.titulo}</h3>
                  <p className="mt-2 text-pretty text-sm leading-relaxed text-white/60">{r.texto}</p>
                </li>
              ))}
            </ul>
            </Revelar>
          </div>
        </section>

        {/* ------------------------------------------------------------- anatomía */}
        <section id="diferencia" className="scroll-mt-20 bg-white">
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
            <div className="relative">
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

              {/* segunda pieza: el reporte por eje, para que se lea como producto */}
              <div className="mt-4 flex justify-end">
                <div className="flotar-lento w-56 rounded-xl border border-borde bg-white p-4 shadow-[0_22px_50px_rgba(32,40,88,0.14)]">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-tenue/70">Reporte por eje</p>
                  <ul className="mt-3 space-y-2">
                    {[
                      { eje: 'Números', valor: 82, tono: 'bg-acento' },
                      { eje: 'Álgebra', valor: 64, tono: 'bg-ambar' },
                      { eje: 'Geometría', valor: 45, tono: 'bg-teal' },
                    ].map((b) => (
                      <li key={b.eje}>
                        <div className="flex items-center justify-between text-[11px] text-tenue">
                          <span>{b.eje}</span>
                          <span className="font-medium text-marca">{b.valor}%</span>
                        </div>
                        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-fondo">
                          <span className={`block h-full rounded-full ${b.tono}`} style={{ width: `${b.valor}%` }} />
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------ fuera del aula */}
        <section className="border-y border-borde bg-fondo">
          <div className="mx-auto max-w-6xl px-6 py-20 md:py-24">
            <div className="max-w-2xl">
              <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-tenue">
                Lo que se nota fuera de la sala
              </p>
              <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-marca sm:text-4xl">
                Un colegio que llega a tiempo.
              </h2>
              <p className="mt-4 text-pretty leading-relaxed text-tenue">
                Cuando la evaluación se arma la última semana, se nota: en el apuro del docente, en
                la espera del apoderado y en el informe que llega tarde. Esto existe para que no pase.
              </p>
            </div>

            <ul className="mt-12 grid gap-4 md:grid-cols-3">
              {FUERA_DEL_AULA.map((d, i) => (
                <li
                  key={d.titulo}
                  className="group rounded-2xl border border-borde bg-white p-7 shadow-[0_1px_0_rgba(32,40,88,0.04)] transition-all duration-300 hover:-translate-y-0.5 hover:border-marca/15 hover:shadow-[0_18px_40px_rgba(32,40,88,0.10)]"
                >
                  <span
                    className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ring-1 ${TONOS[i % TONOS.length].fondo} ${TONOS[i % TONOS.length].texto} ${TONOS[i % TONOS.length].aro}`}
                  >
                    <Icono d={d.icono} className="h-[24px] w-[24px]" />
                  </span>
                  <h3 className="mt-4 text-base font-semibold tracking-tight text-marca">{d.titulo}</h3>
                  <p className="mt-2 text-pretty text-sm leading-relaxed text-tenue">{d.texto}</p>
                </li>
              ))}
            </ul>
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

              <div className="mt-10 flex items-center gap-5">
                {/* escudo con volumen, brillo recortado al contorno y marca de verificación */}
                <div className="hidden shrink-0 sm:block">
                  <svg
                    viewBox="0 0 64 64"
                    className="h-28 w-28 drop-shadow-[0_14px_26px_rgba(32,40,88,0.26)]"
                    aria-hidden="true"
                  >
                    <defs>
                      <linearGradient id="escudo-cuerpo" x1="0" y1="0" x2="0.2" y2="1">
                        <stop offset="0" stopColor="#4467b8" />
                        <stop offset="1" stopColor="#151d40" />
                      </linearGradient>
                      <radialGradient id="escudo-brillo" cx="0.28" cy="0.22" r="0.55">
                        <stop offset="0" stopColor="#ffffff" stopOpacity="0.55" />
                        <stop offset="0.55" stopColor="#ffffff" stopOpacity="0.12" />
                        <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
                      </radialGradient>
                      <linearGradient id="escudo-sombra" x1="0.35" y1="0" x2="1" y2="0.9">
                        <stop offset="0" stopColor="#000000" stopOpacity="0" />
                        <stop offset="1" stopColor="#000000" stopOpacity="0.28" />
                      </linearGradient>
                      <clipPath id="escudo-recorte">
                        <path d="M32 3.5 55 11v16.5C55 40.6 45.2 51.9 32 60.5 18.8 51.9 9 40.6 9 27.5V11Z" />
                      </clipPath>
                    </defs>
                    <g clipPath="url(#escudo-recorte)">
                      <rect width="64" height="64" fill="url(#escudo-cuerpo)" />
                      <rect width="64" height="64" fill="url(#escudo-brillo)" />
                      <rect width="64" height="64" fill="url(#escudo-sombra)" />
                    </g>
                    <path
                      d="M21 32.5l7.5 7.5L44 22"
                      fill="none"
                      stroke="#0b1230"
                      strokeOpacity="0.28"
                      strokeWidth="6.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      transform="translate(0,1.6)"
                    />
                    <path
                      d="M21 32.5l7.5 7.5L44 22"
                      fill="none"
                      stroke="#ffffff"
                      strokeWidth="6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>

                <p className="text-[11px] leading-relaxed tracking-[0.04em] text-tenue/70">
                  Ley 21.719
                  <br />
                  protección de datos personales
                </p>
              </div>
            </div>

            <ul className="grid gap-4 sm:grid-cols-2">
              {PRIVACIDAD.map((p, i) => (
                <li
                  key={p.titulo}
                  className="rounded-2xl border border-borde bg-fondo p-5 transition-colors duration-300 hover:border-marca/15"
                >
                  <span
                    className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ring-1 ${TONOS[i % TONOS.length].fondo} ${TONOS[i % TONOS.length].texto} ${TONOS[i % TONOS.length].aro}`}
                  >
                    <Icono d={p.icono} className="h-5 w-5" />
                  </span>
                  <h3 className="mt-3 text-sm font-semibold text-marca">{p.titulo}</h3>
                  <p className="mt-1.5 text-pretty text-sm leading-relaxed text-tenue">{p.texto}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>

      <footer className="bg-marca-oscuro">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-[1.5fr_1fr_1fr_1.5fr_1fr] xl:gap-10">
            {/* identidad */}
            <div>
              <div className="flex items-center gap-3">
                <span className="block h-16 w-16 shrink-0 overflow-hidden rounded-full">
                  <Emblema src="/emblema-192.png" className="h-full w-full rounded-full object-cover" />
                </span>
                <div>
                  <p className="text-[19px] font-semibold tracking-[-0.01em] text-white"><span className="text-acento">W</span>-SIMCE</p>
                  <p className="text-xs text-white/60">Colegio Acrópolis</p>
                </div>
              </div>
              <p className="mt-5 max-w-xs text-pretty text-sm leading-relaxed text-white/55">
                Evaluación estandarizada: banco de ítems con su objetivo y su clave, ensayos,
                rendición en línea, corrección automática y reportes por eje.
              </p>
            </div>

            {/* plataforma */}
            <nav aria-label="Plataforma">
              <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/55">
                Plataforma
              </p>
              <ul className="mt-4 space-y-2.5 text-sm">
                {[
                  { texto: 'Ingresar', href: '/login' },
                  { texto: 'Panel', href: '/panel' },
                  { texto: 'Banco de ítems', href: '/banco' },
                  { texto: 'Reportes', href: '/reportes' },
                ].map((l) => (
                  <li key={l.href}>
                    <a href={l.href} className="text-white/65 transition hover:text-white">
                      {l.texto}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            {/* recorrido */}
            <nav aria-label="Recorrido">
              <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/55">
                Recorrido
              </p>
              <ul className="mt-4 space-y-2.5 text-sm">
                {[
                  { texto: 'El ciclo completo', href: '#ciclo' },
                  { texto: 'Para quién', href: '#roles' },
                  { texto: 'La diferencia', href: '#diferencia' },
                  { texto: 'Privacidad y datos', href: '#privacidad' },
                ].map((l) => (
                  <li key={l.href}>
                    <a href={l.href} className="text-white/65 transition hover:text-white">
                      {l.texto}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            {/* contacto */}
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/55">
                Contacto
              </p>
              <ul className="mt-4 space-y-2.5 text-sm">
                <li>
                  <a
                    href="mailto:contacto@colegioacropolis.net"
                    className="inline-flex items-center gap-2 whitespace-nowrap text-[13px] text-white/65 transition hover:text-white"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="h-4 w-4 shrink-0"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M3 6h18v12H3V6Zm0 .5 9 6.5 9-6.5" />
                    </svg>
                    contacto@colegioacropolis.net
                  </a>
                </li>
                <li>
                  <a
                    href="tel:+56223194392"
                    className="inline-flex items-center gap-2 text-white/65 transition hover:text-white"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="h-4 w-4 shrink-0"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M5 4h3.2l1.6 4-2 1.4a11 11 0 0 0 5.8 5.8l1.4-2 4 1.6V18a2 2 0 0 1-2.2 2A15.5 15.5 0 0 1 3 6.2 2 2 0 0 1 5 4Z" />
                    </svg>
                    +56 2 2319 4392
                  </a>
                </li>
                <li className="text-white/65">Puente Alto, Chile</li>
              </ul>
            </div>

            {/* datos */}
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/55">
                Cómo se trata el dato
              </p>
              <ul className="mt-4 space-y-2.5 text-sm text-white/65">
                <li>Acceso por rol: dirección, UTP, docentes y estudiantes</li>
                <li>Cada cambio de clave queda registrado</li>
                <li>Tratamiento conforme a la Ley 21.719</li>
              </ul>
            </div>
          </div>

          <div className="mt-12 flex flex-col gap-3 border-t border-acento/80 pt-6 text-xs text-white/55 sm:flex-row sm:items-center sm:justify-between">
            <p>© 2026 Colegio Acrópolis · W-SIMCE</p>
            <p>Plataforma de uso interno</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
