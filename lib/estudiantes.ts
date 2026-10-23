import { prisma } from '@/lib/prisma';

// Código estable: no contiene el curso, así no queda obsoleto cuando el alumno
// avanza de nivel. Los códigos anteriores (W4B-01) se conservan tal cual.
export async function siguienteCodigoEstable(colegioId: string): Promise<string> {
  const existentes = await prisma.estudiante.findMany({
    where: { colegioId },
    select: { codigoAcceso: true },
  });

  let mayor = 0;
  const usados = new Set<string>();
  for (const e of existentes) {
    usados.add(e.codigoAcceso);
    const encontrado = /^W(\d{4,})$/.exec(e.codigoAcceso);
    if (encontrado) {
      const n = Number.parseInt(encontrado[1], 10);
      if (Number.isFinite(n) && n > mayor) mayor = n;
    }
  }

  let siguiente = mayor + 1;
  let codigo = `W${String(siguiente).padStart(4, '0')}`;
  while (usados.has(codigo)) {
    siguiente += 1;
    codigo = `W${String(siguiente).padStart(4, '0')}`;
  }
  return codigo;
}

// Genera el siguiente código libre con el prefijo del nivel, por ejemplo W4B-21.
export async function siguienteCodigo(colegioId: string, prefijo: string): Promise<string> {
  const existentes = await prisma.estudiante.findMany({
    where: { colegioId, codigoAcceso: { startsWith: prefijo } },
    select: { codigoAcceso: true },
  });

  let mayor = 0;
  for (const e of existentes) {
    const n = Number.parseInt(e.codigoAcceso.slice(prefijo.length), 10);
    if (Number.isFinite(n) && n > mayor) mayor = n;
  }

  const usados = new Set(existentes.map((e) => e.codigoAcceso));
  let siguiente = mayor + 1;
  let codigo = `${prefijo}${String(siguiente).padStart(2, '0')}`;
  while (usados.has(codigo)) {
    siguiente += 1;
    codigo = `${prefijo}${String(siguiente).padStart(2, '0')}`;
  }
  return codigo;
}
