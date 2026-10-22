// Consolida únicamente el lote visual aprobado en archivos locales.
// No importa Prisma, no accede a red y no aplica relaciones nuevas.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';

if (!process.argv.includes('--registrar-aprobacion-lote-visual')) {
  throw new Error('Este script requiere una aprobación visual previa del lote.');
}
const archivo = path.resolve(process.argv[2] ?? '');
const base = path.dirname(archivo);
const revision = path.join(base, 'revision');
const shaTexto = v => crypto.createHash('sha256').update(v).digest('hex');
const shaObjeto = v => shaTexto(JSON.stringify(v));
const contenido = fs.readFileSync(archivo, 'utf8');
const snapshotSHA256 = shaTexto(contenido);
assert.equal(snapshotSHA256, fs.readFileSync(path.join(base, 'snapshot.sha256'), 'utf8').trim());
const original = JSON.parse(contenido);
const copia = structuredClone(original);
const indice = JSON.parse(fs.readFileSync(path.join(revision, 'propuestas', 'indice.json'), 'utf8'));
assert.equal(indice.length, 12, 'El lote presentado tenía 12 propuestas.');
assert.equal(new Set(indice.map(p => p.figuraId)).size, indice.length);
const cambios = [];
for (const resumen of indice) {
  const p = JSON.parse(fs.readFileSync(path.join(revision, 'propuestas', resumen.codigo + '.json'), 'utf8'));
  assert.equal(p.snapshotSHA256, snapshotSHA256);
  assert.equal(p.despuesSHA256, resumen.despuesSHA256);
  const anterior = original.figuras.find(f => f.id === p.figuraId);
  const fila = copia.figuras.find(f => f.id === p.figuraId);
  assert.ok(anterior && fila);
  assert.equal(shaObjeto(anterior.primitivas), p.antesSHA256);
  for (const op of p.jsonPatch) {
    assert.match(op.path, /^\/(id$|primitivas(?:\/|$)|ancho$|alto$)/);
    if (op.path === '/id') assert.equal(op.op, 'test');
    const partes = op.path.slice(1).split('/');
    let padre = fila;
    for (const k of partes.slice(0, -1)) padre = padre[k];
    const k = partes.at(-1);
    if (op.op === 'test') assert.deepEqual(padre[k], op.value);
    else {
      assert.equal(op.op, 'replace');
      padre[k] = structuredClone(op.value);
    }
  }
  assert.equal(shaObjeto(fila.primitivas), p.despuesSHA256);
  assert.equal(fila.ancho, p.dimensionesDespues.ancho);
  assert.equal(fila.alto, p.dimensionesDespues.alto);
  for (const k of Object.keys(anterior).filter(k => !['primitivas', 'ancho', 'alto'].includes(k))) {
    assert.deepEqual(fila[k], anterior[k]);
  }
  cambios.push({
    figuraId: fila.id, codigo: fila.codigo,
    antesSHA256: p.antesSHA256, despuesSHA256: p.despuesSHA256,
    pngAprobadoSHA256: shaTexto(fs.readFileSync(path.join(revision, 'propuestas', fila.codigo + '-despues.png'))),
    jsonPatch: p.jsonPatch,
  });
}
assert.deepEqual(copia.items, original.items, 'No deben cambiar ítems, versiones, claves, alternativas ni textos.');
assert.deepEqual(copia.conteos, original.conteos);
assert.equal(copia.figuras.length, original.figuras.length);
assert.equal(copia.figuras.filter(f => !f.items.length).length, 16);
const idsCambiados = new Set(cambios.map(c => c.figuraId));
for (const f of original.figuras.filter(f => !idsCambiados.has(f.id))) {
  assert.deepEqual(copia.figuras.find(c => c.id === f.id), f);
}
const aprobacion = {
  fechaConfirmacion: '2026-10-21', estado: 'APROBADO_VISUALMENTE_LOTE_01',
  mensajeUsuario: 'Las figuras se ven bien',
  contexto: 'Confirmación posterior a la entrega de las 12 muestras A4 y la vista de escala.',
  alcance: 'Diseño y tamaño del lote de 12 propuestas presentado. No aprueba todo el banco, enlaces de figuras huérfanas ni aplicación en PostgreSQL.',
  snapshotSHA256,
  pdfRevisadoSHA256: shaTexto(fs.readFileSync(path.join(revision, 'escala', 'muestras-a4.pdf'))),
  figuras: cambios.map(({ jsonPatch, ...c }) => c),
  aplicadoEnBaseOriginal: false,
};
const aprobacionPath = path.join(revision, 'aprobacion-visual-lote-01.json');
const copiaPath = path.join(base, 'copia-trabajo-4b-lote-01.json');
const informePath = path.join(revision, 'consolidacion-lote-01.json');
for (const f of [aprobacionPath, copiaPath, informePath]) {
  if (fs.existsSync(f)) throw new Error('Ya existe un resultado del lote; se conserva: ' + f);
}
copia.trabajoLocal = {
  estado: 'LOTE_01_VISUAL_APROBADO', snapshotSHA256,
  figurasCorregidas: cambios.map(c => c.codigo),
  nuevosEnlaces: 0, ramaPostgreSQL: false, aplicadoEnBaseOriginal: false,
};
const copiaContenido = JSON.stringify(copia, null, 2);
const informe = {
  snapshotIntegro: true, snapshotSHA256, copiaSHA256: shaTexto(copiaContenido),
  figurasCorregidas: cambios.length, figurasTotalesCopia: copia.figuras.length,
  itemsTotalesCopia: copia.items.length, itemsVersionesAlternativasTextosSinCambios: true,
  figurasHuerfanas: 16, nuevosEnlaces: 0, cambios,
  tipoDeCopia: 'Archivo JSON local; no rama PostgreSQL',
  conexionBase: false, aplicadoEnBaseOriginal: false,
};
fs.writeFileSync(aprobacionPath, JSON.stringify(aprobacion, null, 2), { flag: 'wx' });
fs.writeFileSync(copiaPath, copiaContenido, { flag: 'wx' });
fs.writeFileSync(informePath, JSON.stringify(informe, null, 2), { flag: 'wx' });
assert.equal(shaTexto(fs.readFileSync(archivo)), snapshotSHA256);
const reabierta = JSON.parse(fs.readFileSync(copiaPath, 'utf8'));
assert.deepEqual(reabierta.items, original.items);
assert.equal(shaTexto(fs.readFileSync(copiaPath)), informe.copiaSHA256);
console.log(JSON.stringify({ aprobacion: aprobacionPath, copia: copiaPath,
  figurasCorregidas: cambios.length, snapshotIntegro: true,
  nuevosEnlaces: 0, aplicadoEnBaseOriginal: false }, null, 2));
