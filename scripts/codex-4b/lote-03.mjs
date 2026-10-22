// Completa cinco juegos A-D y repara una flecha. Solo archivos locales.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {renderizar,markupReal,svgReal,pngDeSvg,hashArchivo,partirConPotencia} from './componente.mjs';
const base=path.resolve('tmp-figuras/codex-4b/2026-10-21T20-41-46-545Z');
const entrada=path.join(base,'copia-trabajo-4b-lote-01.json'),s=JSON.parse(fs.readFileSync(entrada,'utf8'));
assert.equal(hashArchivo(entrada),'b98764b7bb1a301ac0e8ee0049809fc629753520fa3f43b3fdc645549e50bf65');
const out=path.join(base,'revision/lote-03'),renders=path.join(out,'figuras');fs.mkdirSync(renders,{recursive:true});
const regen=process.argv.includes('--regenerar-local');
const write=(name,v)=>fs.writeFileSync(path.join(out,name),v,{flag:regen?'w':'wx'});
const sha=v=>crypto.createHash('sha256').update(JSON.stringify(v)).digest('hex');
const esc=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const texto=v=>partirConPotencia(String(v??'')).map(t=>t.supra?`<sup>${esc(t.texto)}</sup>`:esc(t.texto)).join('');
const propuestas=[];
const txt=(x,y,texto,tam=12,extra={})=>({op:'text',x,y,texto,tam,anclaje:'medio',...extra});
const ln=(x1,y1,x2,y2,extra={})=>({op:'line',x1,y1,x2,y2,grosor:.8,...extra});
const poly=(puntos,extra={})=>({op:'poly',puntos,cerrado:true,grosor:1,relleno:'gris',grisRelleno:.85,...extra});
const round=n=>Math.round(n*1e6)/1e6;
function grid(el,x,y,cols,rows,u=18,cells=[],axis=null){
  const start=el.length;
  for(const [c,r] of cells)el.push({op:'rect',x:x+c*u,y:y+r*u,w:u,h:u,grosor:.5,relleno:'gris',grisRelleno:1});
  for(let c=0;c<=cols;c++)el.push(ln(x+c*u,y,x+c*u,y+rows*u,{gris:c===0||c===cols?0:.55,grosor:c===0||c===cols?.9:.5}));
  for(let r=0;r<=rows;r++)el.push(ln(x,y+r*u,x+cols*u,y+r*u,{gris:r===0||r===rows?0:.55,grosor:r===0||r===rows?.9:.5}));
  if(axis!==null)el.push(ln(x+axis*u,y,x+axis*u,y+rows*u,{punteada:true,grosor:1.4}));
  return{inicio:start,fin:el.length,x,y,cols,rows,u,cells,axis};
}
function cuboide(el,cx,bottom,w,d,h,u=19,dx=9,dy=7){
  const start=el.length,x=cx-(w*u+d*dx)/2;
  const q=(a,b,c)=>[round(x+a*u+b*dx),round(bottom-c*u-b*dy)];
  // Caras visibles, sin aristas ocultas que se confundan con cubitos adicionales.
  el.push(poly([q(0,0,h),q(w,0,h),q(w,d,h),q(0,d,h)],{grisRelleno:.35}));
  el.push(poly([q(w,0,0),q(w,d,0),q(w,d,h),q(w,0,h)],{grisRelleno:.75}));
  el.push(poly([q(0,0,0),q(w,0,0),q(w,0,h),q(0,0,h)],{grisRelleno:0}));
  const segment=(a,b)=>el.push(ln(...a,...b,{gris:.25,grosor:.65}));
  for(let a=1;a<w;a++){segment(q(a,0,0),q(a,0,h));segment(q(a,0,h),q(a,d,h));}
  for(let b=1;b<d;b++){segment(q(0,b,h),q(w,b,h));segment(q(w,b,0),q(w,b,h));}
  for(let c=1;c<h;c++){segment(q(0,0,c),q(w,0,c));segment(q(w,0,c),q(w,d,c));}
  return{inicio:start,fin:el.length,cx,bottom,w,d,h,u,dx,dy};
}
function rot([x,y],n){for(let i=0;i<n;i++)[x,y]=[104-y,x];return[round(x),round(y)];}
function transformar(el,source,cx,cy,turn=0,mirror=false,scale=.8){
  const start=el.length;
  for(const e of source){
    assert.equal(e.op,'poly');
    const puntos=e.puntos.map(pt=>{let p=rot(pt,turn);if(mirror)p=[104-p[0],p[1]];return[round(cx+(p[0]-52)*scale),round(cy+(p[1]-52)*scale)];});
    el.push({...structuredClone(e),puntos});
  }
  return{inicio:start,fin:el.length,cx,cy,turn,mirror,scale};
}
function agregar(itemCode,figCode,motivo,build){
  const item=s.items.find(i=>i.codigo===itemCode),f=s.figuras.find(f=>f.codigo===figCode);assert.ok(item&&f);
  const antes=structuredClone(f.primitivas),result=build(antes,item),p=result.p;
  const patch=[{op:'test',path:'/id',value:f.id}];
  for(const [k,a,b] of [['primitivas',f.primitivas,p],['ancho',f.ancho,Math.round(p.ancho)],['alto',f.alto,Math.round(p.alto)]])if(JSON.stringify(a)!==JSON.stringify(b))patch.push({op:'test',path:'/'+k,value:a},{op:'replace',path:'/'+k,value:b});
  const r={codigo:figCode,figuraId:f.id,itemCandidato:item.codigo,itemId:item.id,estado:'PROPUESTA_LOCAL_NO_PUBLICADA',motivo,
    estadoItem:item.estado,claveGuardada:item.versiones[0].clave,copiaEntradaSHA256:hashArchivo(entrada),
    antesSHA256:sha(antes),despuesSHA256:sha(p),dimensionesAntes:{ancho:f.ancho,alto:f.alto},dimensionesDespues:{ancho:Math.round(p.ancho),alto:Math.round(p.alto)},
    usosActuales:f.items.map(i=>i.codigo),requiereEnlace:!item.figuraId,limitesTexto:[],jsonPatch:patch,modelo:result.modelo,alertas:result.alertas??[],antes,despues:p};
  for(const [tipo,data] of [['antes',antes],['despues',p]]){
    const dest=path.join(renders,figCode+'-'+tipo);
    if(regen&&fs.existsSync(dest+'.svg')&&fs.readFileSync(dest+'.svg','utf8')===svgReal(data))continue;
    renderizar(data,dest,{reemplazar:regen});
  }
  write(figCode+'.json',JSON.stringify(r,null,2));propuestas.push(r);console.log(figCode);
}

