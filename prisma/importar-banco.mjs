// Importa el banco completo del proyecto de ensayos a W-SIMCE.
// Idempotente: se puede correr varias veces sin duplicar (clave: el código).
//
// Fuente: ENSAYOS SIMCE APP
//   app/datos/banco/fragmentos/*.js   -> ítems
//   app/datos/curriculo/*.js          -> niveles, ejes, objetivos, indicadores
//   app/datos/textos/*.js             -> textos de Lectura
//   app/datos/figuras/                -> figuras (se construyen a primitivas)
//   app/datos/ensayos/ENSAYOS.js      -> ensayos ya armados
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const ORIGEN =
  process.env.ORIGEN_BANCO ||
  'C:/Users/DELL/OneDrive - CORPORACIÓN EDUCACIONAL EDUARDO AGUILAR/COLEGIO ACRÓPOLIS 2026/ENSAYOS SIMCE APP';

const BANCO_MUESTRA = '4B-matematica-muestra';
const NOMBRES = {
  '4B': ['4° básico', 4],
  '6B': ['6° básico', 6],
  '8B': ['8° básico', 8],
  '2M': ['II medio', 12],
};

function evaluar(relativo) {
  const ruta = path.join(ORIGEN, relativo);
  new Function(fs.readFileSync(ruta, 'utf8'))();
}

function cargarTodo() {
  // Figuras: primero los constructores, después el catálogo y los fragmentos.
  evaluar('app/js/figuras/constructores.js');
  evaluar('app/datos/figuras/catalogo.js');
  for (const f of fs.readdirSync(path.join(ORIGEN, 'app/datos/figuras/fragmentos'))) {
    if (f.endsWith('.js')) evaluar(path.join('app/datos/figuras/fragmentos', f));
  }
  for (const f of fs.readdirSync(path.join(ORIGEN, 'app/datos/banco/fragmentos'))) {
    if (f.endsWith('.js')) evaluar(path.join('app/datos/banco/fragmentos', f));
  }
  for (const f of fs.readdirSync(path.join(ORIGEN, 'app/datos/curriculo'))) {
    if (f.endsWith('.js')) evaluar(path.join('app/datos/curriculo', f));
  }
  for (const f of fs.readdirSync(path.join(ORIGEN, 'app/datos/textos'))) {
    if (f.endsWith('.js')) evaluar(path.join('app/datos/textos', f));
  }
  evaluar('app/datos/ensayos/ENSAYOS.js');
}

const sha256 = (t) => crypto.createHash('sha256').update(t).digest('hex');
const uuid = () => crypto.randomUUID();
const bancoDe = (item) => `${item.curso}-${item.asignatura}`;

function figuraDelItem(item) {
  return item.figuraId || item.estimulo?.figuraId || item.bloqueAlternativas?.figuraId || null;
}

async function enLotes(etiqueta, filas, tam, fn) {
  let n = 0;
  for (let i = 0; i < filas.length; i += tam) {
    const lote = filas.slice(i, i + tam);
    await fn(lote);
    n += lote.length;
  }
  if (n) console.log(`  ${etiqueta}: ${n}`);
}

