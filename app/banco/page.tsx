import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { sesionActual } from '@/lib/auth';
import { Panel } from '@/components/panel';
import { Figura } from '@/components/figura';
import { TextoPotencia } from '@/components/texto-potencia';

export const dynamic = 'force-dynamic';

const TAMANOS = [10, 25, 50];

const COLOR_BLOOM: Record<string, string> = {
  conocimiento: 'bg-borde text-tenue',
  comprension: 'bg-fondo text-slate-700',
  aplicacion: 'bg-acento-suave text-marca',
  analisis: 'bg-amber-50 text-amber-800',
  sintesis: 'bg-rose-50 text-rose-700',
  evaluacion: 'bg-emerald-50 text-emerald-800',
};

// Seis categorías para no mostrar 22 sinónimos sueltos («interpretar»,
// «interpretar lenguaje», «interpretar propósito»…). No cambia los datos.
const HABILIDADES: { clave: string; nombre: string; valores: string[] }[] = [
  {
    clave: 'localizar',
    nombre: 'Localizar',
    valores: ['localizar', 'extraer información', 'reconocer', 'ordenar información'],
  },
  {
    clave: 'interpretar',
    nombre: 'Interpretar',
    valores: [
      'interpretar',
      'interpretar lenguaje',
      'interpretar propósito',
      'interpretar formato',
      'interpretar detalle',
      'comparar',
      'convertir',
      'clasificar',
    ],
  },
  { clave: 'inferir', nombre: 'Inferir', valores: ['inferir'] },
  { clave: 'reflexionar', nombre: 'Reflexionar', valores: ['reflexionar'] },
  {
    clave: 'resolver',
    nombre: 'Resolver y aplicar',
    valores: [
      'resolver problemas',
      'calcular',
      'aplicar',
      'aplicar reglas',
      'aplicar información',
      'modelar',
      'representar',
    ],
  },
  { clave: 'argumentar', nombre: 'Argumentar', valores: ['argumentar'] },
];

const RECURSOS: { clave: string; nombre: string }[] = [
  { clave: 'figura', nombre: 'Con figura' },
  { clave: 'sinfigura', nombre: 'Sin figura' },
  { clave: 'texto', nombre: 'Con texto' },
  { clave: 'sinatexto', nombre: 'Sin texto' },
  { clave: 'oa', nombre: 'Con OA' },
];

const ORDENES: { clave: string; nombre: string }[] = [
  { clave: 'codigo', nombre: 'Código' },
  { clave: 'curso', nombre: 'Curso y eje' },
  { clave: 'dificultad', nombre: 'Dificultad' },
  { clave: 'eje', nombre: 'Eje' },
];

const DIFICULTADES = ['facil', 'media', 'dificil'];
const BLOOMS = ['conocimiento', 'comprension', 'aplicacion', 'analisis', 'sintesis', 'evaluacion'];

type Consulta = Record<string, string | undefined>;

function lista(valor: string | undefined): string[] {
  return (valor ?? '')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
}

function alternar(actual: string | undefined, valor: string): string {
  const valores = lista(actual);
  const siguiente = valores.includes(valor)
    ? valores.filter((v) => v !== valor)
    : [...valores, valor];
  return siguiente.join(',');
}

function url(consulta: Consulta, cambios: Consulta): string {
  const fusionada: Consulta = { ...consulta, ...cambios };
  // Cambiar un filtro vuelve a la primera página, salvo que se pida otra.
  const destinoPagina = 'pagina' in cambios ? cambios.pagina : '0';
  const params = new URLSearchParams();
  for (const [clave, valor] of Object.entries(fusionada)) {
    if (!valor || clave === 'pagina') continue;
    params.set(clave, valor);
  }
  if (destinoPagina && destinoPagina !== '0') params.set('pagina', destinoPagina);
  const texto = params.toString();
  return texto ? `/banco?${texto}` : '/banco';
}

type Ligero = {
  id: string;
  codigo: string;
  bloom: string;
  dificultad: string;
  habilidad: string;
  estado: string;
  figuraId: string | null;
  textoId: string | null;
  objetivoId: string | null;
  nivel: { codigo: string; nombre: string };
  asignatura: { codigo: string; nombre: string };
  eje: { nombre: string };
  versiones: { enunciado: string }[];
};

