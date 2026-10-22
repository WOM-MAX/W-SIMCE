// Verificación offline de integridad y de los diffs. No importa Prisma.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import ts from 'typescript';
import { hashArchivo } from './componente.mjs';
const archivo=path.resolve(process.argv[2]??'');
const base=path.dirname(archivo),out=path.join(base,'revision');
const s=JSON.parse(fs.readFileSync(archivo,'utf8'));
assert.equal(hashArchivo(archivo),fs.readFileSync(path.join(base,'snapshot.sha256'),'utf8').trim());
const indice=JSON.parse(fs.readFileSync(path.join(out,'propuestas','indice.json'),'utf8'));
const sha=v=>crypto.createHash('sha256').update(JSON.stringify(v)).digest('hex');
let cambios=0;
for(const r of indice){
  const p=JSON.parse(fs.readFileSync(path.join(out,'propuestas',r.codigo+'.json'),'utf8'));
  const original=s.figuras.find(f=>f.id===p.figuraId);
  assert.ok(original);
  assert.equal(sha(original.primitivas),p.antesSHA256);
  const copia=structuredClone(original);
  for(const op of p.jsonPatch){
    assert.match(op.path,/^\/(id$|primitivas(?:\/|$)|ancho$|alto$)/);
    const partes=op.path.slice(1).split('/');let padre=copia;
    for(const k of partes.slice(0,-1))padre=padre[k];
    const k=partes.at(-1);
    if(op.op==='test')assert.deepEqual(padre[k],op.value);
    else {assert.equal(op.op,'replace');padre[k]=structuredClone(op.value);cambios++;}
  }
  assert.deepEqual(copia.primitivas,p.despues);
  assert.equal(sha(copia.primitivas),p.despuesSHA256);
  assert.deepEqual({ancho:copia.ancho,alto:copia.alto},p.dimensionesDespues);
  assert.equal(copia.ancho,Math.round(copia.primitivas.ancho));
  assert.equal(copia.alto,Math.round(copia.primitivas.alto));
  for(const sufijo of ['antes.png','despues.png','comparacion.png'])assert.ok(fs.statSync(path.join(out,'propuestas',r.codigo+'-'+sufijo)).size>100);
}
for(const f of s.figuras)for(const ext of ['png','svg'])assert.ok(fs.statSync(path.join(out,'figuras',f.codigo+'.'+ext)).size>100);
const html=fs.readFileSync(path.join(out,'index.html'),'utf8');
assert.equal((html.match(/<article /g)??[]).length,s.items.length);
let scripts=0;
for(const nombre of ['index.html','propuestas.html']){
 const contenido=fs.readFileSync(path.join(out,nombre),'utf8');
 for(const m of contenido.matchAll(/<script>([\s\S]*?)<\/script>/g)){
   const source=ts.createSourceFile(nombre+'.js',m[1],ts.ScriptTarget.ES2022,true,ts.ScriptKind.JS);
   assert.equal(source.parseDiagnostics.length,0);scripts++;
 }
 for(const m of contenido.matchAll(/(?:src|href)="([^"#]+)"/g)){
   if(/^(https?:|data:)/.test(m[1]))continue;
   assert.ok(fs.existsSync(path.resolve(out,m[1])),`Enlace roto ${nombre}: ${m[1]}`);
 }
}
assert.equal((fs.readFileSync(path.join(out,'propuestas.html'),'utf8').match(/<article /g)??[]).length,indice.length);
const resumen={snapshotIntegro:true,figuras:s.figuras.length,items:s.items.length,propuestas:indice.length,reemplazosLocalesProbados:cambios,scriptsHTML:scripts,conexionBase:false,aplicadoEnOriginal:false};
fs.writeFileSync(path.join(out,'verificacion.json'),JSON.stringify(resumen,null,2));
console.log(JSON.stringify(resumen,null,2));
