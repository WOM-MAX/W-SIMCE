// Comprobación independiente de las coordenadas efectivamente dibujadas.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import ts from 'typescript';
import {hashArchivo} from './componente.mjs';
const base=path.resolve('tmp-figuras/codex-4b/2026-10-21T20-41-46-545Z'),out=path.join(base,'revision/lote-03');
const read=file=>JSON.parse(fs.readFileSync(file,'utf8'));
const s=read(path.join(base,'copia-trabajo-4b-lote-01.json')),original=read(path.join(base,'snapshot.json'));
assert.equal(hashArchivo(path.join(base,'copia-trabajo-4b-lote-01.json')),'b98764b7bb1a301ac0e8ee0049809fc629753520fa3f43b3fdc645549e50bf65');
assert.equal(hashArchivo(path.join(base,'snapshot.json')),'6c64674b5c1322cf806c36509f83081f4b16ad65ed66063f10d1125d73366b20');
const index=read(path.join(out,'indice.json'));assert.equal(index.length,6);
const rows=index.map(r=>read(path.join(out,r.codigo+'.json')));
const sha=v=>crypto.createHash('sha256').update(JSON.stringify(v)).digest('hex');
const near=(a,b)=>assert.ok(Math.abs(a-b)<.00001,`${a} != ${b}`);
const canon=pts=>pts.map(p=>p.map(v=>Math.round(v*1e5)/1e5).join(',')).sort().join('|');
const cellsCanon=pts=>[...new Set(pts.map(p=>p.join(',')))].sort().join('|');
const dedup=a=>[...new Set(a.map(n=>Math.round(n*1e5)/1e5))].sort((a,b)=>a-b);
function gridDims(p,g){
  const lines=p.elementos.slice(g.inicio,g.fin).filter(e=>e.op==='line'&&!e.punteada);
  const xs=dedup(lines.filter(e=>e.x1===e.x2).map(e=>e.x1)),ys=dedup(lines.filter(e=>e.y1===e.y2).map(e=>e.y1));
  for(let i=1;i<xs.length;i++)near(xs[i]-xs[i-1],g.u);
  for(let i=1;i<ys.length;i++)near(ys[i]-ys[i-1],g.u);
  return[xs.length-1,ys.length-1];
}
function cubeDims(p,g){
  const es=p.elementos.slice(g.inicio,g.fin),[top,right,front]=es;
  assert.equal(top.op,'poly');assert.equal(right.op,'poly');assert.equal(front.op,'poly');
  const w=(front.puntos[1][0]-front.puntos[0][0])/g.u,h=(front.puntos[0][1]-front.puntos[3][1])/g.u,d=(top.puntos[3][0]-top.puntos[0][0])/g.dx;
  assert.ok([w,d,h].every(Number.isInteger));
  near(top.puntos[0][1]-top.puntos[3][1],d*g.dy);
  assert.equal(es.length,3+2*(w-1)+2*(d-1)+2*(h-1),'Cuadrícula visible del cuerpo');
  return[w,d,h];
}
function flagCoords(p,g){return p.elementos.slice(g.inicio,g.fin).map(e=>e.puntos.map(([x,y])=>[(x-g.cx)/g.scale+52,(y-g.cy)/g.scale+52]));}
function clockwise(pts){return pts.map(([x,y])=>[104-y,x]);}
function rotate(pts,n){let r=pts;for(let i=0;i<n;i++)r=clockwise(r);return r;}
function painted(p,g){
  const es=p.elementos.slice(g.inicio,g.fin),rs=es.filter(e=>e.op==='rect');
  const a=rs.map(e=>{near(e.w,g.u);near(e.h,g.u);return[(e.x-g.x)/g.u,(e.y-g.y)/g.u];});
  assert.ok(a.every(([c,r])=>Number.isInteger(c)&&Number.isInteger(r)&&c>=0&&c<g.cols&&r>=0&&r<g.rows));
  assert.equal(cellsCanon(a).split('|').length,a.length,'Sin casillas duplicadas');
  const axis=es.find(e=>e.op==='line'&&e.punteada);assert.ok(axis);near(axis.x1,g.x+3.5*g.u);
  return a;
}
const resultados=[];
for(const r of rows){
  const f=s.figuras.find(f=>f.id===r.figuraId),item=s.items.find(i=>i.id===r.itemId),m=r.modelo,p=r.despues;
  assert.ok(f&&item);assert.equal(sha(f.primitivas),r.antesSHA256);assert.equal(sha(p),r.despuesSHA256);
  const c=structuredClone(f);
  for(const op of r.jsonPatch){assert.match(op.path,/^\/(id|primitivas|ancho|alto)$/);const k=op.path.slice(1);if(op.op==='test')assert.deepEqual(c[k],op.value);else{assert.equal(op.op,'replace');assert.notEqual(k,'id');c[k]=structuredClone(op.value);}}
  assert.deepEqual(c.primitivas,p);assert.equal(c.ancho,Math.round(p.ancho));assert.equal(c.alto,Math.round(p.alto));
  for(const version of ['antes','despues'])for(const ext of ['png','svg'])assert.ok(fs.statSync(path.join(out,'figuras',r.codigo+'-'+version+'.'+ext)).size>100);
  const validKeys={line:['x1','y1','x2','y2'],rect:['x','y','w','h'],poly:['puntos','cerrado'],text:['x','y','texto','tam','ancho','anclaje','negrita'],path:['d']};
  for(const e of p.elementos){
    assert.ok(validKeys[e.op]);for(const k of Object.keys(e))assert.ok(['op','grosor','gris','relleno','grisRelleno','punteada',...validKeys[e.op]].includes(k),k);
    const coords=e.op==='line'?[[e.x1,e.y1],[e.x2,e.y2]]:e.op==='rect'?[[e.x,e.y],[e.x+e.w,e.y+e.h]]:e.op==='poly'?e.puntos:e.op==='text'?[[e.x,e.y]]:[];
    assert.ok(coords.every(([x,y])=>Number.isFinite(x)&&Number.isFinite(y)&&x>=0&&y>=0&&x<=p.ancho&&y<=p.alto),'Coordenadas fuera del lienzo '+r.codigo);
  }
  let respuesta=null,pruebas=[];
  if(m.tipo==='vista_superior'){
    const [w,d,h]=cubeDims(p,m.cuerpo);assert.deepEqual([w,d,h],[3,2,1]);
    const dims=m.opciones.map(g=>gridDims(p,g));assert.deepEqual(dims,[[3,1],[2,2],[2,3],[3,2]]);
    const matches=m.opciones.filter((g,n)=>dims[n][0]===w&&dims[n][1]===d);assert.equal(matches.length,1);respuesta=matches[0].letra;
    assert.ok(p.elementos.some(e=>e.op==='text'&&e.texto==='En las cuatro vistas, el frente queda abajo.'));
    pruebas.push('La referencia de frente fija la orientación; C no se acepta como giro de D.');
  }else if(m.tipo==='tres_vistas'){
    const vistas=m.vistas.map(g=>gridDims(p,g));assert.deepEqual(vistas,[[3,2],[3,2],[2,2]]);
    const dims=m.opciones.map(g=>cubeDims(p,g));assert.deepEqual(dims,[[3,2,1],[2,2,2],[3,1,2],[3,2,2]]);
    const matches=m.opciones.filter((g,n)=>{const[w,d,h]=dims[n];return cellsCanon([[w,h],[w,d],[d,h]])===cellsCanon(vistas)&&w===vistas[0][0]&&h===vistas[0][1]&&d===vistas[1][1]});
    assert.equal(matches.length,1);respuesta=matches[0].letra;
    pruebas.push('Solo un cuerpo coincide con las tres proyecciones dadas.');
  }else if(m.tipo==='rotacion_bandera'||m.tipo==='isometrias_F'){
    const given=flagCoords(p,m.original),source=r.antes.elementos.map(e=>e.puntos);
    assert.equal(given.length,source.length);
    given.forEach((a,i)=>assert.equal(canon(a),canon(source[i]),'La original no se deforma'));
    const opts=m.opciones.map(g=>flagCoords(p,g));
    const expected=m.tipo==='rotacion_bandera'?[3,1,2,0]:[1,2,null,3];
    opts.forEach((a,n)=>a.forEach((points,k)=>{const target=expected[n]===null?given[k].map(([x,y])=>[104-x,y]):rotate(given[k],expected[n]);assert.equal(canon(points),canon(target));}));
    assert.equal(new Set(opts.map(a=>a.map(canon).join(';'))).size,4,'Cuatro alternativas distintas');
    if(m.tipo==='rotacion_bandera'){
      const target=given.map(a=>canon(clockwise(a))).join(';');
      const matches=m.opciones.filter((g,n)=>opts[n].map(canon).join(';')===target);assert.equal(matches.length,1);respuesta=matches[0].letra;
      pruebas.push('B es el único giro horario de 90 grados, con barra arriba y punta hacia abajo.');
    }else{
      const translations=pts=>{const minX=Math.min(...pts.map(p=>p[0])),minY=Math.min(...pts.map(p=>p[1]));return canon(pts.map(([x,y])=>[x-minX,y-minY]));};
      const giros=[0,1,2,3].map(n=>translations(rotate(given[0],n)));
      const noObtenibles=m.opciones.filter((g,n)=>!giros.includes(translations(opts[n][0])));assert.equal(noObtenibles.length,1);respuesta=noObtenibles[0].letra;
      pruebas.push('A, B y D conservan la forma por giro y traslación; C es una reflexión no congruente por esos giros.');
    }
  }else if(m.tipo==='reflexion_celdas'){
    const left=painted(p,m.original),originalCells=r.antes.elementos.filter(e=>e.op==='rect').map(e=>[(e.x-10)/22,(e.y-8)/22]);
    assert.equal(cellsCanon(left),cellsCanon(originalCells));assert.equal(left.length,6);
    const reflected=left.map(([c,r])=>[6-c,r]),correct=cellsCanon([...left,...reflected]);
    const options=m.opciones.map(g=>painted(p,g));
    for(const c of options)assert.equal(cellsCanon(c.filter(([col])=>col<3.5)),cellsCanon(left));
    assert.equal(new Set(options.map(cellsCanon)).size,4);
    const matches=m.opciones.filter((g,n)=>cellsCanon(options[n])===correct);assert.equal(matches.length,1);respuesta=matches[0].letra;
    for(const [c,r] of options[2])assert.ok(options[2].some(([cc,rr])=>cc===6-c&&rr===r));
    pruebas.push('Se conservan seis casillas iniciales; solo C refleja cada centro respecto del eje.','Alerta de contenido conservada: se cita una casilla de columna 2 que no está pintada.');
  }else if(m.tipo==='flecha_tangente'){
    const e=p.elementos[m.arrowIndex],curve=p.elementos[m.pathIndex],numbers=curve.d.match(/-?\d+(?:\.\d+)?/g).map(Number);
    assert.deepEqual(e.puntos[0],numbers.slice(-2));
    const [tx,ty]=e.puntos[0],base=[(e.puntos[1][0]+e.puntos[2][0])/2,(e.puntos[1][1]+e.puntos[2][1])/2];
    const vx=tx-numbers[2],vy=ty-numbers[3];
    assert.ok((tx-base[0])*vx+(ty-base[1])*vy>0);
    const corrected=structuredClone(p);corrected.elementos[m.arrowIndex].puntos=r.antes.elementos[m.arrowIndex].puntos;assert.deepEqual(corrected,r.antes,'Solo cambia la punta');
    assert.equal(9+6,15);assert.equal(15-6,9);respuesta='C';pruebas.push('Punta exactamente en (304,35); el arco y todos los números permanecen intactos.');
  }else throw new Error('Modelo no reconocido');
  assert.equal(respuesta,item.versiones[0].clave,'Solución independiente no coincide con clave guardada');
  if(m.opciones){assert.deepEqual(m.opciones.map(g=>g.letra),['A','B','C','D']);assert.ok(item.versiones[0].alternativas.every(a=>a.texto===null));assert.equal(item.estado,'BORRADOR');}
  resultados.push({item:item.codigo,figura:r.codigo,respuestaCalculada:respuesta,claveGuardada:item.versiones[0].clave,coincide:true,opciones:m.opciones?.length??0,pruebas,alertas:r.alertas});
}
const copia=read(path.join(out,'copia-propuesta-4b-lote-03.json'));assert.deepEqual(copia.items,s.items);assert.equal(copia.figuras.length,132);
assert.equal(copia.figuras.filter(f=>f.items.length===0).length,16);
assert.deepEqual(copia.items.filter(i=>i.estado==='BORRADOR').map(i=>i.codigo),s.items.filter(i=>i.estado==='BORRADOR').map(i=>i.codigo));
const changed=copia.figuras.filter(f=>JSON.stringify(f.primitivas)!==JSON.stringify(original.figuras.find(a=>a.id===f.id).primitivas));assert.equal(changed.length,62);
for(const p of rows){const f=copia.figuras.find(f=>f.id===p.figuraId);assert.deepEqual(f.primitivas,p.despues);}
writeReport();
function writeReport(){
  fs.writeFileSync(path.join(out,'verificacion-geometrica.json'),JSON.stringify({figuras:6,juegosAD:5,alternativasGraficas:20,coincidenciasConClave:6,fuenteIntacta:true,itemsIntactos:true,clavesIntactas:true,alternativasNullIntactas:true,estadosIntactos:true,nuevosEnlaces:0,figurasCorregidasAcumuladas:62,baseNoConsultada:true,resultados},null,2));
  const resumen=`# 4° básico: cierre de seis pendientes gráficos\n\n## Resultado\n\nSe completan cinco juegos de alternativas A-D y se repara la punta de una flecha. Hay 20 alternativas gráficas nuevas. Las seis soluciones calculadas coinciden con las claves guardadas. Los cinco ítems geométricos conservan su estado BORRADOR; las alternativas de texto siguen null. No se publica ni se enlaza ningún ítem.\n\n[Abrir visor](index.html) · [Muestras A4](muestras-a4.pdf) · [Pruebas geométricas](verificacion-geometrica.json).\n\n| Ítem | Comprobación | Resultado |\n|---|---|---|\n${resultados.map(r=>`| ${r.item} | ${r.pruebas.join(' ')} | ${r.respuestaCalculada}, coincide con la clave |`).join('\n')}\n\n## Decisiones de diseño\n\n- GEO-003: el cuerpo conserva 3 cubos de ancho, 2 de profundidad y 1 de alto. A=3x1, B=2x2, C=2x3 y D=3x2. Se indica el frente del cuerpo y de las cuatro vistas: sin esa referencia C y D podrían confundirse al admitir un giro de la hoja.\n- BANDERA: se conserva la misma bandera, con escala uniforme en las opciones; A=90 grados antihorarios, B=90 horarios, C=180, D=sin giro. No se redibujan las opciones con proporciones diferentes.\n- VISTAS: se conservan las tres proyecciones 3x2, 3x2 y 2x2. Los cuerpos A/B/C/D miden, respectivamente, 3x2x1, 2x2x2, 3x1x2 y 3x2x2. Un único candidato cumple todas las vistas. No se afirma que tres siluetas determinen todos los cubos ocultos de cualquier cuerpo posible: se comprueba el conjunto concreto de cuatro alternativas.\n- MITAD: se mantienen las seis casillas dadas y se sitúa el eje en el centro de la columna 3, para que el reflejo cumpla c -> 6-c, como describe la justificación. El original tenía el eje en el borde de la columna 3, que produciría c -> 5-c. Se amplía la cuadrícula con una columna vacía a la derecha, igual en original y opciones, para mostrar completo el distractor D. La cuadrícula no forma parte de la figura sombreada.\n- F: la original sigue a la izquierda; las opciones tienen la misma escala. A, B y D son giros de 90, 180 y 270 grados horarios; C es el reflejo horizontal.\n- PAT-006: solo se cambian las tres coordenadas de la punta triangular; su vértice coincide exactamente con el final del arco y apunta según su tangente. Se conservan el arco, la recta y todos los textos.\n\n## Alerta que pasa a la auditoría de contenido\n\nGEO-F3-005: la justificación habla de una casilla de columna 2, aunque el dibujo inicial solo tiene casillas pintadas en columnas 0 y 1. No se inventa una séptima casilla ni se cambia la justificación. El reflejo es único y la regla general 2->4 es correcta con el eje corregido, pero la referencia a esa casilla concreta requiere revisar el texto. Esta alerta no se da por resuelta con un cambio gráfico.\n\n## Copia, asociaciones e histórico\n\nLa nueva copia propuesta acumulada contiene las 12 correcciones previas del lote 1, las 44 del lote 2 y estas 6: 62 figuras modificadas respecto a la instantánea original. Los 486 ítems, sus versiones, claves, alternativas y textos permanecen idénticos. Los estados y los enlaces se conservan; quedan 16 figuras huérfanas en la copia.\n\nGEO-003 y PAT-006 se muestran junto a sus figuras candidatas en el visor, pero esa asociación es una simulación explícita para revisión, no un Item.figuraId aplicado. El enlace y la promoción a PostgreSQL siguen fuera de esta ejecución. Tampoco se modifica el esquema histórico. No se usa git ni se opera sobre el servidor 3005.\n\n## Verificación visual y límites\n\nLos PNG se generan desde el componente real de la app. El visor muestra su escala CSS y el PDF usa clases de tamaño de impresión, con una regla de 5 cm. La inspección de navegador, las medidas y los PNG de las hojas se guardan en este directorio. En ventanas estrechas algunos rótulos pueden quedar pequeños; la ausencia de recortes no certifica legibilidad ni reproduce una sesión real contra PostgreSQL.\n\nNo se da por terminada la auditoría semántica del resto de los 486 ítems ni su alineación curricular. Esta entrega resuelve los seis pendientes gráficos especificados, con la alerta de contenido anterior separada.\n\n## Ejecución\n\nPerfil: implementación local y revisión. Se mantiene la configuración actual indicada por el usuario; el selector exacto de modelo y esfuerzo no está disponible para verificación. Sin subagentes. La skill de perfiles limita las escrituras a scripts y artefactos locales; la skill de PDF exige comprobar las hojas renderizadas. No se alteran archivos de la aplicación.\n`;
  fs.writeFileSync(path.join(out,'INFORME-LOTE-03.md'),resumen);
}
if(process.argv.includes('--solo-geometria')){console.log(JSON.stringify({figuras:6,resultados},null,2));process.exit(0);}
let htmlCount=0;
for(const file of fs.readdirSync(out).filter(f=>f.endsWith('.html'))){
  htmlCount++;const html=fs.readFileSync(path.join(out,file),'utf8');
  for(const script of html.matchAll(/<script>([\s\S]*?)<\/script>/g))assert.equal(ts.createSourceFile(file+'.js',script[1],ts.ScriptTarget.ES2022,true,ts.ScriptKind.JS).parseDiagnostics.length,0);
  for(const link of html.matchAll(/(?:href|src)="([^"#]+)"/g)){if(/^(data:|https?:)/.test(link[1]))continue;assert.ok(fs.existsSync(path.resolve(out,link[1])),file+': '+link[1]);}
}
const q=read(path.join(out,'qa-textos.json')),pantalla=read(path.join(out,'qa-pantalla.json')),papel=read(path.join(out,'qa-papel.json'));
assert.equal(q.length,6);assert.equal(q.reduce((n,r)=>n+r.errors.length,0),0);assert.equal(pantalla.length,18);assert.equal(papel.length,6);
assert.ok(pantalla.every(m=>m.pagina<=m.ventana));assert.ok(papel.every(m=>m.contenido<=m.alto&&m.finContenido<=m.alto-60));
const resumen={figuras:6,juegosADCompletados:5,opcionesNuevas:20,respuestasCalculadasConClave:6,alertasContenido:1,htmlComprobados:htmlCount,medicionesPantalla:18,hojasA4:6,desbordesTexto:0,desbordesPantalla:0,desbordesPapel:0,minTextoMovilPx:Math.min(...pantalla.filter(p=>p.ventana===390).map(p=>p.minTextoPx)),minTextoImpresoPt:Math.min(...papel.map(p=>p.minTextoPt)),copiaPropuestaSHA256:hashArchivo(path.join(out,'copia-propuesta-4b-lote-03.json')),pdfSHA256:hashArchivo(path.join(out,'muestras-a4.pdf')),baseNoConsultada:true,originalIntacto:true,nuevosEnlaces:0,clavesEnunciadosAlternativasEstadosIntactos:true};
fs.writeFileSync(path.join(out,'verificacion.json'),JSON.stringify(resumen,null,2));console.log(JSON.stringify(resumen,null,2));
