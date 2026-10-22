// Modelo común del documento de un ensayo. Lo consumen el Word y el PDF, para
// que las dos salidas no se separen nunca.

import { prisma } from '@/lib/prisma';

export type Tamano = 'carta' | 'a4' | 'oficio';

export const TAMANOS: Record<Tamano, { nombre: string; mm: readonly [number, number]; css: string }> = {
  carta: { nombre: 'Carta', mm: [216, 279], css: 'letter' },
  a4: { nombre: 'A4', mm: [210, 297], css: 'A4' },
  oficio: { nombre: 'Oficio', mm: [216, 330], css: '216mm 330mm' },
};

export const TAMANO_POR_DEFECTO: Tamano = 'carta';

export function tamanoDe(valor: string | undefined | null): Tamano {
  if (valor === 'a4' || valor === 'oficio' || valor === 'carta') return valor;
  return TAMANO_POR_DEFECTO;
}

export type AlternativaDoc = { letra: string; texto: string };
export type LecturaDoc = { titulo: string; cuerpo: string; fuente: string | null };
export type FiguraDoc = { codigo: string; primitivas: unknown; anchoMm: number };

export type PreguntaDoc = {
  numero: number;
  enunciado: string;
  clave: string;
  alternativas: AlternativaDoc[];
  figura: FiguraDoc | null;
  lectura: LecturaDoc | null;
};

export type Documento = {
  ensayoId: string;
  titulo: string;
  colegio: string;
  nivel: string;
  asignatura: string;
  tiempoMin: number;
  conClave: boolean;
  tamano: Tamano;
  curso: string;
  fecha: string;
  preguntas: PreguntaDoc[];
  avisos: string[];
};

// Margen de 2 cm en los cuatro lados.
export const MARGEN_MM = 20;

// Ancho de la figura: 55% del ancho útil, con un tope de 95 mm.
export function anchoFiguraMm(tamano: Tamano): number {
  const util = TAMANOS[tamano].mm[0] - MARGEN_MM * 2;
  return Math.min(95, Math.round(util * 0.55));
}

export async function cargarDocumento(
  ensayoId: string,
  colegioId: string,
  opciones: { conClave: boolean; tamano: Tamano }
): Promise<Documento | null> {
  const ensayo = await prisma.ensayo.findFirst({
    where: { id: ensayoId, colegioId },
    include: {
      nivel: true,
      asignatura: true,
      colegio: true,
      asignaciones: { include: { curso: { select: { nombre: true } } } },
      items: {
        orderBy: { orden: 'asc' },
        include: {
          itemVersion: {
            include: {
              alternativas: { orderBy: { letra: 'asc' } },
              item: { include: { texto: true, figura: true } },
            },
          },
        },
      },
    },
  });

  if (!ensayo) return null;

  const anchoMm = anchoFiguraMm(opciones.tamano);

  // El curso solo existe cuando el ensayo está asignado; si no, se usa el nivel.
  const cursos = [...new Set(ensayo.asignaciones.map((a) => a.curso.nombre))];
  const curso = cursos.length > 0 ? cursos.join(', ') : ensayo.nivel.nombre;
  const fecha = new Date().toLocaleDateString('es-CL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'America/Santiago',
  });
  const textosVistos = new Set<string>();
  const avisos: string[] = [];

  const preguntas: PreguntaDoc[] = ensayo.items.map((ei, indice) => {
    const v = ei.itemVersion;
    const texto = v.item.texto;
    const figura = v.item.figura;

    let lectura: LecturaDoc | null = null;
    if (texto && !textosVistos.has(texto.id)) {
      textosVistos.add(texto.id);
      lectura = {
        titulo: texto.titulo,
        cuerpo: texto.cuerpo,
        fuente: texto.fuente ?? null,
      };
    }

    let figuraDoc: FiguraDoc | null = null;
    if (figura) {
      const primitivas = figura.primitivas as Record<string, unknown> | null;
      const elementos = Array.isArray(primitivas?.elementos) ? primitivas?.elementos : [];
      if (elementos && elementos.length > 0) {
        figuraDoc = { codigo: figura.codigo, primitivas, anchoMm };
      } else {
        avisos.push(`La figura de la pregunta ${indice + 1} no tiene dibujo y salió sin recuadro.`);
      }
    }

    return {
      numero: indice + 1,
      enunciado: v.enunciado,
      clave: v.clave,
      alternativas: v.alternativas.map((a) => ({ letra: a.letra, texto: a.texto ?? '' })),
      figura: figuraDoc,
      lectura,
    };
  });

  if (preguntas.length === 0) {
    avisos.push('El ensayo no tiene preguntas cargadas.');
  }

  return {
    ensayoId: ensayo.id,
    titulo: ensayo.titulo,
    colegio: ensayo.colegio?.nombre ?? 'Colegio Acrópolis',
    nivel: ensayo.nivel.nombre,
    asignatura: ensayo.asignatura.nombre,
    tiempoMin: ensayo.tiempoMin,
    curso,
    fecha,
    conClave: opciones.conClave,
    tamano: opciones.tamano,
    preguntas,
    avisos,
  };
}

// Nombre del archivo, sin acentos ni signos que compliquen la descarga.
export function nombreArchivo(doc: Documento, extension: 'docx' | 'pdf'): string {
  const base = doc.titulo
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
  const curso = doc.curso
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 30);
  const fecha = doc.fecha.replace(/[^0-9]/g, '-');
  return `${base || 'ensayo'}-${curso}-${fecha}-${doc.tamano}.${extension}`;
}