/** Minúsculas y sin tildes, para que «aplicacion» encuentre «aplicación». */
function normalizar(valor: string): string {
  return valor
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

export default async function Banco({ searchParams }: { searchParams: Promise<Consulta> }) {
  const sesion = await sesionActual();
  if (!sesion) redirect('/login');
  if (sesion.tipo !== 'usuario') redirect('/alumno');

  const params = await searchParams;

  const niveles = lista(params.nivel);
  const asignaturas = lista(params.asignatura);
  const ejes = lista(params.eje);
  const blooms = lista(params.bloom);
  const dificultades = lista(params.dificultad);
  const habilidades = lista(params.habilidad);
  const recursos = lista(params.recurso);
  const origenes = lista(params.origen);
  const estados = lista(params.estado);
  const codigo = (params.codigo ?? '').trim();
  const texto = (params.q ?? '').trim();
  const orden = ORDENES.some((o) => o.clave === params.orden) ? params.orden! : 'codigo';
  const tam = TAMANOS.includes(Number(params.tam)) ? Number(params.tam) : 10;
  const pagina = Math.max(0, Number.parseInt(params.pagina ?? '0', 10) || 0);
  const vista = params.vista === 'tabla' ? 'tabla' : 'tarjetas';

  // Una sola lectura ligera: con 1.926 ítems alcanza para contar facetas exactas
  // sin repetir consultas por cada filtro.
  const ligeros: Ligero[] = await prisma.item.findMany({
    select: {
      id: true,
      codigo: true,
      bloom: true,
      dificultad: true,
      habilidad: true,
      estado: true,
      figuraId: true,
      textoId: true,
      objetivoId: true,
      nivel: { select: { codigo: true, nombre: true } },
      asignatura: { select: { codigo: true, nombre: true } },
      eje: { select: { nombre: true } },
      versiones: { select: { enunciado: true }, orderBy: { version: 'desc' }, take: 1 },
    },
    orderBy: { codigo: 'asc' },
  });

  function valoresHabilidad(): string[] {
    const elegidas = HABILIDADES.filter((h) => habilidades.includes(h.clave));
    if (!elegidas.length) return [];
    const conocidas = new Set(HABILIDADES.flatMap((h) => h.valores));
    const sueltas = elegidas.flatMap((h) => h.valores);
    return ligeros.some((i) => !conocidas.has(i.habilidad)) ? [...sueltas, '__otras__'] : sueltas;
  }

  const valoresHab = valoresHabilidad();

  type Dimension =
    | 'nivel'
    | 'asignatura'
    | 'eje'
    | 'bloom'
    | 'dificultad'
    | 'habilidad'
    | 'recurso'
    | 'origen'
    | 'estado'
    | 'codigo'
    | 'q';

  function cumple(i: Ligero, omitir?: Dimension): boolean {
    if (omitir !== 'nivel' && niveles.length && !niveles.includes(i.nivel.codigo)) return false;
    if (omitir !== 'asignatura' && asignaturas.length && !asignaturas.includes(i.asignatura.codigo))
      return false;
    if (omitir !== 'eje' && ejes.length && !ejes.includes(i.eje.nombre)) return false;
    if (omitir !== 'bloom' && blooms.length && !blooms.includes(i.bloom)) return false;
    if (omitir !== 'dificultad' && dificultades.length && !dificultades.includes(i.dificultad))
      return false;
    if (omitir !== 'habilidad' && valoresHab.length) {
      const enLista = valoresHab.includes(i.habilidad);
      const esOtra = valoresHab.includes('__otras__') && !HABILIDADES.some((h) => h.valores.includes(i.habilidad));
      if (!enLista && !esOtra) return false;
    }
    if (omitir !== 'recurso' && recursos.length) {
      const ok = recursos.some((r) =>
        r === 'figura'
          ? i.figuraId !== null
          : r === 'sinfigura'
            ? i.figuraId === null
            : r === 'texto'
              ? i.textoId !== null
              : r === 'sinatexto'
                ? i.textoId === null
                : i.objetivoId !== null,
      );
      if (!ok) return false;
    }
    if (omitir !== 'origen' && origenes.length) {
      const esGenerado = i.codigo.startsWith('GEN');
      const ok = origenes.some((o) => (o === 'gen' ? esGenerado : !esGenerado));
      if (!ok) return false;
    }
    if (omitir !== 'estado' && estados.length && !estados.includes(i.estado)) return false;
    if (omitir !== 'codigo' && codigo && !i.codigo.toLowerCase().includes(codigo.toLowerCase()))
      return false;
    if (omitir !== 'q' && texto) {
      const aguja = normalizar(texto);
      if (!normalizar(i.versiones[0]?.enunciado ?? '').includes(aguja)) return false;
    }
    return true;
  }

  const filtrados = ligeros.filter((i) => cumple(i));

  function contar(dimension: Dimension, clave: (i: Ligero) => string): Map<string, number> {
    const mapa = new Map<string, number>();
    for (const i of ligeros) {
      if (!cumple(i, dimension)) continue;
      const k = clave(i);
      mapa.set(k, (mapa.get(k) ?? 0) + 1);
    }
    return mapa;
  }

  const cuentaNivel = contar('nivel', (i) => i.nivel.codigo);
  const cuentaAsignatura = contar('asignatura', (i) => i.asignatura.codigo);
  const cuentaEje = contar('eje', (i) => i.eje.nombre);
  const cuentaBloom = contar('bloom', (i) => i.bloom);
  const cuentaDificultad = contar('dificultad', (i) => i.dificultad);
  const cuentaHabilidad = contar('habilidad', (i) => i.habilidad);
  const cuentaEstado = contar('estado', (i) => i.estado);

  const total = ligeros.length;
  const encontrados = filtrados.length;

  const ordenados = [...filtrados].sort((a, b) => {
    if (orden === 'curso') {
      return (
        a.nivel.nombre.localeCompare(b.nivel.nombre, 'es') ||
        a.eje.nombre.localeCompare(b.eje.nombre, 'es') ||
        a.codigo.localeCompare(b.codigo)
      );
    }
    if (orden === 'dificultad') {
      const peso: Record<string, number> = { facil: 0, media: 1, dificil: 2 };
      return (peso[a.dificultad] ?? 9) - (peso[b.dificultad] ?? 9) || a.codigo.localeCompare(b.codigo);
    }
    if (orden === 'eje') {
      return a.eje.nombre.localeCompare(b.eje.nombre, 'es') || a.codigo.localeCompare(b.codigo);
    }
    return a.codigo.localeCompare(b.codigo);
  });

  const paginas = Math.max(1, Math.ceil(encontrados / tam));
  const paginaActual = Math.min(pagina, paginas - 1);
  const ids = ordenados.slice(paginaActual * tam, paginaActual * tam + tam).map((i) => i.id);

  const items = ids.length
    ? await prisma.item.findMany({
        where: { id: { in: ids } },
        include: {
          nivel: true,
          asignatura: true,
          eje: true,
          figura: true,
          versiones: { include: { alternativas: { orderBy: { letra: 'asc' } } } },
        },
      })
    : [];

  const porId = new Map(items.map((i) => [i.id, i]));
  const paginaItems = ids.map((id) => porId.get(id)).filter((i): i is NonNullable<typeof i> => Boolean(i));

  // Facetas: nombres de nivel y asignatura vienen de los datos, no de la tabla.
  const nombreNivel = new Map<string, string>();
  const nombreAsignatura = new Map<string, string>();
  for (const i of ligeros) {
    nombreNivel.set(i.nivel.codigo, i.nivel.nombre);
    nombreAsignatura.set(i.asignatura.codigo, i.asignatura.nombre);
  }

  const activos: { etiqueta: string; quitar: string }[] = [];
  for (const n of niveles)
    activos.push({ etiqueta: nombreNivel.get(n) ?? n, quitar: url(params, { nivel: alternar(params.nivel, n) }) });
  for (const a of asignaturas)
    activos.push({
      etiqueta: nombreAsignatura.get(a) ?? a,
      quitar: url(params, { asignatura: alternar(params.asignatura, a) }),
    });
  for (const e of ejes) activos.push({ etiqueta: e, quitar: url(params, { eje: alternar(params.eje, e) }) });
  for (const b of blooms) activos.push({ etiqueta: b, quitar: url(params, { bloom: alternar(params.bloom, b) }) });
  for (const d of dificultades)
    activos.push({ etiqueta: d, quitar: url(params, { dificultad: alternar(params.dificultad, d) }) });
  for (const h of habilidades) {
    const nombre = HABILIDADES.find((x) => x.clave === h)?.nombre ?? h;
    activos.push({ etiqueta: nombre, quitar: url(params, { habilidad: alternar(params.habilidad, h) }) });
  }
  for (const r of recursos) {
    const nombre = RECURSOS.find((x) => x.clave === r)?.nombre ?? r;
    activos.push({ etiqueta: nombre, quitar: url(params, { recurso: alternar(params.recurso, r) }) });
  }
  for (const o of origenes)
    activos.push({ etiqueta: o === 'gen' ? 'Generados' : 'Originales', quitar: url(params, { origen: alternar(params.origen, o) }) });
  for (const e of estados)
    activos.push({ etiqueta: e === 'BORRADOR' ? 'Borradores' : 'Aprobados', quitar: url(params, { estado: alternar(params.estado, e) }) });
  if (codigo) activos.push({ etiqueta: `código: ${codigo}`, quitar: url(params, { codigo: '' }) });
  if (texto) activos.push({ etiqueta: `texto: ${texto}`, quitar: url(params, { q: '' }) });

  const hayFiltros = activos.length > 0;

  function Chip({
    activo,
    href,
    children,
    cuenta,
  }: {
    activo: boolean;
    href: string;
    children: React.ReactNode;
    cuenta?: number;
  }) {
    return (
      <a
        href={href}
        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition ${
          activo
            ? 'border-marca bg-marca text-white'
            : 'border-borde bg-white text-slate-700 hover:border-marca/30 hover:bg-fondo'
        }`}
      >
        {children}
        {typeof cuenta === 'number' ? (
          <span className={activo ? 'text-white/70' : 'text-tenue/70'}>{cuenta}</span>
        ) : null}
      </a>
    );
  }

  function Grupo({ titulo, children }: { titulo: string; children: React.ReactNode }) {
    return (
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="w-24 shrink-0 text-[11px] font-medium uppercase tracking-[0.14em] text-tenue">
          {titulo}
        </span>
        <div className="flex flex-wrap gap-1.5">{children}</div>
      </div>
    );
  }

  return (
    <Panel nombre={sesion.nombre} rol={sesion.rol} activo="/banco">
      <div className="mx-auto max-w-5xl space-y-5 px-6 py-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-marca">Banco de ítems</h1>
            <p className="text-xs text-tenue">
              {encontrados === total ? (
                <>{total} ítems en el banco</>
              ) : (
                <>
                  <span className="tabular font-medium text-marca">{encontrados}</span> de {total}{' '}
                  ítems
                </>
              )}
              {hayFiltros ? ' con estos filtros' : ''}
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <a
              href={url(params, { vista: vista === 'tabla' ? '' : 'tabla' })}
              className="rounded-lg border border-borde px-3 py-1.5 text-slate-700 hover:bg-fondo"
            >
              {vista === 'tabla' ? 'Ver tarjetas' : 'Ver tabla'}
            </a>
            {hayFiltros ? (
              <a
                href="/banco"
                className="rounded-lg border border-borde px-3 py-1.5 text-slate-700 hover:bg-fondo"
              >
                Limpiar todo
              </a>
            ) : null}
          </div>
        </div>

        {/* ------------------------------------------------------------ filtros */}
        <section className="space-y-3 rounded-2xl border border-borde bg-white p-4">
          <Grupo titulo="Curso">
            {[...nombreNivel.entries()].map(([codigoNivel, nombre]) => (
              <Chip
                key={codigoNivel}
                activo={niveles.includes(codigoNivel)}
                href={url(params, { nivel: alternar(params.nivel, codigoNivel) })}
                cuenta={cuentaNivel.get(codigoNivel) ?? 0}
              >
                {nombre}
              </Chip>
            ))}
          </Grupo>

          <Grupo titulo="Asignatura">
            {[...nombreAsignatura.entries()].map(([codigoAsig, nombre]) => (
              <Chip
                key={codigoAsig}
                activo={asignaturas.includes(codigoAsig)}
                href={url(params, { asignatura: alternar(params.asignatura, codigoAsig) })}
                cuenta={cuentaAsignatura.get(codigoAsig) ?? 0}
              >
                {nombre}
              </Chip>
            ))}
          </Grupo>

          <Grupo titulo="Eje">
            {[...cuentaEje.entries()]
              .sort((a, b) => b[1] - a[1])
              .map(([nombre, cuenta]) => (
                <Chip
                  key={nombre}
                  activo={ejes.includes(nombre)}
                  href={url(params, { eje: alternar(params.eje, nombre) })}
                  cuenta={cuenta}
                >
                  {nombre}
                </Chip>
              ))}
          </Grupo>

          <Grupo titulo="Bloom">
            {BLOOMS.map((b) => (
              <Chip
                key={b}
                activo={blooms.includes(b)}
                href={url(params, { bloom: alternar(params.bloom, b) })}
                cuenta={cuentaBloom.get(b) ?? 0}
              >
                {b}
              </Chip>
            ))}
          </Grupo>

          <Grupo titulo="Dificultad">
            {DIFICULTADES.map((d) => (
              <Chip
                key={d}
                activo={dificultades.includes(d)}
                href={url(params, { dificultad: alternar(params.dificultad, d) })}
                cuenta={cuentaDificultad.get(d) ?? 0}
              >
                {d}
              </Chip>
            ))}
          </Grupo>

          <Grupo titulo="Habilidad">
            {HABILIDADES.map((h) => {
              const cuenta = h.valores.reduce((s, v) => s + (cuentaHabilidad.get(v) ?? 0), 0);
              return (
                <Chip
                  key={h.clave}
                  activo={habilidades.includes(h.clave)}
                  href={url(params, { habilidad: alternar(params.habilidad, h.clave) })}
                  cuenta={cuenta}
                >
                  {h.nombre}
                </Chip>
              );
            })}
          </Grupo>

          <Grupo titulo="Recursos">
            {RECURSOS.map((r) => {
              const totalRecurso = ligeros
                .filter((i) => cumple(i, 'recurso'))
                .filter((i) =>
                  r.clave === 'figura'
                    ? i.figuraId !== null
                    : r.clave === 'sinfigura'
                      ? i.figuraId === null
                      : r.clave === 'texto'
                        ? i.textoId !== null
                        : r.clave === 'sinatexto'
                          ? i.textoId === null
                          : i.objetivoId !== null,
                ).length;
              return (
                <Chip
                  key={r.clave}
                  activo={recursos.includes(r.clave)}
                  href={url(params, { recurso: alternar(params.recurso, r.clave) })}
                  cuenta={totalRecurso}
                >
                  {r.nombre}
                </Chip>
              );
            })}
          </Grupo>

          <Grupo titulo="Origen">
            <Chip
              activo={origenes.includes('original')}
              href={url(params, { origen: alternar(params.origen, 'original') })}
              cuenta={ligeros.filter((i) => cumple(i, 'origen') && !i.codigo.startsWith('GEN')).length}
            >
              Originales
            </Chip>
            <Chip
              activo={origenes.includes('gen')}
              href={url(params, { origen: alternar(params.origen, 'gen') })}
              cuenta={ligeros.filter((i) => cumple(i, 'origen') && i.codigo.startsWith('GEN')).length}
            >
              Generados
            </Chip>
          </Grupo>

          <Grupo titulo="Estado">
            {['APROBADO', 'BORRADOR'].map((e) => (
              <Chip
                key={e}
                activo={estados.includes(e)}
                href={url(params, { estado: alternar(params.estado, e) })}
                cuenta={cuentaEstado.get(e) ?? 0}
              >
                {e === 'BORRADOR' ? 'Borradores' : 'Aprobados'}
              </Chip>
            ))}
          </Grupo>

          <form action="/banco" method="get" className="flex flex-wrap items-end gap-2 border-t border-borde pt-3">
            {Object.entries(params).map(([clave, valor]) =>
              valor && clave !== 'codigo' && clave !== 'q' && clave !== 'pagina' ? (
                <input key={clave} type="hidden" name={clave} value={valor} />
              ) : null,
            )}
            <input type="hidden" name="pagina" value="0" />
            <label className="block text-[11px] font-medium uppercase tracking-[0.14em] text-tenue">
              Código
              <input
                name="codigo"
                defaultValue={codigo}
                placeholder="GEN2M-MAT-014"
                className="mt-1 w-44 rounded-lg border border-borde px-3 py-1.5 text-sm text-marca"
              />
            </label>
            <label className="block text-[11px] font-medium uppercase tracking-[0.14em] text-tenue">
              Texto del enunciado
              <input
                name="q"
                defaultValue={texto}
                placeholder="valor de x"
                className="mt-1 w-64 rounded-lg border border-borde px-3 py-1.5 text-sm text-marca"
              />
            </label>
            <button className="rounded-lg border border-borde px-3 py-1.5 text-xs text-slate-700 hover:bg-fondo">
              Buscar
            </button>
          </form>
        </section>

        {/* ------------------------------------------------------- filtros activos */}
        {hayFiltros ? (
          <div className="flex flex-wrap items-center gap-1.5">
            {activos.map((a) => (
              <a
                key={a.etiqueta + a.quitar}
                href={a.quitar}
                className="inline-flex items-center gap-1.5 rounded-full bg-acento-suave px-3 py-1 text-xs font-medium text-marca"
              >
                {a.etiqueta}
                <span aria-hidden="true">×</span>
              </a>
            ))}
            <a href="/banco" className="px-2 text-xs text-tenue underline-offset-2 hover:underline">
              limpiar todo
            </a>
          </div>
        ) : null}

        {/* --------------------------------------------------------- orden y tamaño */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-tenue">
          <form action="/banco" method="get" className="flex items-center gap-2">
            {Object.entries(params).map(([clave, valor]) =>
              valor && clave !== 'orden' && clave !== 'tam' && clave !== 'pagina' ? (
                <input key={clave} type="hidden" name={clave} value={valor} />
              ) : null,
            )}
            <input type="hidden" name="pagina" value="0" />
            <label className="flex items-center gap-1.5">
              Orden
              <select
                name="orden"
                defaultValue={orden}
                className="rounded-lg border border-borde bg-white px-2 py-1 text-xs text-marca"
              >
                {ORDENES.map((o) => (
                  <option key={o.clave} value={o.clave}>
                    {o.nombre}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-1.5">
              Mostrar
              <select
                name="tam"
                defaultValue={String(tam)}
                className="rounded-lg border border-borde bg-white px-2 py-1 text-xs text-marca"
              >
                {TAMANOS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
            <button className="rounded-lg border border-borde px-2 py-1 hover:bg-fondo">Aplicar</button>
          </form>
          <span className="tabular">
            Página {paginaActual + 1} de {paginas}
          </span>
        </div>

        {/* ---------------------------------------------------------------- listado */}
        {vista === 'tabla' ? (
          <div className="overflow-x-auto rounded-2xl border border-borde bg-white">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-borde bg-fondo text-tenue">
                <tr>
                  <th className="px-3 py-2 font-medium">Código</th>
                  <th className="px-3 py-2 font-medium">Curso</th>
                  <th className="px-3 py-2 font-medium">Asignatura</th>
                  <th className="px-3 py-2 font-medium">Eje</th>
                  <th className="px-3 py-2 font-medium">Bloom</th>
                  <th className="px-3 py-2 font-medium">Dificultad</th>
                  <th className="px-3 py-2 font-medium">Figura</th>
                  <th className="px-3 py-2 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-borde">
                {paginaItems.map((item) => (
                  <tr key={item.id} className="hover:bg-fondo">
                    <td className="whitespace-nowrap px-3 py-2 font-mono text-tenue">{item.codigo}</td>
                    <td className="px-3 py-2 text-slate-700">{item.nivel.nombre}</td>
                    <td className="px-3 py-2 text-slate-700">{item.asignatura.nombre}</td>
                    <td className="px-3 py-2 text-slate-700">{item.eje.nombre}</td>
                    <td className="px-3 py-2 text-slate-700">{item.bloom}</td>
                    <td className="px-3 py-2 text-slate-700">{item.dificultad}</td>
                    <td className="px-3 py-2 text-slate-700">{item.figura ? 'sí' : '—'}</td>
                    <td className="px-3 py-2 text-slate-700">{item.estado}</td>
                  </tr>
                ))}
                {paginaItems.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-3 py-6 text-center text-tenue">
                      No hay ítems con esos filtros.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        ) : (
          <ul className="space-y-4">
            {paginaItems.map((item) => {
              const v = item.versiones[0];
              return (
                <li key={item.id} className="rounded-2xl border border-borde bg-white p-5">
                  <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-mono text-tenue">{item.codigo}</span>
                    <span className="text-tenue">
                      {item.nivel.nombre} · {item.asignatura.nombre} · {item.eje.nombre}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 font-medium ${COLOR_BLOOM[item.bloom] ?? 'bg-borde text-tenue'}`}
                    >
                      {item.bloom}
                    </span>
                    <span className="rounded-full bg-fondo px-2 py-0.5 text-tenue">{item.habilidad}</span>
                    <span className="rounded-full bg-fondo px-2 py-0.5 text-tenue">{item.dificultad}</span>
                    {item.figura ? (
                      <span className="rounded-full bg-acento-suave px-2 py-0.5 text-marca">con figura</span>
                    ) : null}
                  </div>

                  <TextoPotencia
                    className="block whitespace-pre-line text-sm text-slate-800"
                    texto={v?.enunciado ?? ''}
                  />

                  {item.figura ? (
                    <div className="my-3 max-w-sm border border-borde p-2 text-slate-900">
                      <Figura primitivas={item.figura.primitivas} className="max-h-64 w-full" />
                    </div>
                  ) : null}

                  <ul className="mt-2 space-y-1">
                    {(v?.alternativas ?? []).map((a) => (
                      <li
                        key={a.id}
                        className={`flex gap-2 rounded px-2 py-1 text-sm ${
                          a.letra === v?.clave ? 'bg-acento-suave font-medium text-marca' : 'text-slate-700'
                        }`}
                      >
                        <span className="w-4 shrink-0 font-semibold">{a.letra}</span>
                        <span>
                          <TextoPotencia texto={a.texto ?? ''} />
                        </span>
                        {a.letra === v?.clave ? (
                          <span className="ml-auto text-xs uppercase tracking-wide">clave</span>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </li>
              );
            })}
            {paginaItems.length === 0 ? (
              <li className="rounded-2xl border border-dashed border-borde bg-white p-6 text-sm text-tenue">
                No hay ítems con esos filtros.
              </li>
            ) : null}
          </ul>
        )}

        {/* ------------------------------------------------------------ paginación */}
        {paginas > 1 ? (
          <div className="flex items-center justify-between text-xs text-tenue">
            <a
              href={url(params, { pagina: String(Math.max(0, paginaActual - 1)) })}
              className={`rounded-lg border border-borde px-3 py-1.5 ${
                paginaActual === 0 ? 'pointer-events-none opacity-40' : 'hover:bg-fondo'
              }`}
            >
              Anterior
            </a>
            <div className="flex items-center gap-1">
              {[...Array(paginas).keys()]
                .filter((p) => p === 0 || p === paginas - 1 || Math.abs(p - paginaActual) <= 2)
                .map((p, idx, arr) => (
                  <span key={p} className="flex items-center gap-1">
                    {idx > 0 && p - arr[idx - 1] > 1 ? <span className="px-1">…</span> : null}
                    <a
                      href={url(params, { pagina: String(p) })}
                      className={`rounded-lg px-2.5 py-1.5 ${
                        p === paginaActual
                          ? 'bg-marca text-white'
                          : 'border border-borde text-slate-700 hover:bg-fondo'
                      }`}
                    >
                      {p + 1}
                    </a>
                  </span>
                ))}
            </div>
            <a
              href={url(params, { pagina: String(Math.min(paginas - 1, paginaActual + 1)) })}
              className={`rounded-lg border border-borde px-3 py-1.5 ${
                paginaActual >= paginas - 1 ? 'pointer-events-none opacity-40' : 'hover:bg-fondo'
              }`}
            >
              Siguiente
            </a>
          </div>
        ) : null}
      </div>
    </Panel>
  );
}
