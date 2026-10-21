import { redirect } from 'next/navigation';
import { sesionActual } from '@/lib/auth';

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

const CLASE_INPUT =
  'mt-1.5 w-full rounded-xl border border-borde bg-white px-3.5 py-2.5 text-sm text-marca outline-none transition placeholder:text-tenue/60 focus:border-marca/40 focus:ring-4 focus:ring-marca/5';

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
    <div className="flex min-h-dvh flex-col bg-white">
      <header className="border-b border-borde/80">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <a href="/" className="flex items-center gap-3" aria-label="Volver a la portada">
            <img
              src="/logo-acropolis.webp"
              alt=""
              width={372}
              height={378}
              className="h-9 w-9"
            />
            <span className="text-[15px] font-semibold tracking-tight text-marca">W-SIMCE</span>
          </a>
          <a href="/" className="text-sm text-tenue transition hover:text-marca">
            Volver
          </a>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-6 py-14">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-semibold tracking-tight text-marca">Ingresar</h1>
          <p className="mt-2 text-sm leading-relaxed text-tenue">
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

          <form action="/api/auth/login" method="post" className="mt-8 space-y-4">
            <label className="block text-[11px] font-medium uppercase tracking-[0.16em] text-tenue">
              Correo o código
              <input
                name="identificador"
                required
                autoFocus
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                placeholder="docente@acropolis.cl o W4A-01"
                className={CLASE_INPUT}
              />
            </label>

            <label className="block text-[11px] font-medium uppercase tracking-[0.16em] text-tenue">
              Clave o PIN
              <input
                name="secreto"
                type="password"
                required
                autoComplete="current-password"
                className={CLASE_INPUT}
              />
            </label>

            <button
              type="submit"
              className="w-full rounded-xl bg-marca px-4 py-3 text-sm font-medium text-white transition hover:bg-marca-oscuro"
            >
              Entrar
            </button>
          </form>

          <p className="mt-8 border-t border-borde pt-6 text-xs leading-relaxed text-tenue">
            Si no recuerdas tus datos, pídelos a la coordinación académica. Los estudiantes ingresan
            con el código del colegio y un PIN de cuatro dígitos.
          </p>
        </div>
      </main>
    </div>
  );
}
