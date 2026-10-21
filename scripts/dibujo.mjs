// Convierte las primitivas de una figura en SVG. Misma logica que el componente
// de la aplicacion, con el texto en <text> porque resvg no pinta dentro de <g>.

const FACTOR = 0.52;

export function svgDePrimitivas(primitivas) {
  const p = primitivas ?? {};
  const ancho = numero(p.ancho, 400);
  const alto = numero(p.alto, 200);
  const elementos = Array.isArray(p.elementos) ? p.elementos : [];
  return { ancho, alto, cuerpo: elementos.map(dibujar).join('') };
}

function numero(valor, defecto = 0) {
  const n = typeof valor === 'number' ? valor : Number(valor);
  return Number.isFinite(n) ? n : defecto;
}

function escapar(t) {
  return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// gris viene en 0..1 (0 negro). Es el tono del trazo y del texto; sin gris, negro.
function tono(gris, defecto = 0) {
  let v = numero(gris, defecto);
  if (v > 1) v = v / 100;
  v = Math.max(0, Math.min(1, v));
  const c = Math.round(v * 255);
  return `rgb(${c},${c},${c})`;
}

function color(e) {
  const g = e.gris;
  return g === undefined || g === null ? '#000' : tono(g);
}

// Mismo relleno que el componente: gris son 217 y grisRelleno es la opacidad.
function rellenoDe(e) {
  if (e.relleno !== 'gris') return 'fill="none"';
  return `fill="rgb(217,217,217)" fill-opacity="${numero(e.grisRelleno, 1)}"`;
}

function partirTexto(texto, ancho, tam) {
  if (!texto) return [''];
  if (!ancho || ancho <= 0) return [texto];
  const porLinea = Math.max(8, Math.floor(ancho / (tam * FACTOR)));
  const lineas = [];
  let actual = '';
  for (const palabra of texto.split(/\s+/)) {
    const prueba = actual ? `${actual} ${palabra}` : palabra;
    if (prueba.length > porLinea) {
      if (actual) lineas.push(actual);
      actual = palabra;
    } else {
      actual = prueba;
    }
  }
  if (actual) lineas.push(actual);
  return lineas.length ? lineas : [''];
}

function dibujar(e) {
  const grosor = numero(e.grosor, 1);
  const trazo = e.punteada ? ' stroke-dasharray="3 3"' : '';

  if (e.op === 'rect') {
    return `<rect x="${numero(e.x)}" y="${numero(e.y)}" width="${numero(e.w)}" height="${numero(e.h)}" ${rellenoDe(e)} stroke="${color(e)}" stroke-width="${grosor}"${trazo}/>`;
  }
  if (e.op === 'line') {
    return `<line x1="${numero(e.x1)}" y1="${numero(e.y1)}" x2="${numero(e.x2)}" y2="${numero(e.y2)}" stroke="${color(e)}" stroke-width="${grosor}"${trazo}/>`;
  }
  if (e.op === 'circle') {
    return `<circle cx="${numero(e.cx)}" cy="${numero(e.cy)}" r="${numero(e.r)}" ${rellenoDe(e)} stroke="${color(e)}" stroke-width="${grosor}"${trazo}/>`;
  }
  if (e.op === 'poly') {
    return `<polygon points="${escapar(e.puntos ?? '')}" ${rellenoDe(e)} stroke="${color(e)}" stroke-width="${grosor}"${trazo}/>`;
  }
  if (e.op === 'path') {
    return `<path d="${escapar(e.d ?? '')}" ${rellenoDe(e)} stroke="${color(e)}" stroke-width="${grosor}"${trazo}/>`;
  }
  if (e.op === 'text') {
    const tam = numero(e.tam, 8);
    const lineas = partirTexto(String(e.texto ?? ''), typeof e.ancho === 'number' ? e.ancho : undefined, tam);
    const x = numero(e.x);
    const y = numero(e.y);
    const peso = e.negrita ? 700 : 400;
    const anclaje = e.anclaje === 'medio' ? 'middle' : e.anclaje === 'fin' ? 'end' : 'start';
    return lineas
      .map(
        (linea, i) =>
          `<text x="${x}" y="${y + i * tam * 1.25}" font-size="${tam}" font-weight="${peso}" font-family="Helvetica, Arial, sans-serif" text-anchor="${anclaje}" fill="${color(e)}">${escapar(linea)}</text>`
      )
      .join('');
  }
  return '';
}