agregar('4B-MAT-GEO-003','FIG-4B-MAT-GEO-003-CUERPO','Añadir las cuatro vistas descritas en los distractores y fijar el frente para distinguir una vista de su giro.',()=>{
  const el=[],body=cuboide(el,210,96,3,2,1,24,12,9);
  el.push(txt(210,18,'Cuerpo original',12,{negrita:true}));
  el.push(ln(210,117,210,100),poly([[210,100],[206.5,106],[213.5,106]],{grisRelleno:1}),txt(210,132,'Frente',11));
  const options=[];
  for(const [n,[w,d]] of [[3,1],[2,2],[2,3],[3,2]].entries()){
    const cx=52.5+105*n;el.push(txt(cx,161,'ABCD'[n],13,{negrita:true}));
    const g=grid(el,cx-w*10,174,w,d,20);options.push({letra:'ABCD'[n],...g});
    el.push(txt(cx,250,'Frente',10.5));
  }
  el.push(txt(210,274,'En las cuatro vistas, el frente queda abajo.',11));
  return{p:{ancho:420,alto:286,elementos:el},modelo:{tipo:'vista_superior',cuerpo:body,opciones:options,orientacionFijada:true}};
});
agregar('4B-MAT-GEO-F2-007','FIG-4B-MAT-GEO-F2-007-BANDERA','Completar A-D con giros antihorario, horario, de media vuelta y sin giro, conservando las proporciones de la bandera.',antes=>{
  const el=[],source=antes.elementos,original=transformar(el,source,65,125,0,false,.85);el.push(txt(65,40,'Original',12,{negrita:true}));
  const options=[];
  for(const [n,t] of [3,1,2,0].entries()){
    const cx=n%2?345:205,cy=n<2?65:185;
    options.push({letra:'ABCD'[n],...transformar(el,source,cx,cy,t)});el.push(txt(cx,cy+48,'ABCD'[n],13,{negrita:true}));
  }
  el.push(ln(130,20,130,235,{gris:.7,grosor:.6}));
  return{p:{ancho:420,alto:248,elementos:el},modelo:{tipo:'rotacion_bandera',original,opciones:options}};
});
agregar('4B-MAT-GEO-F3-003','FIG-4B-MAT-GEO-F3-003-VISTAS','Conservar las tres proyecciones y añadir cuatro cuerpos con las dimensiones descritas en las justificaciones.',()=>{
  const el=[],views=[];
  for(const [n,[name,cols,rows]] of [['Vista desde el frente',3,2],['Vista desde arriba',3,2],['Vista desde el lado',2,2]].entries()){
    const cx=70+140*n;el.push(txt(cx,18,name,10.5,{negrita:true,ancho:130}));views.push({nombre:name,...grid(el,cx-cols*9,32,cols,rows,18)});
  }
  el.push(ln(12,86,408,86,{gris:.7,grosor:.6}));
  const options=[];
  for(const [n,[w,d,h]] of [[3,2,1],[2,2,2],[3,1,2],[3,2,2]].entries()){
    const cx=52.5+105*n;el.push(txt(cx,111,'ABCD'[n],13,{negrita:true}));options.push({letra:'ABCD'[n],...cuboide(el,cx,192,w,d,h,19,9,7)});
  }
  return{p:{ancho:420,alto:208,elementos:el},modelo:{tipo:'tres_vistas',vistas:views,opciones:options}};
});
agregar('4B-MAT-GEO-F3-005','FIG-4B-MAT-GEO-F3-005-MITAD','Conservar las seis casillas, corregir el eje según la correspondencia de columnas descrita y completar cuatro alternativas con un único reflejo correcto.',antes=>{
  const cells=antes.elementos.filter(e=>e.op==='rect').map(e=>[(e.x-10)/22,(e.y-8)/22]);
  assert.equal(cells.length,6);const el=[];
  el.push(txt(65,59,'Original',12,{negrita:true}));const original=grid(el,13,77,8,5,13,cells,3.5);
  const options=[];
  for(let n=0;n<4;n++){
    const right=cells.map(([c,r])=>n===0?[c+4,r]:n===1?[6-c,4-r]:n===2?[6-c,r]:[7-c,r]);
    const x=n%2?300:162,y=n<2?27:146;
    options.push({letra:'ABCD'[n],...grid(el,x,y,8,5,12,[...cells,...right],3.5)});el.push(txt(x+48,y+76,'ABCD'[n],13,{negrita:true}));
  }
  el.push(ln(133,16,133,232,{gris:.7,grosor:.6}));
  return{p:{ancho:414,alto:238,elementos:el},modelo:{tipo:'reflexion_celdas',original,opciones:options,mapeoColumnas:'c -> 6 - c',cambioEje:'De borde de columna 3 a centro de columna 3; se añade una columna vacía al extremo derecho para mostrar el desplazamiento del distractor D sin recortes.'},
    alertas:['La justificación menciona una casilla en columna 2 que no está pintada en el original. Se conserva la figura dada y la justificación: el mapeo 2->4 es correcto como regla general, pero esa referencia concreta debe revisarse en la auditoría de contenido.']};
});
agregar('4B-MAT-GEO-F3-007','FIG-4B-MAT-GEO-F3-007-ORIGINAL','Situar la original a la izquierda y añadir tres giros y una reflexión, sin deformar la F.',antes=>{
  const el=[],source=antes.elementos,original=transformar(el,source,65,125,0,false,.85);el.push(txt(65,40,'Original',12,{negrita:true}));
  const options=[];
  for(const [n,[t,mirror]] of [[1,false],[2,false],[0,true],[3,false]].entries()){
    const cx=n%2?345:205,cy=n<2?65:185;options.push({letra:'ABCD'[n],...transformar(el,source,cx,cy,t,mirror)});el.push(txt(cx,cy+48,'ABCD'[n],13,{negrita:true}));
  }
  el.push(ln(130,20,130,235,{gris:.7,grosor:.6}));
  return{p:{ancho:420,alto:248,elementos:el},modelo:{tipo:'isometrias_F',original,opciones:options}};
});
agregar('4B-MAT-PAT-006','FIG-4B-MAT-PAT-006-RECTA','Unir la punta de flecha con el extremo del arco y orientarla según su tangente, manteniendo 9 + 6 = 15.',antes=>{
  const p=structuredClone(antes),pathIndex=p.elementos.findIndex(e=>e.op==='path'),arrowIndex=p.elementos.findIndex((e,i)=>i>pathIndex&&e.op==='poly');
  assert.ok(pathIndex>=0&&arrowIndex>=0);
  const end=[304,35],control=[246.4,28],dx=end[0]-control[0],dy=end[1]-control[1],norm=Math.hypot(dx,dy),ux=dx/norm,uy=dy/norm;
  const pts=[end,[end[0]-7*ux-3.2*uy,end[1]-7*uy+3.2*ux],[end[0]-7*ux+3.2*uy,end[1]-7*uy-3.2*ux]].map(p=>p.map(round));
  p.elementos[arrowIndex].puntos=pts;
  return{p,modelo:{tipo:'flecha_tangente',pathIndex,arrowIndex,extremo:end,controlFinal:control}};
});
assert.equal(propuestas.length,6);
write('indice.json',JSON.stringify(propuestas.map(({antes,despues,...r})=>r),null,2));

