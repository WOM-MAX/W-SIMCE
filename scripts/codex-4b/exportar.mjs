// Exportación acotada al banco de 4B. La transacción rechaza escrituras.
// No exporta estudiantes, usuarios, respuestas ni credenciales.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { PrismaClient } from '@prisma/client';

const root = process.cwd();
const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');
const esperado = {
  figuras: 415, huerfanas: 16, items: 1926, versiones: 1926,
  alternativas: 7704, conFigura: 439, soloTexto: 884, sinRecursos: 603,
  mencionanFigura: 97, mencionanFiguraSinFigura: 4,
};
const p = new PrismaClient({ errorFormat: 'minimal' });
try {
  const data = await p.$transaction(async (tx) => {
    await tx.$executeRaw`SET TRANSACTION READ ONLY`;
    const conteos = {
      figuras: await tx.figura.count(),
      huerfanas: await tx.figura.count({ where: { items: { none: {} } } }),
      items: await tx.item.count(),
      versiones: await tx.itemVersion.count(),
      alternativas: await tx.alternativa.count(),
      conFigura: await tx.item.count({ where: { figuraId: { not: null } } }),
      soloTexto: await tx.item.count({ where: { figuraId: null, textoId: { not: null } } }),
      sinRecursos: await tx.item.count({ where: { figuraId: null, textoId: null } }),
    };
    const versiones = await tx.itemVersion.findMany({
      select: { enunciado: true, item: { select: { figuraId: true } } },
    });
    const patron = /seg[uú]n la figura|en la figura|la figura muestra|observa la figura/i;
    const mencionan = versiones.filter(v => patron.test(v.enunciado ?? ''));
    conteos.mencionanFigura = mencionan.length;
    conteos.mencionanFiguraSinFigura = mencionan.filter(v => !v.item.figuraId).length;
    const diferencias = Object.entries(esperado).filter(([k, v]) => conteos[k] !== v);
    if (diferencias.length) throw new Error('CONTEOS DIFERENTES: ' + JSON.stringify({ conteos, diferencias }));
    const items = await tx.item.findMany({
      where: { nivel: { codigo: '4B' } }, orderBy: { codigo: 'asc' },
      include: {
        nivel: true, asignatura: true, eje: true, objetivo: true, texto: true,
        versiones: {
          orderBy: { version: 'desc' },
          include: {
            alternativas: { orderBy: { letra: 'asc' } },
            _count: { select: { ensayoItems: true, intentoItems: true } },
          },
        },
      },
    });
    const figuras = await tx.figura.findMany({
      where: { OR: [{ items: { some: { nivel: { codigo: '4B' } } } }, { items: { none: {} } }] },
      orderBy: { codigo: 'asc' },
      include: { items: { select: { id: true, codigo: true, figuraId: true } } },
    });
    return { conteos, items, figuras };
  }, { isolationLevel: 'RepeatableRead', maxWait: 15000, timeout: 60000 });
  const fuentes = Object.fromEntries([
    'components/figura.tsx', 'lib/texto.ts', 'prisma/schema.prisma',
    'scripts/render-figuras.mjs', 'scripts/dibujo.mjs',
  ].map(f => [f, sha(fs.readFileSync(path.join(root, f)))]));
  const fecha = new Date().toISOString();
  const destino = path.join(root, 'tmp-figuras', 'codex-4b', fecha.replace(/[:.]/g, '-'));
  fs.mkdirSync(destino, { recursive: true });
  const exportacion = {
    formato: 1, fecha, alcance: 'Banco 4B; instantánea local, no rama PostgreSQL',
    soloLectura: true, aislamiento: 'RepeatableRead + SET TRANSACTION READ ONLY',
    fuentes, ...data,
  };
  const contenido = JSON.stringify(exportacion, null, 2);
  const archivo = path.join(destino, 'snapshot.json');
  fs.writeFileSync(archivo, contenido, { encoding: 'utf8', flag: 'wx' });
  fs.writeFileSync(path.join(destino, 'snapshot.sha256'), sha(contenido) + '\n', { flag: 'wx' });
  console.log(JSON.stringify({ archivo, sha256: sha(contenido), conteos: data.conteos,
    items4B: data.items.length, figuras: data.figuras.length }, null, 2));
} catch (e) {
  // No imprimir cadenas de conexión ni trazas que puedan contenerlas.
  console.error(e.code ? `Error Prisma ${e.code}` : String(e.message).split('\n').slice(-3).join('\n'));
  process.exitCode = 1;
} finally { await p.$disconnect(); }
