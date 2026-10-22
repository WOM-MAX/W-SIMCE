'use client';

// Marca o desmarca de una vez las casillas de la lista de estudiantes.
// Las casillas viven en la pagina pero pertenecen al formulario de borrado.

import { useState } from 'react';

export function MarcarTodos() {
  const [marcado, setMarcado] = useState(false);

  function alternar() {
    const nuevo = !marcado;
    const casillas = document.querySelectorAll<HTMLInputElement>('input[name="ids"]');
    casillas.forEach((c) => {
      c.checked = nuevo;
    });
    setMarcado(nuevo);
  }

  return (
    <label className="flex cursor-pointer items-center gap-2 text-xs text-tenue">
      <input
        type="checkbox"
        checked={marcado}
        onChange={alternar}
        className="h-4 w-4 accent-acento"
      />
      Marcar todos
    </label>
  );
}
