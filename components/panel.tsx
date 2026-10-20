import { Marca } from '@/components/marca';

type Item = { href: string; nombre: string; pronto?: boolean };

function iniciales(nombre: string): string {
  return nombre
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

// Armazón del panel: menús a la izquierda, contenido a la derecha.
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
    { href: '/', nombre: 'Inicio' },
    { href: '/ensayos/nuevo', nombre: 'Generar ensayo' },
    { href: '/ensayos', nombre: 'Ensayos' },
    { href: '/banco', nombre: 'Banco de ítems' },
    { href: '/correccion', nombre: 'Corrección' },
    { href: '/admin', nombre: 'Administración' },
    { href: '/reportes', nombre: 'Reportes' },
  ];

  const visibles = menu.filter(
    (i) => i.href !== '/admin' || rol === 'ADMIN' || rol === 'UTP'
  );

  const clase = (item: Item) => {
    if (item.pronto) {
      return 'flex items-center justify-between rounded-lg px-3 py-2 text-sm text-tenue/60';
    }
    const activoAqui = activo === item.href;
    return [
      'flex items-center justify-between rounded-lg px-3 py-2 text-sm transition',
      activoAqui ? 'bg-acento-suave font-medium text-marca' : 'text-slate-700 hover:bg-fondo',
    ].join(' ');
  };

  const contenidoMenu = (compacto: boolean) =>
    visibles.map((item) =>
      item.pronto ? (
        <span key={item.href} className={compacto ? 'px-3 py-1.5 text-xs' : clase(item)}>
          {item.nombre}
          {!compacto ? <span className="text-[10px] uppercase tracking-wide">pronto</span> : null}
        </span>
      ) : (
        <a key={item.href} href={item.href} className={compacto ? 'whitespace-nowrap rounded-lg px-3 py-1.5 text-xs text-slate-700 hover:bg-fondo' : clase(item)}>
          {item.nombre}
        </a>
      )
    );

  return (
    <div className="flex min-h-dvh bg-fondo">
      <aside className="hidden w-60 shrink-0 flex-col justify-between border-r border-borde bg-white md:flex">
        <div>
          <div className="px-5 py-5">
            <Marca />
          </div>
          <nav className="space-y-1 px-3">{contenidoMenu(false)}</nav>
        </div>

        <div className="space-y-2 border-t border-borde p-3">
          <a
            href="/api/health"
            className="block rounded-lg px-3 py-2 text-xs text-tenue hover:bg-fondo"
          >
            Estado de la base
          </a>
          <div className="flex items-center gap-2 rounded-xl bg-fondo px-3 py-2">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-marca text-[11px] font-semibold text-white">
              {iniciales(nombre)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-marca">{nombre}</p>
              {rol ? <p className="truncate text-[11px] text-tenue">{rol}</p> : null}
            </div>
          </div>
          <form action="/api/auth/logout" method="post">
            <button className="w-full rounded-lg border border-borde px-3 py-2 text-xs text-slate-600 hover:bg-fondo">
              Cerrar sesión
            </button>
          </form>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between border-b border-borde bg-white px-4 py-3 md:hidden">
          <Marca />
          <form action="/api/auth/logout" method="post">
            <button className="rounded-lg border border-borde px-3 py-1.5 text-xs text-slate-600">
              Salir
            </button>
          </form>
        </div>
        <nav className="flex gap-1 overflow-x-auto border-b border-borde bg-white px-3 py-2 md:hidden">
          {contenidoMenu(true)}
        </nav>

        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
