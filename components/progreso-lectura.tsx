'use client';

// Barra fina arriba que muestra cuánto de la página se ha leído.
// Sin dependencias: un solo listener de scroll pasivo, medido con rAF.

import { useEffect, useState } from 'react';

export function ProgresoLectura() {
  const [avance, setAvance] = useState(0);

  useEffect(() => {
    let pendiente = false;

    const medir = () => {
      pendiente = false;
      const alto = document.documentElement.scrollHeight - window.innerHeight;
      if (alto <= 0) {
        setAvance(0);
        return;
      }
      const v = Math.min(1, Math.max(0, window.scrollY / alto));
      setAvance(v);
    };

    const alDesplazar = () => {
      if (pendiente) return;
      pendiente = true;
      window.requestAnimationFrame(medir);
    };

    medir();
    window.addEventListener('scroll', alDesplazar, { passive: true });
    window.addEventListener('resize', alDesplazar, { passive: true });
    return () => {
      window.removeEventListener('scroll', alDesplazar);
      window.removeEventListener('resize', alDesplazar);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-50 h-[2px] bg-transparent" aria-hidden="true">
      <div
        className="h-full origin-left bg-acento transition-transform duration-75 ease-out"
        style={{ transform: `scaleX(${avance})` }}
      />
    </div>
  );
}
