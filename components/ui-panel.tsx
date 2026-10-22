// Piezas compartidas por las pantallas del panel. Si algo se repite en dos
// pantallas, vive aquí y no en cada página.

import type { ReactNode } from 'react';
import type { EstadoModulo } from '@/lib/modulos';
import { ETIQUETA_ESTADO } from '@/lib/modulos';

export function Cabecera({
  titulo,
  detalle,
  accion,
}: {
  titulo: string;
  detalle?: string;
  accion?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-[22px] font-semibold tracking-[-0.01em] text-marca">{titulo}</h1>
        {detalle ? <p className="mt-1 text-[13px] text-tenue">{detalle}</p> : null}
      </div>
      {accion ? <div className="shrink-0">{accion}</div> : null}
    </div>
  );
}

export function Tarjeta({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-borde bg-white ${className}`.trim()}>
      {children}
    </section>
  );
}

export function CabezaTarjeta({
  titulo,
  extra,
}: {
  titulo: string;
  extra?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-borde px-5 py-4">
      <h2 className="text-[15px] font-semibold text-marca">{titulo}</h2>
      {extra}
    </div>
  );
}

export function EstadoVacio({
  titulo,
  detalle,
  accion,
}: {
  titulo: string;
  detalle: string;
  accion?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-full bg-fondo text-tenue">
        <svg
          viewBox="0 0 24 24"
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M7 3.5h7l4 4V20a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1ZM13 9h4M14 3.5V8" />
        </svg>
      </span>
      <p className="text-[15px] font-medium text-marca">{titulo}</p>
      <p className="max-w-sm text-[13px] leading-relaxed text-tenue">{detalle}</p>
      {accion}
    </div>
  );
}

const PUNTO: Record<EstadoModulo, string> = {
  listo: 'bg-teal',
  'en-curso': 'bg-ambar',
  pendiente: 'bg-tenue/40',
};

const TEXTO: Record<EstadoModulo, string> = {
  listo: 'text-teal-texto',
  'en-curso': 'text-ambar-texto',
  pendiente: 'text-tenue',
};

export function EtiquetaEstado({ estado }: { estado: EstadoModulo }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-borde bg-white px-2.5 py-1 text-[11px] font-medium ${TEXTO[estado]}`}
    >
      <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${PUNTO[estado]}`} />
      {ETIQUETA_ESTADO[estado]}
    </span>
  );
}