const css=fs.readFileSync('.next/static/css/app/layout.css','utf8');
function ejercicio(r,version,print,n){
  const item=s.items.find(i=>i.id===r.itemId),v=item.versiones[0],fig=markupReal(r[version],print?'max-h-64 w-full':'max-h-72 w-full');
  // Las alternativas null ya están dibujadas A-D. No se añaden filas vacías duplicadas.
  const opciones=v.alternativas.every(a=>a.texto===null)?'':`<ul class="mt-3 space-y-1.5">${v.alternativas.map(a=>`<li class="flex gap-2 text-sm"><b class="w-4 shrink-0">${a.letra}</b><span>${texto(a.texto)}</span></li>`).join('')}</ul>`;
  if(print)return `<div class="flex gap-3"><b class="w-6 shrink-0 text-right text-sm">${n}.</b><div class="min-w-0 flex-1"><p class="whitespace-pre-line text-sm leading-relaxed">${texto(v.enunciado)}</p><div class="my-3 max-w-md border border-slate-200 p-2 text-slate-900" data-marco>${fig}</div>${opciones}</div></div>`;
  return `<section class="rounded-2xl border border-borde bg-white p-6"><p class="mb-4 whitespace-pre-line text-base leading-relaxed text-marca">${texto(v.enunciado)}</p><div class="mb-5 rounded-xl border border-borde bg-white p-3 text-marca" data-marco>${fig}</div>${opciones}</section>`;
}
for(const r of propuestas)for(const ver of ['antes','despues'])write(r.codigo+'-'+ver+'-pantalla.html',`<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style><style>html{font-size:16px}body{margin:0}header{padding:16px 24px;background:white;font:13px Arial}</style></head><body><header>${r.itemCandidato} - ${ver==='antes'?'Antes':'Propuesta local'}${r.requiereEnlace?' - recurso candidato, sin nuevo enlace':''} <span id="medida"></span></header><main class="mx-auto max-w-4xl space-y-5 px-6 py-8">${ejercicio(r,ver,false,1)}</main><script>function medir(){const s=document.querySelector('[data-marco] svg'),v=s.viewBox.baseVal,r=s.getBoundingClientRect(),k=Math.min(r.width/v.width,r.height/v.height);document.getElementById('medida').textContent=' Ventana '+innerWidth+' px; dibujo '+(v.width*k).toFixed(1)+' × '+(v.height*k).toFixed(1)+' px CSS'}addEventListener('resize',medir);medir();</script></body></html>`);
const cards=propuestas.map(r=>`<article id="${r.codigo}"><h2>${r.itemCandidato}</h2><p>${esc(r.motivo)}</p><div class="cols"><div><h3>Antes</h3><img src="figuras/${r.codigo}-antes.png" alt="Antes"></div><div><h3>Propuesta</h3><img src="figuras/${r.codigo}-despues.png" alt="Después"></div></div><button data-ver="${r.codigo}">Ver tamaño CSS</button> · <a href="${r.codigo}.json">Diff y comprobaciones</a>${r.alertas.map(a=>`<p class="alerta">Alerta de contenido: ${esc(a)}</p>`).join('')}<details><summary>Solución y distractores para revisión</summary><p>${texto(s.items.find(i=>i.id===r.itemId).versiones[0].justificacion)}</p><ul>${s.items.find(i=>i.id===r.itemId).versiones[0].alternativas.map(a=>`<li>${a.letra}: ${texto(a.justificacionError)}</li>`).join('')}</ul></details></article>`).join('');
write('index.html',`<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>4° básico - lote 3</title><style>*{box-sizing:border-box}body{margin:0;background:#edf1f5;color:#16334a;font:16px/1.5 Arial}header,article{padding:20px;background:white;margin-bottom:20px;border:1px solid #bfccd5}main{max-width:1400px;margin:auto;padding:20px}h1{font-size:25px}h2{font-size:20px}.cols{display:grid;grid-template-columns:1fr 1fr;gap:24px}.cols img{display:block;max-width:100%;height:330px;object-fit:contain;margin:auto}select,button{padding:8px;font:inherit}label{display:inline-block;margin:8px}a{color:#155e85}.visor{overflow:auto;padding:15px;background:#dce4eb}iframe{display:block;margin:auto;border:1px solid #9badba;height:1100px;max-width:none}.alerta{padding:10px;background:#fff3ce}details{margin-top:15px}@media(max-width:800px){.cols{grid-template-columns:1fr}}</style></head><body><header><h1>4° básico: cinco juegos A-D y una flecha</h1><p>Propuestas locales. No publicadas en la base original. Los cinco ítems conservan su estado BORRADOR y sus claves; las alternativas de texto siguen null.</p><a href="muestras-a4.pdf" target="_blank">Muestras PDF A4</a> · <a href="impresion-a4.html" target="_blank">Hojas A4</a> · <a href="INFORME-LOTE-03.md">Informe</a></header><main><section id="escala"><h2>Tamaño CSS</h2><p>Comparaciones ampliadas abajo. Para comprobar tamaño usa este visor al 100 % de zoom o imprime A4 al 100 %.</p><label>Ítem <select id="figura">${propuestas.map(r=>`<option value="${r.codigo}">${r.itemCandidato}</option>`).join('')}</select></label><label>Versión <select id="version"><option value="despues">Propuesta</option><option value="antes">Antes</option></select></label><label>Ventana <select id="ancho"><option value="768">768 px</option><option value="1280">1280 px</option><option value="390">390 px</option></select></label><div class="visor"><iframe id="vista" title="Tamaño CSS"></iframe></div></section>${cards}</main><script>const f=document.getElementById('figura'),v=document.getElementById('version'),w=document.getElementById('ancho'),vista=document.getElementById('vista');function cargar(){vista.width=Number(w.value)+2;vista.src=f.value+'-'+v.value+'-pantalla.html'}for(const e of [f,v,w])e.onchange=cargar;document.querySelectorAll('[data-ver]').forEach(b=>b.onclick=()=>{f.value=b.dataset.ver;cargar();document.getElementById('escala').scrollIntoView()});cargar();</script></body></html>`);
const sheets=propuestas.map((r,n)=>`<section class="paper-sheet" data-codigo="${r.codigo}"><header><h1>4° básico - cierre gráfico - lote 3</h1><p>${r.itemCandidato} - página ${n+1} de 6 - propuesta local</p><p>A4 al 100 %, sin ajustar a página. ${r.estadoItem==='BORRADOR'?'Ítem BORRADOR.':''}</p><div class="regla">Referencia de 5 cm</div><p data-medida></p></header><main>${ejercicio(r,'despues',true,n+1)}</main><footer>${r.codigo}. No publicado en la base original.${r.requiereEnlace?' Recurso candidato: no se ha enlazado el ítem.':''}${r.alertas.length?' La justificación tiene una referencia a una casilla no pintada; revisión de contenido pendiente.':''}</footer></section>`).join('');
write('impresion-a4.html',`<!doctype html><html lang="es"><head><meta charset="utf-8"><title>4° básico - muestras lote 3</title><style>${css}</style><style>html{font-size:16px}body{margin:0;background:#e7ebef}.paper-sheet{width:210mm;height:297mm;padding:16mm;box-sizing:border-box;background:white;margin:20px auto;break-after:page;color:#0f172a}.paper-sheet:last-child{break-after:auto}header{font:12px/1.5 Arial;margin-bottom:8mm;border-bottom:1px solid #cbd5e1;padding-bottom:4mm}header h1{font:bold 18px Arial;margin:0 0 3mm}header p{margin:2mm 0}.regla{width:50mm;border-bottom:1px solid black;padding-bottom:3mm;margin:4mm 0}footer{margin-top:8mm;font:11px/1.5 Arial;color:#475569}@page{size:A4;margin:0}@media print{body{background:white}.paper-sheet{margin:0}}</style></head><body>${sheets}<script>document.querySelectorAll('.paper-sheet').forEach(e=>{const s=e.querySelector('[data-marco] svg'),v=s.viewBox.baseVal,r=s.getBoundingClientRect(),k=Math.min(r.width/v.width,r.height/v.height);e.querySelector('[data-medida]').textContent='Dibujo impreso: '+(v.width*k*25.4/96).toFixed(1)+' × '+(v.height*k*25.4/96).toFixed(1)+' mm.'});</script></body></html>`);
write('qa.html',`<!doctype html><html><head><meta charset="utf-8"></head><body>${propuestas.map(r=>`<div data-codigo="${r.codigo}">${markupReal(r.despues,'qa').replace('<svg ',`<svg width="${r.despues.ancho}" height="${r.despues.alto}" `)}</div>`).join('')}<script>window.propuestas=${JSON.stringify(propuestas.map(r=>({codigo:r.codigo,limitesTexto:[]})))}</script></body></html>`);
const cells=propuestas.map((r,n)=>`<text x="${n%2*700+15}" y="${Math.floor(n/2)*400+25}" font-size="17" font-family="Arial">${r.itemCandidato}</text><image x="${n%2*700+15}" y="${Math.floor(n/2)*400+40}" width="670" height="340" preserveAspectRatio="xMidYMid meet" href="data:image/png;base64,${fs.readFileSync(path.join(renders,r.codigo+'-despues.png')).toString('base64')}"/>`).join('');
write('contacto.png',pngDeSvg(`<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="1200"><rect width="100%" height="100%" fill="white"/>${cells}</svg>`,1400));