async function main() {
  console.log('Cargando datos de origen…');
  cargarTodo();

  const fragmentos = Object.values(globalThis.BANCO_FRAGMENTOS || {}).flat();
  const curriculo = globalThis.CURRICULO || {};
  const textos = globalThis.TEXTOS || {};
  const ensayos = globalThis.ENSAYOS || {};
  const figuras = globalThis.FIGURAS;

  if (!fragmentos.length || !figuras) throw new Error('No se pudo leer el origen');

  // Solo ítems de banco (se excluye la muestra MUE-*).
  const items = fragmentos.filter((i) => i?.id && !i.id.startsWith('MUE-'));
  console.log(`Ítems en origen: ${items.length}`);

  // ---------------------------------------------------------------- niveles y asignaturas
  const niveles = {};
  for (const codigo of Object.keys(NOMBRES)) {
    niveles[codigo] = await prisma.nivel.upsert({
      where: { codigo },
      create: { codigo, nombre: NOMBRES[codigo][0], orden: NOMBRES[codigo][1] },
      update: {},
    });
  }

  const asignaturas = {};
  for (const clave of ['matematica', 'lectura']) {
    const nombre = clave === 'matematica' ? 'Matemática' : 'Lectura';
    asignaturas[clave] = await prisma.asignatura.upsert({
      where: { codigo: clave },
      create: { codigo: clave, nombre },
      update: {},
    });
  }

  // ---------------------------------------------------------------- ejes y objetivos
  const ejes = {};
  const objetivos = {};
  let nEjes = 0;
  let nObjetivos = 0;
  let nIndicadores = 0;

  for (const [claveBanco, cat] of Object.entries(curriculo)) {
    const [curso, asignatura] = claveBanco.split('-');
    const nivel = niveles[curso];
    if (!nivel || !asignaturas[asignatura]) continue;

    for (const eje of cat.ejes || []) {
      const claveEje = `${claveBanco}|${eje.clave}`;
      ejes[claveEje] = await prisma.eje.upsert({
        where: { nivelId_asignaturaId_clave: { nivelId: nivel.id, asignaturaId: asignaturas[asignatura].id, clave: eje.clave } },
        create: { nivelId: nivel.id, asignaturaId: asignaturas[asignatura].id, clave: eje.clave, nombre: eje.nombre },
        update: { nombre: eje.nombre },
      });
      nEjes += 1;

      for (const oa of eje.oas || []) {
        const claveOA = `${claveBanco}|${oa.codigo}`;
        objetivos[claveOA] = await prisma.objetivo.upsert({
          where: { ejeId_codigo: { ejeId: ejes[claveEje].id, codigo: oa.codigo } },
          create: {
            ejeId: ejes[claveEje].id,
            codigo: oa.codigo,
            texto: oa.texto,
            usaEnEnsayos: oa.usaEnEnsayos !== false,
          },
          update: { texto: oa.texto, usaEnEnsayos: oa.usaEnEnsayos !== false },
        });
        nObjetivos += 1;

        const indicadores = oa.indicadores || [];
        if (indicadores.length) {
          const existentes = await prisma.indicador.count({ where: { objetivoId: objetivos[claveOA].id } });
          if (!existentes) {
            await prisma.indicador.createMany({
              data: indicadores.map((texto) => ({ objetivoId: objetivos[claveOA].id, texto })),
            });
            nIndicadores += indicadores.length;
          }
        }
      }
    }
  }
  console.log(`Ejes: ${nEjes} | objetivos: ${nObjetivos} | indicadores nuevos: ${nIndicadores}`);

  // ---------------------------------------------------------------- figuras y textos nuevos
  const figurasExistentes = new Set((await prisma.figura.findMany({ select: { codigo: true } })).map((f) => f.codigo));
  const textosExistentes = new Set((await prisma.textoLectura.findMany({ select: { codigo: true } })).map((t) => t.codigo));

  const figurasNuevas = [];
  const figuraId = {};
  let figurasFallidas = 0;
  for (const item of items) {
    const codigo = figuraDelItem(item);
    if (!codigo || figuraId[codigo] || figurasExistentes.has(codigo)) continue;
    try {
      const fig = figuras.obtener(codigo);
      const id = uuid();
      figuraId[codigo] = id;
      figurasNuevas.push({ id, codigo, primitivas: fig, ancho: fig.ancho, alto: fig.alto });
    } catch (e) {
      figurasFallidas += 1;
      if (figurasFallidas <= 5) console.warn(`  figura no construida: ${codigo} (${e.message})`);
    }
  }

  const textosNuevos = [];
  const textoId = {};
  for (const item of items) {
    const banco = bancoDe(item);
    const codigo = item.textoId;
    if (!codigo || textoId[codigo] || textosExistentes.has(codigo)) continue;
    const t = textos[banco]?.[codigo];
    if (!t) continue;
    const id = uuid();
    textoId[codigo] = id;
    textosNuevos.push({
      id,
      codigo,
      titulo: t.titulo ?? '(sin título)',
      tipo: t.tipo ?? 'informativo',
      cuerpo: t.cuerpo ?? '',
      fuente: t.fuente ?? null,
      palabras: t.cuerpo ? String(t.cuerpo).split(/\s+/).filter(Boolean).length : null,
    });
  }

  await enLotes('figuras nuevas', figurasNuevas, 200, (lote) => prisma.figura.createMany({ data: lote }));
  await enLotes('textos nuevos', textosNuevos, 200, (lote) => prisma.textoLectura.createMany({ data: lote }));

  // Mapas de figuras/textos ya existentes en la base.
  for (const f of await prisma.figura.findMany({ select: { id: true, codigo: true } })) figuraId[f.codigo] = figuraId[f.codigo] ?? f.id;
  for (const t of await prisma.textoLectura.findMany({ select: { id: true, codigo: true } })) textoId[t.codigo] = textoId[t.codigo] ?? t.id;

  // ---------------------------------------------------------------- ítems
  const itemsExistentes = new Set((await prisma.item.findMany({ select: { codigo: true } })).map((i) => i.codigo));
  const nuevos = items.filter((i) => !itemsExistentes.has(i.id));

  const filasItem = [];
  const filasVersion = [];
  const filasAlternativa = [];
  let sinTexto = 0;

  for (const item of items) {
    if (itemsExistentes.has(item.id)) continue;

    const banco = bancoDe(item);
    const [curso, asignatura] = banco.split('-');
    const nivel = niveles[curso];
    const asig = asignaturas[asignatura];
    const eje = ejes[`${banco}|${item.eje}`] ?? Object.values(ejes).find((e) => e.clave === item.eje && e.nivelId === nivel.id);
    if (!nivel || !asig || !eje) continue;

    const oa = objetivos[`${banco}|${item.oa}`] ?? null;
    const figCodigo = figuraDelItem(item);
    const itemId = uuid();
    const versionId = uuid();
    const alternativas = item.alternativas || [];
    const textoAlternativas = alternativas.map((a) => a.texto ?? '').join('|');

    filasItem.push({
      id: itemId,
      codigo: item.id,
      nivelId: nivel.id,
      asignaturaId: asig.id,
      ejeId: eje.id,
      objetivoId: oa?.id ?? null,
      habilidad: item.habilidad,
      bloom: item.bloom,
      conocimiento: item.conocimiento ?? 'conceptual',
      dificultad: item.dificultad ?? 'media',
      estado: 'APROBADO',
      figuraId: figCodigo ? figuraId[figCodigo] ?? null : null,
      textoId: item.textoId ? textoId[item.textoId] ?? null : null,
    });

    filasVersion.push({
      id: versionId,
      itemId,
      version: 1,
      enunciado: item.enunciado,
      clave: item.clave,
      justificacion: item.justificacionClave ?? '',
      hashContenido: sha256(item.enunciado + textoAlternativas),
    });

    for (const a of alternativas) {
      filasAlternativa.push({
        id: uuid(),
        itemVersionId: versionId,
        letra: a.letra,
        texto: a.texto ?? null,
        esClave: a.letra === item.clave,
        justificacionError: a.error ?? 'Error no declarado.',
      });
    }

    if (!item.textoId) sinTexto += 1;
  }

  await enLotes('ítems nuevos', filasItem, 500, (lote) => prisma.item.createMany({ data: lote }));
  await enLotes('versiones nuevas', filasVersion, 500, (lote) => prisma.itemVersion.createMany({ data: lote }));
  await enLotes('alternativas nuevas', filasAlternativa, 800, (lote) => prisma.alternativa.createMany({ data: lote }));

  // ---------------------------------------------------------------- ensayos
  const versionPorCodigo = new Map();
  for (const v of await prisma.itemVersion.findMany({ select: { id: true, item: { select: { codigo: true } } } })) {
    versionPorCodigo.set(v.item.codigo, v.id);
  }

  const ensayosExistentes = new Set(
    (await prisma.ensayo.findMany({ select: { titulo: true, nivelId: true, asignaturaId: true } })).map(
      (e) => `${e.nivelId}|${e.asignaturaId}|${e.titulo}`
    )
  );

  let nEnsayos = 0;
  let nEnsayoItems = 0;

  for (const e of Object.values(ensayos)) {
    if (!e.items?.length) continue;
    if (e.id.includes('MUESTRA')) continue; // depende de ítems MUE-* que no se importan

    const [curso, asignatura] = `${e.curso}-${e.asignatura}`.split('-');
    const nivel = niveles[curso];
    const asig = asignaturas[asignatura];
    if (!nivel || !asig) continue;

    const clave = `${nivel.id}|${asig.id}|${e.titulo}`;
    if (ensayosExistentes.has(clave)) continue;

    const tiempoMin = parseInt(String(e.tiempo ?? '90').replace(/\D+/g, ''), 10) || 90;
    const ensayoId = uuid();
    await prisma.ensayo.create({
      data: {
        id: ensayoId,
        colegioId: null, // plantilla de plataforma, no de un colegio
        nivelId: nivel.id,
        asignaturaId: asig.id,
        titulo: e.titulo,
        tiempoMin,
        estado: 'PUBLICADO',
        origen: 'IMPORTADO',
      },
    });
    nEnsayos += 1;

    const filas = [];
    let orden = 0;
    for (const codigo of e.items) {
      const vId = versionPorCodigo.get(codigo);
      if (!vId) continue;
      orden += 1;
      filas.push({ id: uuid(), ensayoId, orden, itemVersionId: vId });
    }
    if (filas.length) {
      await prisma.ensayoItem.createMany({ data: filas });
      nEnsayoItems += filas.length;
    }
  }

  // ---------------------------------------------------------------- informe
  const [nItems, nVersiones, nAlternativas, nTextos, nFiguras, nE] = await Promise.all([
    prisma.item.count(),
    prisma.itemVersion.count(),
    prisma.alternativa.count(),
    prisma.textoLectura.count(),
    prisma.figura.count(),
    prisma.ensayo.count(),
  ]);

  console.log('\nImportación terminada');
  console.log(`  ítems nuevos:        ${nuevos.length}`);
  console.log(`  ítems en la base:    ${nItems}`);
  console.log(`  versiones:           ${nVersiones}`);
  console.log(`  alternativas:        ${nAlternativas}`);
  console.log(`  textos:              ${nTextos}`);
  console.log(`  figuras:             ${nFiguras}${figurasFallidas ? ` (${figurasFallidas} no construidas)` : ''}`);
  console.log(`  ensayos nuevos:      ${nEnsayos} (total ${nE})`);
  console.log(`  renglones de ensayo: ${nEnsayoItems}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
