'use client';

// Revela su contenido una sola vez, cuando entra en pantalla.
// Sin librerías: un IntersectionObserver por bloque y una clase.

import { useEffect, useRef, useState, type ReactNode } from 'react';

export function Revelar({
  children,
  className = '',
  margen = '-12%',
  umbral = 0.15,
}: {
  children: ReactNode;
  className?: string;
  margen?: string;
  umbral?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }

    const observador = new IntersectionObserver(
      (entradas) => {
        if (entradas.some((e) => e.isIntersecting)) {
          setVisible(true);
          observador.disconnect();
        }
      },
      { rootMargin: `0px 0px ${margen} 0px`, threshold: umbral }
    );

    observador.observe(el);
    return () => observador.disconnect();
  }, [margen, umbral]);

  return (
    <div ref={ref} className={`revelar ${visible ? 'revelado' : ''} ${className}`.trim()}>
      {children}
    </div>
  );
}
