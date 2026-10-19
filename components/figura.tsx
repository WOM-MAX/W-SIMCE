// Dibuja las primitivas de Figura.primitivas como SVG, sin dependencias.
// Operaciones observadas en el banco: rect, line, text, circle, poly y path.

type Elemento = Record<string, unknown>;

function numero(valor: unknown, defecto = 0): number {
  const n = typeof valor === 'number' ? valor : Number(valor);
  return Number.isFinite(n) ? n : defecto;
}

// gris viene en 0..1 (0 negro). Si llegara en 0..100 se normaliza.
function tono(gris: unknown, defecto = 0): string {
  let v = numero(gris, defecto);
  if (v > 1) v = v / 100;
  v = Math.max(0, Math.min(1, v));
  const c = Math.round(v * 255);
  return `rgb(${c},${c},${c})`;
}

function ancla(valor: unknown): 'start' | 'middle' | 'end' {
  if (valor === 'medio') return 'middle';
  if (valor === 'fin') return 'end';
  return 'start';
}

function partirTexto(texto: string, ancho: number | undefined, tam: number): string[] {
  if (!texto) return [''];
  if (!ancho || ancho <= 0) return [texto];
  const porLinea = Math.max(8, Math.floor(ancho / (tam * 0.52)));
  if (texto.length <= porLinea) return [texto];

  const lineas: string[] = [];
  let actual = '';
  for (const palabra of texto.split(/\s+/)) {
    const candidata = actual ? `${actual} ${palabra}` : palabra;
    if (candidata.length > porLinea && actual) {
      lineas.push(actual);
      actual = palabra;
    } else {
      actual = candidata;
    }
  }
  if (actual) lineas.push(actual);
  return lineas;
}

function puntos(valor: unknown): string {
  if (!Array.isArray(valor)) return '';
  const partes: string[] = [];
  for (const p of valor) {
    if (Array.isArray(p)) partes.push(`${numero(p[0])},${numero(p[1])}`);
    else if (p && typeof p === 'object') {
      const o = p as Record<string, unknown>;
      partes.push(`${numero(o.x)},${numero(o.y)}`);
    }
  }
  return partes.join(' ');
}

function dibujar(e: Elemento, clave: number) {
  const op = String(e.op ?? '');
  const grosor = numero(e.grosor, 1);
  const trazo = e.punteada ? '3 3' : undefined;

  if (op === 'rect') {
    const relleno = e.relleno === 'gris' ? tono(0.85) : 'transparent';
    return (
      <rect
        key={clave}
        x={numero(e.x)}
        y={numero(e.y)}
        width={numero(e.w)}
        height={numero(e.h)}
        fill={relleno}
        fillOpacity={e.relleno === 'gris' ? numero(e.grisRelleno, 1) : 1}
        stroke="currentColor"
        strokeWidth={grosor}
        strokeDasharray={trazo}
      />
    );
  }

  if (op === 'line') {
    return (
      <line
        key={clave}
        x1={numero(e.x1)}
        y1={numero(e.y1)}
        x2={numero(e.x2)}
        y2={numero(e.y2)}
        stroke="currentColor"
        strokeWidth={grosor}
        strokeDasharray={trazo}
      />
    );
  }

  if (op === 'circle') {
    return (
      <circle
        key={clave}
        cx={numero(e.cx)}
        cy={numero(e.cy)}
        r={numero(e.r)}
        fill={e.relleno === 'gris' ? tono(0.85) : 'transparent'}
        fillOpacity={e.relleno === 'gris' ? numero(e.grisRelleno, 1) : 1}
        stroke="currentColor"
        strokeWidth={grosor}
        strokeDasharray={trazo}
      />
    );
  }

  if (op === 'poly') {
    return (
      <polygon
        key={clave}
        points={puntos(e.puntos)}
        fill={e.relleno === 'gris' ? tono(0.85) : 'transparent'}
        fillOpacity={e.relleno === 'gris' ? numero(e.grisRelleno, 1) : 1}
        stroke="currentColor"
        strokeWidth={grosor}
        strokeDasharray={trazo}
      />
    );
  }

  if (op === 'path') {
    return (
      <path
        key={clave}
        d={String(e.d ?? '')}
        fill={e.relleno === 'gris' ? tono(0.85) : 'none'}
        stroke="currentColor"
        strokeWidth={grosor}
        strokeDasharray={trazo}
      />
    );
  }

  if (op === 'text') {
    const tam = numero(e.tam, 8);
    const texto = String(e.texto ?? '');
    const ancho = typeof e.ancho === 'number' ? e.ancho : undefined;
    const lineas = partirTexto(texto, ancho, tam);
    const x = numero(e.x);
    const y = numero(e.y);
    return (
      <text
        key={clave}
        x={x}
        y={y}
        fontSize={tam}
        fontFamily="Helvetica, Arial, sans-serif"
        fontWeight={e.negrita ? 700 : 400}
        textAnchor={ancla(e.anclaje)}
        fill="currentColor"
        stroke={trazo ? 'currentColor' : undefined}
        strokeWidth={trazo ? grosor : undefined}
      >
        {lineas.map((linea, i) => (
          <tspan key={i} x={x} dy={i === 0 ? 0 : tam * 1.25}>
            {linea}
          </tspan>
        ))}
      </text>
    );
  }

  return null;
}

export function Figura({
  primitivas,
  className = 'max-h-72 w-full',
}: {
  primitivas: unknown;
  className?: string;
}) {
  const p = (primitivas ?? {}) as Record<string, unknown>;
  const ancho = numero(p.ancho, 400);
  const alto = numero(p.alto, 200);
  const elementos = Array.isArray(p.elementos) ? (p.elementos as Elemento[]) : [];

  if (!elementos.length) return null;

  return (
    <svg
      viewBox={`0 0 ${ancho} ${alto}`}
      className={className}
      role="img"
      aria-label="Figura del ítem"
      preserveAspectRatio="xMidYMid meet"
    >
      {elementos.map((e, i) => dibujar(e, i))}
    </svg>
  );
}
