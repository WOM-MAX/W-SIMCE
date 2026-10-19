// Seed de la rebanada vertical: 4° básico Matemática, 30 ítems reales,
// 20 estudiantes y una asignación lista para rendir.
// Fuente: el banco del proyecto de ensayos (ENSAYOS SIMCE APP).
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ORIGEN =
  process.env.ORIGEN_BANCO ||
  'C:/Users/DELL/OneDrive - CORPORACIÓN EDUCACIONAL EDUARDO AGUILAR/COLEGIO ACRÓPOLIS 2026/ENSAYOS SIMCE APP';

const ENSAYO_ORIGEN = 'ENSAYO-4B-MAT-01';

function cargar(relativo) {
  const codigo = fs.readFileSync(path.join(ORIGEN, relativo), 'utf8');
  new Function(codigo)();
}

function cargarBanco() {
  const dir = path.join(ORIGEN, 'app/datos/banco/fragmentos');
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.js'))) cargar(path.join('app/datos/banco/fragmentos', f));
  cargar('app/datos/banco/4B-matematica.js');
}

function cargarCurriculo() {
  cargar('app/datos/curriculo/4B-matematica.js');
}

function cargarEnsayos() {
  cargar('app/datos/ensayos/ENSAYOS.js');
}

function hashPin(pin) {
  const sal = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(pin, sal, 64).toString('hex');
  return `scrypt$${sal}$${hash}`;
}

function sha256(texto) {
  return crypto.createHash('sha256').update(texto).digest('hex');
}

const NOMBRES = [
  ['Martina', 'González Rojas'], ['Benjamín', 'Soto Muñoz'], ['Antonia', 'Pérez Díaz'],
  ['Vicente', 'Rojas Silva'], ['Josefa', 'Muñoz Castro'], ['Matías', 'Silva Torres'],
  ['Florencia', 'Díaz Vergara'], ['Tomás', 'Castro Fuentes'], ['Amanda', 'Torres Araya'],
  ['Agustín', 'Vergara Pinto'], ['Isidora', 'Fuentes Riquelme'], ['Lucas', 'Araya Cáceres'],
  ['Emilia', 'Pinto Salazar'], ['Gaspar', 'Riquelme Vera'], ['Trinidad', 'Cáceres Lagos'],
  ['Felipe', 'Salazar Núñez'], ['Catalina', 'Vera Espinoza'], ['Joaquín', 'Lagos Herrera'],
  ['Constanza', 'Núñez Bravo'], ['Diego', 'Espinoza Molina'],
];

const TABLAS = [
  'Evento', 'ResultadoDimension', 'ResultadoIntento', 'Respuesta', 'IntentoItem', 'Intento',
  'Asignacion', 'EnsayoItem', 'Ensayo', 'Indicador', 'Objetivo', 'ItemVersion', 'Alternativa',
  'Item', 'Figura', 'TextoLectura', 'Matricula', 'Estudiante', 'Curso', 'Membresia', 'Usuario',
  'AnioEscolar', 'Colegio', 'Eje', 'Nivel', 'Asignatura',
];