// Copia propuesta acumulada: se conservan todos los ítems y los enlaces originales.
const copia=structuredClone(s),prev=JSON.parse(fs.readFileSync(path.join(base,'revision/lote-02/indice.json'),'utf8'));
for(const r of [...prev,...propuestas]){
  const data=r.despues?r:JSON.parse(fs.readFileSync(path.join(base,'revision/lote-02',r.codigo+'.json'),'utf8'));
  const f=copia.figuras.find(f=>f.id===data.figuraId);f.primitivas=structuredClone(data.despues);f.ancho=data.dimensionesDespues.ancho;f.alto=data.dimensionesDespues.alto;
}
copia.trabajoLocal={...copia.trabajoLocal,estado:'COPIA_PROPUESTA_ACUMULADA_LOTE_03',lote02:44,lote03:6,nuevosEnlaces:0,aplicadoEnBaseOriginal:false};
assert.deepEqual(copia.items,s.items);assert.equal(copia.figuras.length,132);
write('copia-propuesta-4b-lote-03.json',JSON.stringify(copia,null,2));
write('fuentes.json',JSON.stringify({copiaEntradaSHA256:hashArchivo(entrada),componenteSHA256:hashArchivo('components/figura.tsx'),cssSHA256:crypto.createHash('sha256').update(css).digest('hex'),scriptSHA256:hashArchivo('scripts/codex-4b/lote-03.mjs'),figuras:6,baseNoConsultada:true,aplicadoEnOriginal:false,perfil:'Implementación local y revisión; configuración actual solicitada por el usuario, sin verificar selector de modelo. Sin subagentes.'},null,2));
assert.equal(hashArchivo(entrada),'b98764b7bb1a301ac0e8ee0049809fc629753520fa3f43b3fdc645549e50bf65');
console.log(JSON.stringify({out,figuras:6,opcionesGraficas:20,clavesSinCambios:true,nuevosEnlaces:0,baseNoConsultada:true}));
