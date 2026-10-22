'use client';

// Confirmación de borrado de un ensayo. Se bloquea si tiene asignaciones,
// porque el borrado arrastraría intentos de alumnos.

import { useState } from 'react';

export function EliminarEnsayo({
  id,
  titulo,
  asignaciones,
}: {
  id: string;
  titulo: string;
  asignaciones: number;
}) {
  const [abierto, setAbierto] = useState(false);

  if (asignaciones > 0) {
    return (
      <span
        title="Tiene asignaciones a cursos. Anula las asignaciones antes de eliminar."
        className="cursor-not-allowed rounded-lg border border-borde px-3 py-1.5 text-xs text-tenue/50"
      >
        Eliminar
      </span>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="rounded-lg border border-transparent px-3 py-1.5 text-xs text-tenue transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
      >
        Eliminar
      </button>

      {abierto ? (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-marca/40 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="titulo-eliminar"
          onClick={(e) => {
            if (e.target === e.currentTarget) setAbierto(false);
          }}
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h2 id="titulo-eliminar" className="text-[17px] font-semibold text-marca">
              ¿Eliminar «{titulo}»?
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-tenue">
              Se borran sus preguntas y el borrador desaparece. Esta acción no se puede deshacer y
              no afecta a ningún curso, porque todavía no está asignado.
            </p>
            <form
              method="post"
              action={`/api/ensayos/${id}/eliminar`}
              className="mt-6 flex justify-end gap-2"
            >
              <button
                type="button"
                onClick={() => setAbierto(false)}
                className="rounded-xl border border-borde px-4 py-2 text-sm text-marca transition hover:bg-fondo"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="pulsable rounded-xl bg-rose-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-rose-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-rose-200"
              >
                Eliminar
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
