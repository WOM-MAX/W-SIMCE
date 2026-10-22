'use client';

// Formulario de ingreso con estado de envío y control de visibilidad de la clave.
// Sin JavaScript el formulario sigue funcionando: solo se pierden los avisos.

import { useEffect, useState, type FormEvent } from 'react';

const CLASE_INPUT =
  'mt-2 h-12 w-full rounded-xl border bg-white px-3.5 text-[15px] text-marca outline-none transition placeholder:text-tenue/50 focus:ring-4';

export function FormularioIngreso({ conError }: { conError: boolean }) {
  const [enviando, setEnviando] = useState(false);
  const [verClave, setVerClave] = useState(false);
  const [identificador, setIdentificador] = useState('');

  // Recupera el correo del intento anterior sin dejarlo en la URL.
  useEffect(() => {
    try {
      const guardado = window.sessionStorage.getItem('w-simce-identificador');
      if (guardado) setIdentificador(guardado);
    } catch {
      // sessionStorage puede estar bloqueado; no es un problema.
    }
  }, []);

  function alEnviar(evento: FormEvent<HTMLFormElement>) {
    const datos = new FormData(evento.currentTarget);
    const valor = String(datos.get('identificador') ?? '').trim();
    try {
      if (valor) window.sessionStorage.setItem('w-simce-identificador', valor);
    } catch {
      // igual se envía
    }
    setEnviando(true);
  }

  const borde = conError
    ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-100'
    : 'border-borde focus:border-acento/50 focus:ring-acento/10';

  return (
    <form
      action="/api/auth/login"
      method="post"
      onSubmit={alEnviar}
      className="mt-8 space-y-5"
      aria-busy={enviando}
    >
      <label className="block text-[12px] font-semibold text-marca">
        Correo o código
        <input
          name="identificador"
          required
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          placeholder="docente@acropolis.cl o W4A-01"
          value={identificador}
          onChange={(e) => setIdentificador(e.target.value)}
          readOnly={enviando}
          aria-invalid={conError}
          className={`${CLASE_INPUT} ${borde}`}
        />
      </label>

      <label className="block text-[12px] font-semibold text-marca">
        Clave o PIN
        <span className="relative block">
          <input
            name="secreto"
            type={verClave ? 'text' : 'password'}
            required
            autoComplete="current-password"
            readOnly={enviando}
            aria-invalid={conError}
            className={`${CLASE_INPUT} ${borde} pr-12`}
          />
          <button
            type="button"
            onClick={() => setVerClave((v) => !v)}
            aria-pressed={verClave}
            aria-label={verClave ? 'Ocultar la clave' : 'Mostrar la clave'}
            className="absolute right-1.5 top-[calc(50%+4px)] grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg text-tenue transition hover:bg-fondo hover:text-marca focus:outline-none focus-visible:ring-4 focus-visible:ring-acento/20"
          >
            {verClave ? (
              <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.2 5.6A9.5 9.5 0 0 1 12 5c5 0 9 4.5 9 7 0 .9-.6 2-1.6 3.1M6.1 6.6C4.2 8 3 9.7 3 12c0 2.5 4 7 9 7 1 0 1.9-.2 2.8-.5" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3 12c0-2.5 4-7 9-7s9 4.5 9 7-4 7-9 7-9-4.5-9-7Z" />
                <circle cx="12" cy="12" r="2.6" />
              </svg>
            )}
          </button>
        </span>
      </label>

      <button
        type="submit"
        disabled={enviando}
        className={`inline-flex h-12 w-full items-center justify-center gap-2.5 rounded-xl text-[15px] font-medium text-white transition focus:outline-none focus-visible:ring-4 focus-visible:ring-acento/25 ${
          enviando
            ? 'cursor-wait bg-acento-boton-hover'
            : 'bg-acento-boton hover:bg-acento-boton-hover'
        }`}
      >
        {enviando ? (
          <>
            <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] animate-spin motion-reduce:animate-none" fill="none" aria-hidden="true">
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.3" strokeWidth="2.5" />
              <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
            Ingresando…
          </>
        ) : (
          'Entrar'
        )}
      </button>
      <span className="sr-only" role="status" aria-live="polite">
        {enviando ? 'Verificando los datos' : ''}
      </span>
    </form>
  );
}
