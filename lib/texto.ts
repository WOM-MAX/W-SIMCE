// Los enunciados guardan las potencias como x^2 o f^-1. Aqui se separan en
// tramos normales y tramos en superindice, para que la vista los pinte bien.

export type Tramo = { texto: string; supra: boolean };

const ALFANUMERICO = /[0-9a-zA-Z]/;

export function partirConPotencia(entrada: string): Tramo[] {
  const tramos: Tramo[] = [];
  let resto = entrada;

  while (resto.length > 0) {
    const i = resto.indexOf('^');

    if (i === -1) {
      tramos.push({ texto: resto, supra: false });
      break;
    }

    if (i > 0) tramos.push({ texto: resto.slice(0, i), supra: false });

    let j = i + 1;
    let supra = '';

    if (resto[j] === '{') {
      const fin = resto.indexOf('}', j);
      if (fin === -1) {
        supra = resto.slice(j + 1);
        j = resto.length;
      } else {
        supra = resto.slice(j + 1, fin);
        j = fin + 1;
      }
    } else {
      if (resto[j] === '-') {
        supra = '-';
        j += 1;
      }
      while (j < resto.length && ALFANUMERICO.test(resto[j])) {
        supra += resto[j];
        j += 1;
      }
    }

    // Un ^ suelto sin nada detras se deja tal cual.
    if (!supra || supra === '-') {
      tramos.push({ texto: '^', supra: false });
      resto = resto.slice(i + 1);
      continue;
    }

    tramos.push({ texto: supra, supra: true });
    resto = resto.slice(j);
  }

  return tramos;
}
