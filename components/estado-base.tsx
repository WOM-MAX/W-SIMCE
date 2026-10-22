'use client';

// Indicador del estado de la base, para el pie del panel.
// Consulta la sonda de salud y no bloquea nada: si falla, queda en gris.

import { useEffect, useState } from 'react';

type Estado = 'consultando' | 'ok' | 'falla';

export function EstadoBase() {
  const [estado, setEstado] = useState<Estado>('consultando');

  useEffect(() => {
    let vigente = true;
    fetch('/api/live', { cache: 'no-store' })
      .then((r) => {
        if (vigente) setEstado(r.ok ? 'ok' : 'falla');
      })
      .catch(() => {
        if (vigente) setEstado('falla');
      });
    return () => {
      vigente = false;
    };
  }, []);

  const punto =
    estado === 'ok' ? 'bg-teal' : estado === 'falla' ? 'bg-rose-500' : 'bg-white/40';
  const texto =
    estado === 'ok' ? 'Base conectada' : estado === 'falla' ? 'Sin conexión' : 'Consultando';

  return (
    <a
      href="/api/live"
      className="pulsable flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-white/60 transition hover:bg-white/5 hover:text-white/90"
      title="Estado de la conexión con la base de datos"
    >
      <span aria-hidden="true" className={`h-2 w-2 shrink-0 rounded-full ${punto}`} />
      {texto}
    </a>
  );
}
