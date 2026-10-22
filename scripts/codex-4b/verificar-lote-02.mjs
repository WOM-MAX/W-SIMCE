import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import ts from 'typescript';
import { hashArchivo, pngDeSvg } from './componente.mjs';

const base=path.resolve('tmp-figuras/codex-4b/2026-10-21T20-41-46-545Z');
const out=path.join(base,'revision/lote-02');
const sha=v=>crypto.createHash('sha256').update(JSON.stringify(v)).digest('hex');
const leer=file=>JSON.parse(fs.readFileSync(file,'utf8'));
const original=leer(path.join(base,'snapshot.json')),copia=leer(path.join(base,'copia-trabajo-4b-lote-01.json'));
assert.equal(hashArchivo(path.join(base,'snapshot.json')),'6c64674b5c1322cf806c36509f83081f4b16ad65ed66063f10d1125d73366b20');
assert.equal(hashArchivo(path.join(base,'copia-trabajo-4b-lote-01.json')),'b98764b7bb1a301ac0e8ee0049809fc629753520fa3f43b3fdc645549e50bf65');
assert.deepEqual(original.items,copia.items,'No cambiar ítems, versiones, alternativas o textos');
assert.equal(copia.items.length,486);assert.equal(copia.figuras.length,132);
const indice=leer(path.join(out,'indice.json'));assert.equal(indice.length,44);
assert.equal(new Set(indice.map(r=>r.figuraId)).size,44);
const tipos={};let reemplazos=0,archivos=0;
const permitidas={rect:['x','y','w','h'],line:['x1','y1','x2','y2'],text:['x','y','texto','tam','ancho','anclaje','negrita'],poly:['puntos','cerrado'],circle:['cx','cy','r'],path:['d']};
const comunes=['op','grosor','punteada','relleno','grisRelleno','gris'];
for(const entry of indice){
  const r=leer(path.join(out,entry.codigo+'.json')),f=copia.figuras.find(f=>f.id===r.figuraId);
  assert.ok(f);assert.ok(!copia.trabajoLocal.figurasCorregidas.includes(r.codigo));
  const nueva=structuredClone(f);
  for(const op of r.jsonPatch){
    assert.match(op.path,/^\/(id|primitivas|ancho|alto)$/);
    const k=op.path.slice(1);
    if(op.op==='test')assert.deepEqual(nueva[k],op.value);
    else{assert.equal(op.op,'replace');assert.notEqual(k,'id');nueva[k]=structuredClone(op.value);reemplazos++;}
  }
  assert.deepEqual(nueva.primitivas,r.despues);assert.equal(sha(f.primitivas),r.antesSHA256);assert.equal(sha(nueva.primitivas),r.despuesSHA256);
  assert.equal(nueva.ancho,Math.round(nueva.primitivas.ancho));assert.equal(nueva.alto,Math.round(nueva.primitivas.alto));
  assert.deepEqual(f.primitivas.elementos.filter(e=>e.op==='text').map(e=>e.texto),nueva.primitivas.elementos.filter(e=>e.op==='text').map(e=>e.texto));
  for(const e of nueva.primitivas.elementos){
    assert.ok(permitidas[e.op],e.op);
    for(const k of Object.keys(e))assert.ok([...comunes,...permitidas[e.op]].includes(k),r.codigo+': atributo no admitido '+k);
    for(const [k,v] of Object.entries(e))if(typeof v==='number')assert.ok(Number.isFinite(v),k);
    if(e.op==='poly')assert.ok(Array.isArray(e.puntos)&&e.puntos.every(p=>Array.isArray(p)&&p.length===2&&p.every(Number.isFinite)));
  }
  if(r.familia==='tabla'){
    const antes=f.primitivas.elementos.filter(e=>e.op==='rect'),despues=nueva.primitivas.elementos.filter(e=>e.op==='rect');
    assert.equal(antes.length,despues.length);
  }
  if(r.familia==='barras')assert.deepEqual(f.primitivas.elementos.filter(e=>e.op==='rect').map(e=>[e.w,e.h,e.relleno,e.grisRelleno]),nueva.primitivas.elementos.filter(e=>e.op==='rect').map(e=>[e.w,e.h,e.relleno,e.grisRelleno]));
  if(r.familia==='plano'){
    const geometria=nueva.primitivas.elementos.filter(e=>e.op!=='text');
    if(r.codigo==='FIG-4B-MAT-GEO-F3-002-FUENTE'){
      const banda={op:'line',x1:115.5,y1:99,x2:174.5,y2:99,grosor:31,gris:.55};
      const index=geometria.findIndex(e=>JSON.stringify(e)===JSON.stringify(banda));assert.ok(index>=0,'Falta el sombreado oscuro de B2');
      geometria.splice(index,1);
    }
    assert.deepEqual(f.primitivas.elementos.filter(e=>e.op!=='text'),geometria);
  }
  if(r.familia==='pictograma')for(const [row,n] of [6,4,3,6].entries())assert.equal(nueva.primitivas.elementos.filter(e=>e.op==='poly'&&e.puntos[0][1]===38+28*row).length,n);
  if(r.codigo==='FIG-N4B-MAT-09')for(const [a,b,n] of [[20,42,4],[105,149,7],[200,266,10]])assert.equal(nueva.primitivas.elementos.filter(e=>e.op==='line'&&e.x1>=a&&e.x2<=b).length,n);
  for(const version of ['antes','despues'])for(const ext of ['png','svg']){assert.ok(fs.statSync(path.join(out,'figuras',r.codigo+'-'+version+'.'+ext)).size>100);archivos++;}
  tipos[r.familia]=(tipos[r.familia]??0)+1;
}
const erroresHTML=[];let htmlCount=0;
if(fs.existsSync(path.join(out,'aprobacion-visual-parcial.json'))){
  const a=leer(path.join(out,'aprobacion-visual-parcial.json'));assert.equal(a.figuras.length,43);
  for(const f of a.figuras){
    const p=leer(path.join(out,f.codigo+'.json'));
    assert.equal(p.despuesSHA256,f.despuesSHA256,'Cambió la figura aprobada '+f.codigo);
    assert.equal(hashArchivo(path.join(out,'figuras',f.codigo+'-despues.png')),f.pngSHA256,'Cambió el PNG aprobado '+f.codigo);
    assert.equal(p.estado,'APROBADO_VISUALMENTE_NO_APLICADO_EN_BASE');
  }
  const viejo=leer(path.join(out,'antes-ajuste-fuente',a.excluida.codigo+'.json'));
  const nuevo=leer(path.join(out,a.excluida.codigo+'.json'));
  const sinBanda=structuredClone(nuevo.despues);
  const i=sinBanda.elementos.findIndex(e=>e.op==='line'&&e.x1===115.5&&e.y1===99&&e.grosor===31&&e.gris===.55);
  assert.ok(i>=0);sinBanda.elementos.splice(i,1);
  assert.deepEqual(sinBanda,viejo.despues,'Solo se debe añadir sombreado, sin modificar letras ni posiciones');
}
for(const file of fs.readdirSync(out).filter(f=>f.endsWith('.html'))){
  const html=fs.readFileSync(path.join(out,file),'utf8');htmlCount++;
  for(const m of html.matchAll(/<script>([\s\S]*?)<\/script>/g)){
    const source=ts.createSourceFile(file+'.js',m[1],ts.ScriptTarget.ES2022,true,ts.ScriptKind.JS);
    assert.equal(source.parseDiagnostics.length,0,'Script HTML inválido '+file);
  }
  for(const m of html.matchAll(/(?:href|src)="([^"#]+)"/g)){
    if(/^(https?:|data:)/.test(m[1]))continue;
    if(!fs.existsSync(path.resolve(out,m[1])))erroresHTML.push({file,link:m[1]});
  }
}
assert.deepEqual(erroresHTML,[]);
const textos=leer(path.join(out,'qa-textos.json')),pantalla=leer(path.join(out,'qa-pantalla.json')),papel=leer(path.join(out,'qa-papel.json'));
assert.equal(textos.length,44);assert.equal(pantalla.length,132);assert.equal(papel.length,44);
assert.equal(textos.reduce((n,r)=>n+r.errors.length,0),0);
assert.equal(pantalla.filter(r=>r.pagina>r.ventana).length,0);
assert.equal(papel.filter(r=>r.contenido>r.alto||r.finContenido>r.alto-60).length,0);
const afectados=copia.items.filter(i=>indice.some(r=>r.figuraId===i.figuraId));
const resumen={estado:'PROPUESTAS_VERIFICADAS_PENDIENTES_APROBACION',propuestas:44,porTipo:tipos,itemsConUsoAfectado:afectados.length,matematica:indice.filter(r=>!r.codigo.includes('-LEC-')).length,lectura:indice.filter(r=>r.codigo.includes('-LEC-')).length,reemplazosProbados:reemplazos,rendersComprobados:archivos,htmlComprobados:htmlCount,medicionesPantalla:132,desbordesTexto:0,desbordesPantalla:0,desbordesPapel:0,minTextoMovilPx:Math.min(...pantalla.filter(p=>p.ventana===390).map(p=>p.minTextoPx)),minTextoImpresoPt:Math.min(...papel.map(p=>p.minTextoPt)),copiaAprobadaIntacta:true,snapshotOriginalIntacto:true,itemsVersionesAlternativasTextosIntactos:true,nuevosEnlaces:0,conexionBase:false,aplicadoEnOriginal:false,fuentes:leer(path.join(out,'fuentes.json')),pdfSHA256:hashArchivo(path.join(out,'muestras-a4.pdf'))};
fs.writeFileSync(path.join(out,'verificacion.json'),JSON.stringify(resumen,null,2));
if(process.argv.includes('--contactos-pdf')){
  const qa=path.join(out,'qa-pdf'),files=fs.readdirSync(qa).filter(f=>/^pagina-\d+\.png$/.test(f)).sort();assert.equal(files.length,44);
  for(let start=0;start<files.length;start+=8){
    const chunk=files.slice(start,start+8),height=Math.ceil(chunk.length/4)*560,width=1600;
    const cells=chunk.map((f,n)=>`<image x="${(n%4)*400}" y="${Math.floor(n/4)*560}" width="400" height="550" href="data:image/png;base64,${fs.readFileSync(path.join(qa,f)).toString('base64')}"/>`).join('');
    fs.writeFileSync(path.join(qa,'contacto-'+(start/8+1)+'.png'),pngDeSvg(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="100%" height="100%" fill="white"/>${cells}</svg>`,width));
  }
}
console.log(JSON.stringify(resumen,null,2));
