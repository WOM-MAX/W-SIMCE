'use client';

// Selector de planilla con boton propio. El control nativo del navegador no se
// puede estilar y se confundia con una etiqueta.

import { useRef, useState } from 'react';

export function SelectorArchivo() {
  const entrada = useRef<HTMLInputElement>(null);
  const [nombre, setNombre] = useState('');

  return (
    <div className="flex flex-wrap items-center gap-3">
      <input
        ref={entrada}
        name="archivo"
        type="file"
        accept=".xlsx"
        required
        className="sr-only"
        onChange={(e) => setNombre(e.target.files?.[0]?.name ?? '')}
      />
      <button
        type="button"
        onClick={() => entrada.current?.click()}
        className="pulsable rounded-lg border border-marca/30 px-3.5 py-2 text-xs font-semibold text-marca transition hover:border-marca/60 hover:bg-fondo"
      >
        {nombre ? 'Cambiar archivo' : 'Elegir archivo'}
      </button>
      <span className={nombre ? 'text-xs text-marca' : 'text-xs text-tenue'}>
        {nombre || 'Ninguno seleccionado'}
      </span>
      <button
        disabled={!nombre}
        className={`pulsable rounded-lg px-4 py-2 text-sm font-medium text-white transition ${
          nombre
            ? 'bg-acento-boton hover:bg-acento-boton-hover'
            : 'cursor-not-allowed border border-borde bg-fondo text-tenue'
        }`}
      >
        Importar
      </button>
    </div>
  );
}
