import { prisma } from '@/lib/prisma';
import { hashToken } from '@/lib/invitacion';

export const dynamic = 'force-dynamic';

const CLASE_INPUT =
  'mt-1 w-full rounded-lg border border-borde bg-white px-3 py-2 text-sm text-marca outline-none focus:border-acento';

const ERRORES: Record<string, string> = {
  datos: 'Escribe tu clave en los dos campos.',
  corta: 'La clave debe tener al menos 8 caracteres.',
  distinta: 'Las dos claves no coinciden.',
  vencido: 'Este enlace venció o ya se usó. Pide una invitación nueva.',
  interno: 'No se pudo guardar la clave. Inténtalo de nuevo.',
};

function Marco({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-fondo px-6 py-14">
      <div className="w-full max-w-[430px]">
        <div className="mb-8 flex items-center gap-3">
          <span className="block h-11 w-11 shrink-0 overflow-hidden rounded-full">
            <img
              src="/emblema-192.png"
              alt="Emblema del Colegio Acrópolis"
              width={192}
              height={192}
              className="h-full w-full object-cover"
            />
          </span>
          <span className="flex flex-col">
            <span className="text-[17px] font-semibold tracking-tight text-marca">W-SIMCE</span>
            <span className="text-[13px] text-tenue">Colegio Acrópolis</span>
          </span>
        </div>
        <div className="rounded-2xl border border-borde bg-white p-8">{children}</div>
      </div>
    </main>
  );
}

export default async function Activar({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>;
}) {
  const { token, error } = await searchParams;
  const aviso = error ? (ERRORES[error] ?? ERRORES.interno) : null;

  if (!token) {
    return (
      <Marco>
        <h1 className="text-[22px] font-semibold tracking-tight text-marca">Enlace incompleto</h1>
        <p className="mt-3 text-sm leading-relaxed text-tenue">
          Abre el enlace tal como llegó en la invitación, sin cortarlo.
        </p>
        <a href="/login" className="pulsable mt-6 inline-block text-sm text-acento-boton-hover">
          Ir a ingresar
        </a>
      </Marco>
    );
  }

  const invitado = await prisma.usuario.findUnique({
    where: { tokenInvitacion: hashToken(token) },
    select: { nombre: true, email: true, invitacionExpira: true },
  });

  const vigente = Boolean(
    invitado?.invitacionExpira && invitado.invitacionExpira.getTime() > Date.now()
  );

  if (!invitado || !vigente) {
    return (
      <Marco>
        <h1 className="text-[22px] font-semibold tracking-tight text-marca">Enlace no válido</h1>
        <p className="mt-3 text-sm leading-relaxed text-tenue">
          La invitación venció o ya se usó. Pide a la coordinación académica que te envíen una
          nueva.
        </p>
        <a href="/login" className="pulsable mt-6 inline-block text-sm text-acento-boton-hover">
          Ir a ingresar
        </a>
      </Marco>
    );
  }

  return (
    <Marco>
      <h1 className="text-[22px] font-semibold tracking-tight text-marca">Define tu clave</h1>
      <p className="mt-2 text-sm leading-relaxed text-tenue">
        Hola {invitado.nombre}. Esta es tu cuenta del colegio:{' '}
        <span className="text-marca">{invitado.email}</span>
      </p>

      {aviso ? (
        <p
          role="alert"
          className="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
        >
          {aviso}
        </p>
      ) : null}

      <form action="/api/auth/activar" method="post" className="mt-6 space-y-4">
        <input type="hidden" name="token" value={token} />
        <label className="block text-xs font-medium uppercase tracking-wide text-tenue">
          Clave
          <input
            name="clave"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className={CLASE_INPUT}
          />
        </label>
        <label className="block text-xs font-medium uppercase tracking-wide text-tenue">
          Repite la clave
          <input
            name="repetir"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className={CLASE_INPUT}
          />
        </label>
        <button className="pulsable w-full rounded-lg bg-acento-boton px-4 py-2.5 text-sm font-medium text-white hover:bg-acento-boton-hover">
          Guardar y entrar
        </button>
      </form>

      <p className="mt-6 border-t border-borde pt-5 text-[13px] leading-relaxed text-tenue">
        Usa al menos 8 caracteres. El enlace deja de funcionar en cuanto guardas la clave.
      </p>
    </Marco>
  );
}