async function limpiar() {
  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE ${TABLAS.map((t) => `"${t}"`).join(', ')} RESTART IDENTITY CASCADE`
  );
}

async function main() {
  cargarBanco();
  cargarCurriculo();
  cargarEnsayos();

  const banco = Object.values(globalThis.BANCO_FRAGMENTOS || {}).flat();
  const curriculo = globalThis.CURRICULO?.['4B-matematica'];
  const ensayoOrigen = globalThis.ENSAYOS?.[ENSAYO_ORIGEN];

  if (!banco.length || !ensayoOrigen) throw new Error('No se pudo leer el banco de origen');

  const textoOA = new Map();
  for (const eje of curriculo?.ejes ?? []) {
    for (const oa of eje.oas ?? []) textoOA.set(oa.codigo, oa.texto);
  }

  const items = ensayoOrigen.items.map((id) => {
    const it = banco.find((b) => b.id === id);
    if (!it) throw new Error(`Ítem ${id} no está en el banco`);
    return it;
  });

  await limpiar();

  const colegio = await prisma.colegio.create({
    data: { nombre: 'Colegio Acrópolis', rbd: '12345-6', comuna: 'Puente Alto' },
  });

  const anio = await prisma.anioEscolar.create({
    data: { colegioId: colegio.id, anio: 2026 },
  });

  const nivel = await prisma.nivel.create({
    data: { codigo: '4B', nombre: '4° básico', orden: 4 },
  });

  const asignatura = await prisma.asignatura.create({
    data: { codigo: 'matematica', nombre: 'Matemática' },
  });

  // Docente de prueba solo para la rebanada.
  const docente = await prisma.usuario.create({
    data: {
      email: 'docente@acropolis.cl',
      hashPassword: hashPin('demo1234'),
      nombre: 'Profesora 4°B',
    },
  });
  await prisma.membresia.create({
    data: { usuarioId: docente.id, colegioId: colegio.id, rol: 'DOCENTE' },
  });

  const curso = await prisma.curso.create({
    data: {
      colegioId: colegio.id,
      anioId: anio.id,
      nivelId: nivel.id,
      letra: 'B',
      nombre: '4° básico B',
    },
  });

  // Ejes y objetivos que usan los 30 ítems.
  const clavesEje = [...new Set(items.map((i) => i.eje))];
  const nombreEje = {
    'numeros-y-operaciones': 'Números y operaciones',
    'patrones-y-algebra': 'Patrones y álgebra',
    'geometria': 'Geometría',
    'medicion': 'Medición',
    'datos-y-probabilidades': 'Datos y probabilidades',
  };
  const ejes = {};
  for (const clave of clavesEje) {
    ejes[clave] = await prisma.eje.create({
      data: {
        nivelId: nivel.id,
        asignaturaId: asignatura.id,
        clave,
        nombre: nombreEje[clave] ?? clave,
      },
    });
  }

  const objetivos = {};
  for (const clave of [...new Set(items.map((i) => i.oa))]) {
    const eje = ejes[items.find((i) => i.oa === clave).eje];
    objetivos[clave] = await prisma.objetivo.create({
      data: {
        ejeId: eje.id,
        codigo: clave,
        texto: textoOA.get(clave) ?? `Objetivo ${clave} del programa de 4° básico.`,
      },
    });
  }

  // Ensayo y sus ítems.
  const ensayo = await prisma.ensayo.create({
    data: {
      colegioId: colegio.id,
      nivelId: nivel.id,
      asignaturaId: asignatura.id,
      titulo: 'Ensayo 1 de Matemática',
      tiempoMin: 90,
      estado: 'PUBLICADO',
      origen: 'IMPORTADO',
    },
  });

  const versiones = [];
  let orden = 0;
  for (const it of items) {
    const creado = await prisma.item.create({
      data: {
        codigo: it.id,
        nivelId: nivel.id,
        asignaturaId: asignatura.id,
        ejeId: ejes[it.eje].id,
        objetivoId: objetivos[it.oa]?.id,
        habilidad: it.habilidad,
        bloom: it.bloom,
        conocimiento: it.conocimiento ?? 'conceptual',
        dificultad: it.dificultad ?? 'media',
        estado: 'APROBADO',
        versiones: {
          create: {
            version: 1,
            enunciado: it.enunciado,
            clave: it.clave,
            justificacion: it.justificacionClave,
            hashContenido: sha256(it.enunciado + JSON.stringify(it.alternativas)),
            alternativas: {
              create: it.alternativas.map((a) => ({
                letra: a.letra,
                texto: a.texto,
                esClave: a.letra === it.clave,
                justificacionError: a.error ?? 'Error no declarado.',
              })),
            },
          },
        },
      },
      include: { versiones: true },
    });
    versiones.push(creado.versiones[0]);
    orden += 1;
    await prisma.ensayoItem.create({
      data: { ensayoId: ensayo.id, orden, itemVersionId: creado.versiones[0].id },
    });
  }

  // Asignación vigente para el curso.
  const ahora = new Date();
  const cierre = new Date(ahora.getTime() + 60 * 24 * 60 * 60 * 1000);
  const asignacion = await prisma.asignacion.create({
    data: {
      ensayoId: ensayo.id,
      cursoId: curso.id,
      docenteId: docente.id,
      abreEn: ahora,
      cierraEn: cierre,
      intentosPermitidos: 1,
    },
  });

  // Estudiantes con código + PIN.
  for (let i = 0; i < NOMBRES.length; i += 1) {
    const [nombres, apellidos] = NOMBRES[i];
    const codigoAcceso = `W4B-${String(i + 1).padStart(2, '0')}`;
    const estudiante = await prisma.estudiante.create({
      data: {
        colegioId: colegio.id,
        nombres,
        apellidos,
        codigoAcceso,
        pinHash: hashPin('1234'),
      },
    });
    await prisma.matricula.create({
      data: { estudianteId: estudiante.id, cursoId: curso.id },
    });
  }

  console.log('Seed listo');
  console.log(`  colegio:      ${colegio.nombre}`);
  console.log(`  curso:        ${curso.nombre}`);
  console.log(`  ítems:        ${items.length}`);
  console.log(`  versiones:    ${versiones.length}`);
  console.log(`  estudiantes:  ${NOMBRES.length} (códigos W4B-01 … W4B-20, PIN 1234)`);
  console.log(`  docente:      docente@acropolis.cl / demo1234`);
  console.log(`  asignación:   ${asignacion.id}`);
  console.log(`  ensayo:       ${ensayo.titulo} (${ensayo.tiempoMin} min)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
