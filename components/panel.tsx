import { Marca } from '@/components/marca';
import { EstadoBase } from '@/components/estado-base';
import { SelectorAnio } from '@/components/selector-anio';

type Item = { href: string; nombre: string; icono: string; pronto?: boolean };

function iniciales(nombre: string): string {
  return nombre
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

// Armazón del panel: barra lateral azul con iconos y contenido a la derecha.
export function Panel({
  nombre,
  rol,
  activo,
  children,
}: {
  nombre: string;
  rol?: string;
  activo: string;
  children: React.ReactNode;
}) {
  const menu: Item[] = [
    { href: '/panel', nombre: 'Inicio', icono: 'M4 11 12 4l8 7v8a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-8Z' },
    {
      href: '/ensayos/nuevo',
      nombre: 'Generar ensayo',
      icono: 'M7 3.5h7l4 4V20a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1ZM13 9h4M14 3.5V8M12 12.5v5M9.5 15h5',
    },
    { href: '/ensayos', nombre: 'Ensayos', icono: 'M4 6h16M4 12h16M4 18h10' },
    { href: '/banco', nombre: 'Banco de ítems', icono: 'M4 5h16v14H4V5ZM4 10h16M10 10v9' },
    {
      href: '/correccion',
      nombre: 'Corrección',
      icono: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18ZM8 12l3 3 5-6',
    },
    {
      href: '/admin',
      nombre: 'Administración',
      icono: 'M4 7h6M14 7h6M4 17h3M11 17h9M7 12h10',
    },
    { href: '/reportes', nombre: 'Reportes', icono: 'M4 20V5M4 20h16M8 17v-5M12.5 17V8M17 17v-7' },
    {
      href: '/direccion',
      nombre: 'Dirección',
      icono: 'M12 3v18M4 8h16M6 8v6M18 8v6M4 20h16',
    },
  ];

  const visibles = menu.filter((i) => {
    if (i.href === '/admin') return rol === 'ADMIN' || rol === 'UTP';
    if (i.href === '/direccion') return rol === 'ADMIN' || rol === 'DIRECCION';
    return true;
  });

  const Icono = ({ d, className = 'h-[18px] w-[18px]' }: { d: string; className?: string }) => (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  );

  const contenidoMenu = (compacto: boolean) =>
    visibles.map((item) => {
      const aqui = activo === item.href;
      if (compacto) {
        return (
          <a
            key={item.href}
            href={item.href}
            className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs transition ${
              aqui ? 'bg-white/15 font-medium text-white' : 'text-white/70 hover:bg-white/10'
            }`}
          >
            {item.nombre}
          </a>
        );
      }
      return (
        <a
          key={item.href}
          href={item.href}
          aria-current={aqui ? 'page' : undefined}
          className={`pulsable relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm ${
            aqui
              ? 'bg-white/10 font-medium text-white'
              : 'text-white/70 hover:bg-white/[0.06] hover:text-white'
          }`}
        >
          {aqui ? (
            <span
              aria-hidden="true"
              className="absolute -left-3 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r bg-acento"
            />
          ) : null}
          <Icono d={item.icono} className={aqui ? 'h-[18px] w-[18px] text-acento' : 'h-[18px] w-[18px]'} />
          {item.nombre}
        </a>
      );
    });

  return (
    <div className="flex min-h-dvh bg-fondo">
      <aside className="relative hidden w-60 shrink-0 flex-col justify-between overflow-hidden bg-marca md:flex">
        {/* arcos al pie, el mismo lenguaje del acceso */}
        <svg
          aria-hidden="true"
          viewBox="0 0 240 400"
          preserveAspectRatio="xMinYMax slice"
          className="pointer-events-none absolute inset-0 h-full w-full"
          fill="none"
        >
          <g stroke="#ffffff" strokeOpacity="0.07" strokeWidth="1" transform="translate(10,392)">
            {[120, 175, 230, 285].map((r) => (
              <circle key={r} r={r} />
            ))}
          </g>
        </svg>

        <div className="relative">
          <div className="px-5 py-5">
            <Marca claro />
          </div>
          <div className="px-3 pb-3">
            <SelectorAnio />
          </div>
          <nav className="space-y-0.5 px-3">{contenidoMenu(false)}</nav>
        </div>

        <div className="relative space-y-1 border-t border-white/10 p-3">
          <EstadoBase />
          <div className="flex items-center gap-2 rounded-xl bg-white/[0.07] px-3 py-2">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-acento text-[11px] font-semibold text-white">
              {iniciales(nombre)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-white">{nombre}</p>
              {rol ? <p className="truncate text-[11px] text-white/50">{rol}</p> : null}
            </div>
          </div>
          <form action="/api/auth/logout" method="post">
            <button className="pulsable w-full rounded-lg border border-white/15 px-3 py-2 text-xs text-white/70 transition hover:bg-white/10 hover:text-white">
              Cerrar sesión
            </button>
          </form>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between border-b border-borde bg-marca px-4 py-3 md:hidden">
          <Marca claro />
          <form action="/api/auth/logout" method="post">
            <button className="pulsable rounded-lg border border-white/20 px-3 py-1.5 text-xs text-white/80">
              Salir
            </button>
          </form>
        </div>
        <nav className="flex gap-1 overflow-x-auto bg-marca-oscuro px-3 py-2 md:hidden">
          {contenidoMenu(true)}
        </nav>

        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
