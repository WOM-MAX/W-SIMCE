import { redirect } from 'next/navigation';
import { sesionActual } from '@/lib/auth';
import { Marca } from '@/components/marca';

export const dynamic = 'force-dynamic';

const ERRORES: Record<string, string> = {
  datos: 'Faltan datos. Revisa los campos.',
  credenciales: 'Los datos no coinciden con ninguna cuenta.',
  bloqueado: 'Demasiados intentos fallidos. Espera quince minutos y vuelve a probar.',
  colegio: 'Tu cuenta no está asociada a ningún colegio.',
  interno: 'No se pudo iniciar sesión. Inténtalo de nuevo.',
  configuracion: 'El servidor no tiene configurado el secreto de sesión. Avisa a quien administra el sistema.',
};

const CLASE_INPUT =
  'mt-1 w-full rounded-lg border border-borde bg-white px-3 py-2 text-sm text-marca outline-none focus:border-acento';

export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const sesion = await sesionActual();
  if (sesion) redirect(sesion.tipo === 'estudiante' ? '/alumno' : '/');

  const { error } = await searchParams;
  const mensaje = error ? (ERRORES[error] ?? ERRORES.interno) : null;

  return (
    <div className="min-h-dvh bg-fondo">
      <header className="border-b border-borde bg-white">
        <div className="mx-auto flex max-w-5xl items-center px-6 py-4">
          <Marca subtitulo="Evaluación estandarizada · Colegio Acrópolis" />
        </div>
      </header>

      <main className="mx-auto grid max-w-5xl gap-6 px-6 py-10 md:grid-cols-2">
        {mensaje ? (
          <p className="md:col-span-2 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {mensaje}
          </p>
        ) : null}

        <section className="rounded-2xl border border-borde bg-white p-6">
          <h2 className="text-base font-semibold text-marca">Docentes y equipo</h2>
          <p className="mt-1 mb-5 text-xs text-tenue">
            Correo institucional y clave. UTP y administración usan el mismo acceso.
          </p>

          <form action="/api/auth/login" method="post" className="space-y-3">
            <input type="hidden" name="tipo" value="docente" />
            <label className="block text-xs font-medium uppercase tracking-wide text-tenue">
              Correo
              <input
                name="email"
                type="email"
                required
                autoComplete="username"
                placeholder="docente@acropolis.cl"
                className={CLASE_INPUT}
              />
            </label>
            <label className="block text-xs font-medium uppercase tracking-wide text-tenue">
              Clave
              <input
                name="clave"
                type="password"
                required
                autoComplete="current-password"
                className={CLASE_INPUT}
              />
            </label>
            <button
              type="submit"
              className="w-full rounded-lg bg-marca px-4 py-2 text-sm font-medium text-white transition hover:bg-marca-oscuro"
            >
              Entrar
            </button>
          </form>
        </section>

        <section className="rounded-2xl border border-borde bg-white p-6">
          <h2 className="text-base font-semibold text-marca">Estudiantes</h2>
          <p className="mt-1 mb-5 text-xs text-tenue">
            Código entregado por el colegio y PIN de cuatro dígitos.
          </p>

          <form action="/api/auth/login" method="post" className="space-y-3">
            <input type="hidden" name="tipo" value="estudiante" />
            <label className="block text-xs font-medium uppercase tracking-wide text-tenue">
              Código
              <input
                name="codigo"
                required
                autoComplete="username"
                placeholder="W4B-01"
                autoCapitalize="characters"
                className={CLASE_INPUT}
              />
            </label>
            <label className="block text-xs font-medium uppercase tracking-wide text-tenue">
              PIN
              <input
                name="pin"
                type="password"
                inputMode="numeric"
                required
                autoComplete="current-password"
                className={CLASE_INPUT}
              />
            </label>
            <button
              type="submit"
              className="w-full rounded-lg bg-acento-boton px-4 py-2 text-sm font-medium text-white transition hover:bg-acento-boton-hover"
            >
              Entrar
            </button>
          </form>
        </section>

        <p className="md:col-span-2 text-center text-xs text-tenue">
          Si no recuerdas tus datos, pídelos a la coordinación académica.
        </p>
      </main>
    </div>
  );
}
