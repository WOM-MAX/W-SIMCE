import { redirect } from 'next/navigation';
import { sesionActual } from '@/lib/auth';
import { FormularioIngreso } from '@/components/formulario-ingreso';

export const dynamic = 'force-dynamic';

const ERRORES: Record<string, string> = {
  datos: 'Faltan datos. Revisa los campos.',
  credenciales: 'Los datos no coinciden con ninguna cuenta.',
  bloqueado: 'Demasiados intentos fallidos. Espera quince minutos y vuelve a probar.',
  colegio: 'Tu cuenta no está asociada a ningún colegio.',
  interno: 'No se pudo iniciar sesión. Inténtalo de nuevo.',
  configuracion:
    'El servidor no tiene configurado el secreto de sesión. Avisa a quien administra el sistema.',
};

const MODULOS = [
  'Banco de ítems con su clave',
  'Ensayos que se arman solos',
  'Corrección y reportes el mismo día',
];

export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const sesion = await sesionActual();
  if (sesion) redirect(sesion.tipo === 'estudiante' ? '/alumno' : '/panel');

  const { error } = await searchParams;
  const mensaje = error ? (ERRORES[error] ?? ERRORES.interno) : null;

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[1.05fr_1fr]">
      {/* panel de marca: solo en pantallas grandes */}
      <aside className="relative hidden overflow-hidden border-t-[3px] border-acento bg-marca lg:flex lg:flex-col lg:justify-between lg:gap-14 lg:p-14">
        {/* arcos concéntricos: el lenguaje de la órbita del emblema, a escala
            arquitectónica. Sustituye al mosaico de figuras, que se leía como garabatos. */}
        <svg
          aria-hidden="true"
          viewBox="0 0 330 520"
          preserveAspectRatio="xMinYMax slice"
          className="pointer-events-none absolute inset-0 h-full w-full"
          fill="none"
        >
          <g stroke="#ffffff" strokeOpacity="0.1" strokeWidth="1" transform="translate(18,505)">
            {[130, 185, 240, 295, 350].map((r) => (
              <circle key={r} r={r} />
            ))}
            <line x1="-40" y1="0" x2="360" y2="0" strokeDasharray="2 7" />
            <line x1="0" y1="-500" x2="0" y2="20" strokeDasharray="2 7" />
            <g strokeOpacity="0.2" strokeWidth="1.6">
              {[130, 185, 240, 295, 350].map((r) => (
                <line key={r} x1={r} y1="-5" x2={r} y2="5" />
              ))}
            </g>
          </g>
        </svg>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at 32% 22%, rgba(104,120,196,0.55) 0%, rgba(72,86,156,0.22) 42%, rgba(32,40,88,0) 70%)',
          }}
        />

        <div className="relative flex items-center gap-4">
          <span className="block h-16 w-16 shrink-0 overflow-hidden rounded-full">
            <img
              src="/emblema-192.png"
              alt="Emblema del Colegio Acrópolis"
              width={192}
              height={192}
              className="h-full w-full object-cover"
            />
          </span>
          <span className="flex flex-col">
            <span className="text-[17px] font-semibold tracking-tight text-white">W-SIMCE</span>
            <span className="text-[13px] text-white/60">Colegio Acrópolis</span>
          </span>
        </div>

        <div className="relative max-w-[34rem]">
          <p className="text-balance text-[38px] font-semibold uppercase leading-[1.16] tracking-[-0.01em] text-white">
            Evaluar, aplicar y{' '}
            <span className="inline-block text-[1.18em] leading-[0.9] tracking-[-0.03em] text-acento">
              corregir
            </span>{' '}
            en un solo lugar.
          </p>
          <ul className="mt-12 space-y-4">
            {MODULOS.map((m) => (
              <li key={m} className="flex items-center gap-3 text-[15px] text-white/70">
                <span aria-hidden="true" className="h-[2px] w-5 bg-acento" />
                {m}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-white/40">Puente Alto, Chile</p>
      </aside>

      <main className="flex min-h-dvh flex-col">
        {/* encabezado compacto, solo en móvil */}
        <header className="flex h-16 items-center justify-between border-b border-borde/70 px-6 lg:hidden">
          <a href="/" className="flex items-center gap-2.5" aria-label="Volver a la portada">
            <span className="block h-9 w-9 shrink-0 overflow-hidden rounded-full">
              <img src="/emblema-192.png" alt="" width={192} height={192} className="h-full w-full object-cover" />
            </span>
            <span className="text-[15px] font-semibold tracking-tight text-marca">W-SIMCE</span>
          </a>
          <a href="/" className="text-sm text-tenue transition hover:text-marca">
            Volver
          </a>
        </header>

        <div className="flex flex-1 items-center justify-center px-6 py-14">
          <div className="w-full max-w-[400px]">
            <div className="hidden lg:block">
              <a
                href="/"
                className="inline-flex items-center gap-1.5 text-sm text-tenue transition hover:text-marca"
              >
                <span aria-hidden="true" className="text-acento">
                  ←
                </span>
                Volver a la portada
              </a>
            </div>

            <h1 className="mt-0 text-[30px] font-semibold tracking-tight text-marca lg:mt-8">
              Ingresar
            </h1>
            <p className="mt-2 max-w-[36ch] text-[15px] leading-relaxed text-tenue">
              Usa tu correo institucional o el código que te entregó el colegio.
            </p>

            {mensaje ? (
              <p
                role="alert"
                className="mt-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
              >
                {mensaje}
              </p>
            ) : null}

            <FormularioIngreso conError={Boolean(mensaje)} />

            <p className="mt-8 border-t border-borde pt-6 text-[13px] leading-relaxed text-tenue">
              Si no recuerdas tus datos, pídelos a la coordinación académica. Los estudiantes
              ingresan con el código del colegio y un PIN de cuatro dígitos.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
