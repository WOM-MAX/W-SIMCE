'use client';

import { useEffect, useState } from 'react';

// Reloj de cortesía: muestra el tiempo restante y recarga al llegar a cero.
// La autoridad sigue en el servidor, que cierra el intento aunque esto no corra.
export function Reloj({ limiteIso }: { limiteIso: string }) {
  const limite = new Date(limiteIso).getTime();
  const [restante, setRestante] = useState(() =>
    Math.max(0, Math.floor((limite - Date.now()) / 1000))
  );

  useEffect(() => {
    const tic = setInterval(() => {
      const segundos = Math.max(0, Math.floor((limite - Date.now()) / 1000));
      setRestante(segundos);
      if (segundos === 0) {
        clearInterval(tic);
        window.location.reload();
      }
    }, 1000);
    return () => clearInterval(tic);
  }, [limite]);

  const min = Math.floor(restante / 60);
  const seg = restante % 60;
  const apurado = restante <= 300;

  return (
    <span
      className={`tabular rounded-full px-3 py-1 text-xs font-medium ${
        apurado ? 'bg-rose-50 text-rose-700' : 'bg-borde text-slate-600'
      }`}
      title="Tiempo restante"
    >
      {String(min).padStart(2, '0')}:{String(seg).padStart(2, '0')}
    </span>
  );
}
