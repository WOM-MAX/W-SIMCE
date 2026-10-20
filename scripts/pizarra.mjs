// Ayudante de dibujo con una sola transformacion de coordenadas matematicas a
// pixeles. Sirve para construir figuras sin colocar nada a ojo.

export function pizarra({ ancho = 320, alto = 300, margen = 34, xmin = 0, xmax = 8, ymin = 0, ymax = 8 } = {}) {
  const elementos = [];

  const X = (x) => margen + ((x - xmin) / (xmax - xmin)) * (ancho - 2 * margen);
  const Y = (y) => alto - margen - ((y - ymin) / (ymax - ymin)) * (alto - 2 * margen);

  const linea = (x1, y1, x2, y2, opciones = {}) => {
    elementos.push({
      op: 'line',
      x1: red(X(x1)),
      y1: red(Y(y1)),
      x2: red(X(x2)),
      y2: red(Y(y2)),
      grosor: opciones.grosor ?? 1,
      ...(opciones.punteada ? { punteada: true } : {}),
    });
  };

  const texto = (x, y, contenido, opciones = {}) => {
    elementos.push({
      op: 'text',
      x: red(opciones.px ?? X(x)),
      y: red(opciones.py ?? Y(y)),
      texto: contenido,
      tam: opciones.tam ?? 9,
      anclaje: opciones.anclaje ?? 'medio',
      ...(opciones.negrita ? { negrita: true } : {}),
      ...(opciones.ancho ? { ancho: opciones.ancho } : {}),
    });
  };

  const punto = (x, y, opciones = {}) => {
    elementos.push({ op: 'circle', cx: red(X(x)), cy: red(Y(y)), r: opciones.r ?? 2.4, grosor: 1 });
    if (opciones.etiqueta) {
      texto(0, 0, opciones.etiqueta, {
        px: X(x) + (opciones.dx ?? 8),
        py: Y(y) + (opciones.dy ?? -7),
        tam: 8,
        anclaje: 'izquierda',
      });
    }
  };

  const ejes = ({ paso = 2, rotulado = true } = {}) => {
    linea(xmin, 0, xmax, 0, { grosor: 1.1 });
    linea(0, ymin, 0, ymax, { grosor: 1.1 });

    for (let x = xmin; x <= xmax; x += paso) {
      if (x === 0) continue;
      linea(x, -0.12, x, 0.12, { grosor: 0.8 });
      if (rotulado) texto(0, 0, String(x), { px: X(x), py: Y(0) + 11, tam: 7.5 });
    }
    for (let y = ymin; y <= ymax; y += paso) {
      if (y === 0) continue;
      linea(-0.12, y, 0.12, y, { grosor: 0.8 });
      if (rotulado) texto(0, 0, String(y), { px: X(0) - 8, py: Y(y) + 3, tam: 7.5, anclaje: 'fin' });
    }

    texto(0, 0, 'x', { px: X(xmax) + 4, py: Y(0) + 24, tam: 9, anclaje: 'izquierda' });
    texto(0, 0, 'y', { px: X(0) + 8, py: Y(ymax) - 4, tam: 9, anclaje: 'izquierda' });
  };

  const recta = (x1, y1, x2, y2, opciones = {}) => {
    linea(x1, y1, x2, y2, { grosor: opciones.grosor ?? 1.4, punteada: opciones.punteada });
    if (opciones.etiqueta) {
      const tx = opciones.enX ?? (x1 + x2) / 2;
      const ty = y1 + ((y2 - y1) / (x2 - x1)) * (tx - x1);
      texto(0, 0, opciones.etiqueta, {
        px: X(tx) + (opciones.dx ?? 6),
        py: Y(ty) + (opciones.dy ?? -6),
        tam: 9,
        anclaje: 'izquierda',
      });
    }
  };

  const rectangulo = (x1, y1, x2, y2, opciones = {}) => {
    elementos.push({
      op: 'rect',
      x: red(X(x1)),
      y: red(Y(y2)),
      w: red(X(x2) - X(x1)),
      h: red(Y(y1) - Y(y2)),
      grosor: opciones.grosor ?? 1.1,
      ...(opciones.relleno ? { relleno: opciones.relleno } : {}),
    });
  };

  const triangulo = (p1, p2, p3, opciones = {}) => {
    elementos.push({
      op: 'poly',
      puntos: [p1, p2, p3].map(([x, y]) => `${red(X(x))},${red(Y(y))}`).join(' '),
      grosor: opciones.grosor ?? 1.2,
      ...(opciones.relleno ? { relleno: opciones.relleno } : {}),
    });
  };

  const curva = (fn, desde, hasta, opciones = {}) => {
    const paso = opciones.paso ?? 0.05;
    const puntos = [];
    for (let x = desde; x <= hasta + 1e-9; x += paso) {
      puntos.push(`${red(X(x))},${red(Y(fn(x)))}`);
    }
    elementos.push({
      op: 'poly',
      puntos: puntos.join(' '),
      grosor: opciones.grosor ?? 1.5,
    });
  };

  return { X, Y, linea, texto, punto, ejes, recta, rectangulo, triangulo, curva, elementos, ancho, alto };
}

function red(n) {
  return Math.round(n * 10) / 10;
}
