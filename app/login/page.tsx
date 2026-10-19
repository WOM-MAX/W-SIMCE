import { redirect } from 'next/navigation';
import { sesionActual } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const ERRORES: Record<string, string> = {
  datos: 'Faltan datos. Revisa los campos.',
  credenciales: 'Los datos no coinciden con ninguna cuenta.',
  colegio: 'Tu cuenta no está asociada a ningún colegio.',
  interno: 'No se pudo iniciar sesión. Inténtalo de nuevo.',
  configuracion: 'El servidor no tiene configurado el secreto de sesión. Avisa a quien administra el sistema.',
};

const CLASE_INPUT =
  'mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-teal-500';

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
    <div className="min-h-dvh bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-6 py-4">
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
      </header>

      <main className="mx-auto grid max-w-5xl gap-6 px-6 py-10 md:grid-cols-2">
        {mensaje ? (
          <p className="md:col-span-2 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {mensaje}
          </p>
        ) : null}

        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-base font-semibold text-slate-900">Docentes y equipo</h2>
          <p className="mt-1 mb-5 text-xs text-slate-500">
            Correo institucional y clave. UTP y administración usan el mismo acceso.
          </p>

          <form action="/api/auth/login" method="post" className="space-y-3">
            <input type="hidden" name="tipo" value="docente" />
            <label className="block text-xs font-medium uppercase tracking-wide text-slate-400">
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
            <label className="block text-xs font-medium uppercase tracking-wide text-slate-400">
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
              className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              Entrar
            </button>
          </form>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-base font-semibold text-slate-900">Estudiantes</h2>
          <p className="mt-1 mb-5 text-xs text-slate-500">
            Código entregado por el colegio y PIN de cuatro dígitos.
          </p>

          <form action="/api/auth/login" method="post" className="space-y-3">
            <input type="hidden" name="tipo" value="estudiante" />
            <label className="block text-xs font-medium uppercase tracking-wide text-slate-400">
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
            <label className="block text-xs font-medium uppercase tracking-wide text-slate-400">
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
              className="w-full rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-teal-700"
            >
              Entrar
            </button>
          </form>
        </section>

        <p className="md:col-span-2 text-center text-xs text-slate-400">
          Si no recuerdas tus datos, pídelos a la coordinación académica.
        </p>
      </main>
    </div>
  );
}
