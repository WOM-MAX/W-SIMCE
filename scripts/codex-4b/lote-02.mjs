// Propuestas offline. No importa Prisma ni lee credenciales.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { renderizar, markupReal, svgReal, pngDeSvg, hashArchivo, partirConPotencia } from './componente.mjs';

const base = path.resolve('tmp-figuras/codex-4b/2026-10-21T20-41-46-545Z');
const archivo = path.join(base, 'copia-trabajo-4b-lote-01.json');
const sourceHash = hashArchivo(archivo);
assert.equal(sourceHash, 'b98764b7bb1a301ac0e8ee0049809fc629753520fa3f43b3fdc645549e50bf65');
assert.equal(hashArchivo(path.join(base,'snapshot.json')), '6c64674b5c1322cf806c36509f83081f4b16ad65ed66063f10d1125d73366b20');
const anteriorFuentes = JSON.parse(fs.readFileSync(path.join(base,'revision/escala/fuentes.json')));
assert.equal(hashArchivo('components/figura.tsx'), anteriorFuentes.componenteSHA256, 'Cambió el componente; comprobar paridad antes de continuar');
const s = JSON.parse(fs.readFileSync(archivo,'utf8'));
const aprobadas = new Set(s.trabajoLocal.figurasCorregidas);
const out = path.join(base,'revision/lote-02');
const renders = path.join(out,'figuras');
fs.mkdirSync(renders,{recursive:true});
const reemplazar = process.argv.includes('--regenerar-local');
const write = (file,value) => {
  if(aprobacion&&file==='index.html')value=value.replace('Todas pendientes de tu aprobación.', '43 aprobadas visualmente; el ajuste de contraste de la fuente queda pendiente de tu revisión.');
  if(aprobacion&&file==='impresion-a4.html')for(const a of aprobacion.figuras){
    const start=value.indexOf(`<section class="paper-sheet" data-codigo="${a.codigo}">`);assert.ok(start>=0);
    value=value.slice(0,start)+value.slice(start).replace('Pendiente de aprobación.','Diseño y tamaño aprobados visualmente. No aplicado en base.');
  }
  fs.writeFileSync(path.join(out,file), value, {flag:reemplazar?'w':'wx'});
};
const sha = v => crypto.createHash('sha256').update(JSON.stringify(v)).digest('hex');
const esc = v => String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const texto = v => partirConPotencia(String(v??'')).map(t=>t.supra?`<sup>${esc(t.texto)}</sup>`:esc(t.texto)).join('');
const textos = p => p.elementos.filter(e=>e.op==='text').map(e=>e.texto);
const propuestas=[];
const aprobacionPath=path.join(out,'aprobacion-visual-parcial.json');
const aprobacion=fs.existsSync(aprobacionPath)?JSON.parse(fs.readFileSync(aprobacionPath,'utf8')):null;
function lineas(texto,ancho,tam) {
  const limite=Math.max(8,Math.floor(ancho/(tam*.52)));
  if(!texto || texto.length<=limite)return 1;
  let n=0,actual='';
  for(const w of texto.split(/\s+/)){
    const sig=actual?actual+' '+w:w;
    if(sig.length>limite&&actual){n++;actual=w;}else actual=sig;
  }
  return n+(actual?1:0);
}
function proponer(codigo,familia,motivo,editar) {
  if(codigo==='FIG-4B-MAT-GEO-F3-002-FUENTE')motivo+=' Oscurecer el interior de la fuente B2 para que concuerde con el enunciado.';
  assert.ok(!aprobadas.has(codigo),'No sobrescribir aprobadas');
  assert.ok(!propuestas.some(p=>p.codigo===codigo));
  const f=s.figuras.find(f=>f.codigo===codigo);assert.ok(f,codigo);
  const p=structuredClone(f.primitivas), limites=[];
  editar(p,limites);
  assert.deepEqual(textos(p),textos(f.primitivas),'Cambió un texto: '+codigo);
  assert.notDeepEqual(p,f.primitivas);
  const siguiente={...f,primitivas:p,ancho:Math.round(p.ancho),alto:Math.round(p.alto)};
  const patch=[{op:'test',path:'/id',value:f.id}];
  for(const k of ['primitivas','ancho','alto'])if(JSON.stringify(f[k])!==JSON.stringify(siguiente[k]))patch.push({op:'test',path:'/'+k,value:f[k]},{op:'replace',path:'/'+k,value:siguiente[k]});
  const usos=s.items.filter(i=>i.figuraId===f.id);
  const r={estado:'PROPUESTA_LOCAL_PENDIENTE_DE_APROBACION',codigo,figuraId:f.id,familia,motivo,
    copiaEntradaSHA256:sourceHash,antesSHA256:sha(f.primitivas),despuesSHA256:sha(p),
    dimensionesAntes:{ancho:f.ancho,alto:f.alto},dimensionesDespues:{ancho:siguiente.ancho,alto:siguiente.alto},
    usosActuales:usos.map(i=>i.codigo),ensayoItems:usos.reduce((n,i)=>n+i.versiones.reduce((m,v)=>m+v._count.ensayoItems,0),0),
    limitesTexto:limites,jsonPatch:patch,antes:f.primitivas,despues:p};
  const aprobada=aprobacion?.figuras.find(a=>a.codigo===codigo);
  if(aprobada){assert.equal(r.despuesSHA256,aprobada.despuesSHA256,'No alterar una propuesta aprobada');r.estado='APROBADO_VISUALMENTE_NO_APLICADO_EN_BASE';}
  for(const [tipo,p] of [['antes',r.antes],['despues',r.despues]]){
    const dest=path.join(renders,codigo+'-'+tipo);
    if(process.argv.includes('--reusar-renders')&&fs.existsSync(dest+'.svg')&&fs.existsSync(dest+'.png')&&fs.readFileSync(dest+'.svg','utf8')===svgReal(p))continue;
    renderizar(p,dest,{reemplazar});
  }
  write(codigo+'.json',JSON.stringify(r,null,2));
  propuestas.push(r);
  console.log(`${propuestas.length}: ${codigo}`);
}

// Tablas del generador defectuoso: reconstrucción del trazado, textos exactos.
const tablas=s.figuras.filter(f=>{
  if(aprobadas.has(f.codigo))return false;
  const rs=f.primitivas.elementos.filter(e=>e.op==='rect'),ts=textos(f.primitivas);
  return rs.length>1&&rs.every(r=>Math.abs(r.x)<.01&&r.w===f.primitivas.ancho)&&Number.isInteger((ts.length-1)/rs.length);
}).sort((a,b)=>Number(a.codigo.includes('-LEC-'))-Number(b.codigo.includes('-LEC-'))||a.codigo.localeCompare(b.codigo));
assert.equal(tablas.length,29);
for(const f of tablas)proponer(f.codigo,'tabla','Distribuir cada texto dentro de su celda, dar altura a los renglones y margen al título; conservar todos los valores.',(p,limites)=>{
  const ts=p.elementos.filter(e=>e.op==='text'),rs=p.elementos.filter(e=>e.op==='rect');
  const cols=(ts.length-1)/rs.length,original=p.ancho;
  let widths=Array(cols).fill(original/cols);
  if(f.codigo==='FIG-4B-MAT-NUM-F2-017-TABLA')widths=[64,150,86];
  if(f.codigo==='FIG-4B-MAT-NUM-F2-018-TABLA')widths=[66,174];
  if(f.codigo==='FIG-4B-LEC-DIS-04-TABLA')widths=[116,56,56,56,56];
  if(f.codigo==='FIG-4B-LEC-DIS-F2-02-TALLERES')widths=[67,70,95,98,40];
  if(f.codigo==='FIG-4B-LEC-DIS-F2-03-AGUA')widths=[254,86];
  if(f.codigo==='FIG-4B-MAT-PAT-F3-004-TABLA')widths=[100,60,60,60,60];
  const w=widths.reduce((a,b)=>a+b,0),font=9;
  const elementos=[{...ts[0],x:10,y:18,tam:10,ancho:w-2,anclaje:'inicio'}];
  const titleLines=lineas(ts[0].texto,w,10);
  limites.push({indice:0,x:8,y:4,w,h:18+(titleLines-1)*12.5});
  let y=18+(titleLines-1)*12.5+12;
  for(let row=0;row<rs.length;row++){
    const cells=ts.slice(1+row*cols,1+(row+1)*cols);
    const lines=cells.map((e,c)=>lineas(e.texto,widths[c]-16,font));
    const max=Math.max(...lines),h=Math.max(28,max*font*1.25+16);
    elementos.push({...rs[row],x:8,y,w,h});
    let x=8;
    cells.forEach((e,c)=>{
      const left=c===0||f.codigo==='FIG-4B-MAT-NUM-F2-018-TABLA'&&c===1;
      const baseline=y+(h-lines[c]*font*1.25)/2+font*.9;
      const indice=elementos.length;
      elementos.push({...e,x:left?x+8:x+widths[c]/2,y:baseline,anclaje:left?'inicio':'medio',tam:font,ancho:widths[c]-16});
      limites.push({indice,x:x+5,y:y+3,w:widths[c]-10,h:h-6});
      x+=widths[c];
    });
    y+=h;
  }
  let x=8;
  for(let c=0;c<cols-1;c++){x+=widths[c];elementos.push({op:'line',x1:x,x2:x,y1:18+(titleLines-1)*12.5+12,y2:y,grosor:.6});}
  p.elementos=elementos;p.ancho=w+16;p.alto=Math.ceil(y+8);
});

const graficos=['FIG-4B-MAT-DAT-003-GRAFICO','FIG-4B-MAT-DAT-005-GRAFICO','FIG-4B-MAT-DAT-F2-006-GRAFICO','FIG-4B-MAT-DAT-F3-005-GRAFICO','FIG-4B-MAT-DAT-F3-006-GRAFICO','FIG-4B-LEC-DIS-05-GRAFICO','FIG-4B-LEC-DIS-F2-04-GRAFICO'];
for(const codigo of graficos)proponer(codigo,'barras','Centrar categorías bajo sus barras y título sobre el gráfico; eliminar el margen vacío, sin cambiar alturas ni escalas.',p=>{
  const barras=p.elementos.filter(e=>e.op==='rect');
  for(const e of p.elementos)if(e.op==='text')e.tam=Math.max(e.tam??8,9);
  const eje=p.elementos.find(e=>e.op==='line'&&e.x1===e.x2&&!e.punteada);
  const horizontal=p.elementos.find(e=>e.op==='line'&&e.y1===e.y2&&!e.punteada);
  assert.ok(eje&&horizontal);
  const cats=p.elementos.filter(e=>e.op==='text'&&e.ancho&&e.y>horizontal.y1&&!e.negrita);
  assert.equal(cats.length,barras.length);
  cats.forEach((e,n)=>{e.x=barras[n].x+barras[n].w/2;e.anclaje='medio';e.tam=9;});
  const dx=40-eje.x1;
  for(const e of p.elementos){for(const k of ['x','x1','x2','cx'])if(typeof e[k]==='number')e[k]+=dx;for(const k of ['y','y1','y2','cy'])if(typeof e[k]==='number')e[k]+=24;}
  const titulo=p.elementos.find(e=>e.op==='text'&&e.negrita);
  titulo.x=(horizontal.x1+horizontal.x2)/2;titulo.y=16;titulo.tam=9.5;titulo.ancho=horizontal.x2-horizontal.x1;titulo.anclaje='medio';
  // El título puede envolver en dos líneas. El área de trazado empieza en y=44.
  p.ancho=Math.ceil(horizontal.x2+16);p.alto=Math.ceil(Math.max(...cats.map(e=>e.y+lineas(e.texto,e.ancho,e.tam)*e.tam*1.25))+8);
});
for(const codigo of ['FIG-4B-MAT-GEO-001-MAPA','FIG-4B-MAT-GEO-F2-001-PLANO','FIG-4B-MAT-GEO-F3-001-GRANJA','FIG-4B-MAT-GEO-F3-002-FUENTE'])proponer(codigo,'plano','Centrar los nombres dentro de sus recintos sin mover las ubicaciones, las casillas ni la cuadrícula.',(p,limites)=>{
  let n=0;
  for(const e of p.elementos)if(e.op==='text')e.tam=Math.max(e.tam??8,9.5);
  p.elementos.forEach((e,indice)=>{
    if(e.op!=='text'||e.anclaje!=='medio')return;
    const r=p.elementos.find(r=>r.op==='rect'&&r.x===e.x&&e.y>r.y&&e.y<r.y+r.h);
    if(!r)return;
    e.x=r.x+r.w/2;e.ancho=r.w-6;
    const lines=lineas(e.texto,e.ancho,e.tam);e.y=r.y+(r.h-lines*e.tam*1.25)/2+e.tam*.9;
    limites.push({indice,x:r.x+2,y:r.y+2,w:r.w-4,h:r.h-4});n++;
  });assert.ok(n>0);
  if(codigo==='FIG-4B-MAT-GEO-F3-002-FUENTE'){
    const r=p.elementos.find(e=>e.op==='rect'&&e.x===115&&e.y===83&&e.w===60&&e.h===32);
    assert.ok(r,'No coincide la casilla B2');
    const pos=p.elementos.indexOf(r)+1;
    // El renderer fija el relleno gris a 0.85; grisRelleno solo cambia opacidad.
    // Una banda de trazo gris admitida por el formato oscurece solo el interior.
    p.elementos.splice(pos,0,{op:'line',x1:115.5,y1:99,x2:174.5,y2:99,grosor:31,gris:.55});
    for(const lim of limites)if(lim.indice>=pos)lim.indice++;
  }
  p.alto=Math.ceil(Math.max(p.alto,...p.elementos.filter(e=>e.op==='text').map(e=>e.y+(lineas(e.texto,e.ancho??p.ancho,e.tam)-1)*e.tam*1.25+5)));
});
proponer('FIG-4B-MAT-DAT-F2-005-PICTOGRAMA','pictograma','Separar los días de los vasos, alinear las filas y juntar el símbolo con su leyenda. Conservar 6, 4, 3 y 6 vasos y la equivalencia de 5.',p=>{
  const ts=p.elementos.filter(e=>e.op==='text');
  Object.assign(ts[0],{x:160,y:18,anclaje:'medio',ancho:304,tam:10});
  for(let row=0;row<4;row++){
    Object.assign(ts[row+1],{x:12,y:50+28*row,tam:9.5,ancho:74});
    const top=26+22*row,cups=p.elementos.filter(e=>e.op==='poly'&&e.puntos[0][1]===top);
    assert.equal(cups.length,[6,4,3,6][row]);
    cups.forEach((e,c)=>{const dx=95+24*c-e.puntos[0][0],dy=38+28*row-top;e.puntos=e.puntos.map(([x,y])=>[x+dx,y+dy]);});
  }
  const key=p.elementos.find(e=>e.op==='poly'&&e.puntos[0][1]===118);
  assert.ok(key);key.puntos=key.puntos.map(([x,y])=>[x+10,y+40]);
  Object.assign(ts.at(-1),{x:38,y:167,tam:8.5,ancho:270});p.ancho=320;p.alto=190;
});
proponer('FIG-N4B-MAT-27','geometria','Añadir margen izquierdo para que la medida de 8 cm no quede recortada; conservar las dimensiones de los rectángulos.',p=>{
  for(const e of p.elementos)for(const k of ['x','x1','x2','cx'])if(typeof e[k]==='number')e[k]+=16;p.ancho+=16;
});
proponer('FIG-N4B-MAT-26','geometria','Dibujar tres cubitos de largo, tres de ancho y dos de alto, como indica el enunciado; conservar la leyenda.',p=>{
  const caption=structuredClone(p.elementos.find(e=>e.op==='text'));
  const el=[];const line=(x1,y1,x2,y2,grosor=.8)=>el.push({op:'line',x1,y1,x2,y2,grosor});
  for(let k=0;k<=3;k++)line(40+30*k,70,40+30*k,130,k===0||k===3?1.1:.8);
  for(let k=0;k<=2;k++)line(40,70+30*k,130,70+30*k,k===0||k===2?1.1:.8);
  for(let k=0;k<=3;k++)line(40+30*k,70,70+30*k,46,k===0||k===3?1.1:.8);
  for(let k=1;k<=3;k++)line(40+10*k,70-8*k,130+10*k,70-8*k,k===3?1.1:.8);
  line(160,46,160,106,1.1);
  for(let k=1;k<=2;k++)line(130,70+30*k,160,46+30*k,k===2?1.1:.8);
  for(let k=1;k<=2;k++)line(130+10*k,70-8*k,130+10*k,130-8*k);
  el.push({...caption,x:120,y:158,ancho:224,tam:8});p.elementos=el;p.alto=182;
});
proponer('FIG-N4B-MAT-09','geometria','Representar filas de uno, dos y tres cuadrados que comparten lados; cada dibujo contiene respectivamente 4, 7 y 10 palitos.',p=>{
  const ts=p.elementos.filter(e=>e.op==='text'),el=[];
  for(let n=1;n<=3;n++){
    const start=[20,105,200][n-1],u=22,y=40;
    for(let c=0;c<n;c++)for(const yy of [y,y+u])el.push({op:'line',x1:start+c*u,y1:yy,x2:start+(c+1)*u,y2:yy,grosor:1.4});
    for(let c=0;c<=n;c++)el.push({op:'line',x1:start+c*u,y1:y,x2:start+c*u,y2:y+u,grosor:1.4});
    el.push({...ts[n-1],x:start+n*u/2,y:88,tam:9});
  }
  el.push({...ts[3],y:119,ancho:300});p.elementos=el;
});
assert.equal(propuestas.length,44);
// Pruebas independientes de cantidades gráficas.
for(const r of propuestas.filter(p=>p.familia==='barras'))assert.deepEqual(r.antes.elementos.filter(e=>e.op==='rect').map(e=>[e.w,e.h]),r.despues.elementos.filter(e=>e.op==='rect').map(e=>[e.w,e.h]));
assert.equal(propuestas.find(p=>p.familia==='pictograma').despues.elementos.filter(e=>e.op==='poly').length,20);
const palitos=propuestas.find(p=>p.codigo==='FIG-N4B-MAT-09').despues.elementos.filter(e=>e.op==='line');assert.equal(palitos.length,21);
write('indice.json',JSON.stringify(propuestas.map(({antes,despues,...r})=>r),null,2));

const css=fs.readFileSync('.next/static/css/app/layout.css','utf8');
function ejercicio(item,p,n,print=false){
  const v=item.versiones[0],fig=markupReal(p,print?'max-h-64 w-full':'max-h-72 w-full');
  const alts=v.alternativas.map(a=>print?`<li class="flex gap-2 text-sm"><span class="w-4 shrink-0 font-semibold">${esc(a.letra)}</span><span class="flex-1">${texto(a.texto)}</span></li>`:`<label class="flex items-start gap-3 rounded-xl border border-borde p-3 text-sm"><span class="font-mono text-xs text-tenue">${esc(a.letra)}</span><span class="flex-1 text-slate-800">${texto(a.texto)}</span></label>`).join('');
  if(print)return `<div class="flex gap-3"><span class="w-6 shrink-0 text-right text-sm font-semibold">${n}.</span><div class="min-w-0 flex-1"><span class="block whitespace-pre-line text-sm leading-relaxed">${texto(v.enunciado)}</span><div class="my-3 max-w-md border border-slate-200 p-2 text-slate-900" data-marco>${fig}</div><ul class="mt-3 space-y-1.5">${alts}</ul></div></div>`;
  return `<section class="rounded-2xl border border-borde bg-white p-6"><p class="mb-4 whitespace-pre-line text-base leading-relaxed text-marca">${texto(v.enunciado)}</p><div class="mb-5 rounded-xl border border-borde bg-white p-3 text-marca" data-marco>${fig}</div><div class="space-y-2">${alts}</div></section>`;
}
for(const r of propuestas)for(const ver of ['antes','despues']){
  const usos=s.items.filter(i=>i.figuraId===r.figuraId);
  const html=`<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style><style>html{font-size:16px}body{margin:0}header{padding:16px 24px;background:white;font:13px Arial}</style></head><body><header>${esc(r.codigo)} - ${ver==='antes'?'Antes':'Propuesta pendiente de aprobación'} <span id="medida"></span></header><main class="mx-auto max-w-4xl space-y-5 px-6 py-8">${usos.map((i,n)=>`<p>${esc(i.codigo)}</p>${ejercicio(i,r[ver],n+1)}`).join('')}</main><script>function medir(){const e=document.querySelector('[data-marco] svg'),v=e.viewBox.baseVal,r=e.getBoundingClientRect(),k=Math.min(r.width/v.width,r.height/v.height);document.getElementById('medida').textContent=' Ventana '+innerWidth+' px; dibujo '+(v.width*k).toFixed(1)+' × '+(v.height*k).toFixed(1)+' px CSS';}addEventListener('resize',medir);medir();</script></body></html>`;
  write(r.codigo+'-'+ver+'-pantalla.html',html);
}
const style=`*{box-sizing:border-box}body{margin:0;background:#edf1f5;color:#16334a;font:16px/1.5 Arial}header{padding:20px;background:white;position:sticky;top:0;z-index:5;border-bottom:1px solid #becbd4}h1{font-size:25px;margin:0}h2{font-size:18px}select,button,input{padding:8px;font:inherit}a{color:#145e85}main{padding:20px;max-width:1500px;margin:auto}article{padding:20px;background:white;margin-bottom:24px;border:1px solid #b7c8d4;border-radius:8px}.cols{display:grid;grid-template-columns:1fr 1fr;gap:20px}.imagen{height:310px;display:flex;justify-content:center;align-items:center;border:1px solid #dce4eb}.imagen img{max-width:100%;max-height:100%;object-fit:contain}.meta{font-size:14px;color:#41596b}.visor{overflow:auto;padding:16px;background:#dce4eb}iframe{display:block;margin:auto;border:1px solid #91a9ba;height:1100px;max-width:none}details{margin-top:16px}label{display:inline-block;margin:8px 10px 8px 0}@media(max-width:800px){.cols{grid-template-columns:1fr}header{position:static}}`;
const cards=propuestas.map((r,n)=>{
  const usos=s.items.filter(i=>i.figuraId===r.figuraId);
  return `<article id="${r.codigo}" data-familia="${r.familia}" data-asignatura="${r.codigo.includes('-LEC-')?'lectura':'matematica'}"><h2>${n+1}. ${esc(r.codigo)}</h2><p>${esc(r.motivo)}</p><p class="meta">Ítems: ${r.usosActuales.map(esc).join(', ')}. Figura compartida: ${r.usosActuales.length>1?'sí; revisar todos sus usos':'no'}. No aplicada en la base.</p><div class="cols"><div><h3>Antes</h3><div class="imagen"><img loading="lazy" src="figuras/${r.codigo}-antes.png" alt="Antes"></div></div><div><h3>Propuesta</h3><div class="imagen"><img loading="lazy" src="figuras/${r.codigo}-despues.png" alt="Propuesta"></div></div></div><p class="meta">Las comparaciones están ampliadas. Para evaluar tamaño usa el visor de abajo o las hojas A4.</p><button data-ver="${r.codigo}">Ver este ítem a tamaño CSS</button> <a href="figuras/${r.codigo}-despues.png" target="_blank">Abrir PNG</a> · <a href="${r.codigo}.json">Diff JSON</a><label>Tu revisión <select data-decision="${r.codigo}"><option value="pendiente">Pendiente</option><option value="aprobar">Aprobar diseño y tamaño</option><option value="revisar">Necesita ajuste</option></select></label><details><summary>Enunciados y alternativas de todos sus usos</summary>${usos.map(i=>`<h3>${esc(i.codigo)}</h3><p>${texto(i.versiones[0].enunciado)}</p><ol type="A">${i.versiones[0].alternativas.map(a=>`<li>${texto(a.texto)}</li>`).join('')}</ol>`).join('')}</details></article>`;
}).join('');
write('index.html',`<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Lote 2 - Figuras de 4° básico</title><style>${style}</style></head><body><header><h1>Lote 2: 44 propuestas gráficas de 4° básico</h1><p>39 figuras de Matemática y 5 de Lectura. Todas pendientes de tu aprobación. El lote 1 aprobado se conserva aparte.</p><label>Área <select id="area"><option value="todas">Todas</option><option value="matematica" selected>Matemática</option><option value="lectura">Lectura</option></select></label><label>Tipo <select id="tipo"><option value="todas">Todos</option>${[...new Set(propuestas.map(p=>p.familia))].map(f=>`<option>${f}</option>`).join('')}</select></label><button id="guardar">Descargar mi revisión</button> <a href="impresion-a4.html" target="_blank">Muestras A4</a> · <a href="muestras-a4.pdf" target="_blank">PDF para imprimir al 100 %</a><p id="conteo"></p></header><main><section id="escala"><h2>Visor con el tamaño CSS del ejercicio</h2><p>Zoom del navegador al 100 %. Es una reproducción local de las clases de la app; no una sesión conectada a la base. El tamaño físico depende del monitor.</p><label>Figura <select id="figura">${propuestas.map(p=>`<option>${p.codigo}</option>`).join('')}</select></label><label>Versión <select id="version"><option value="despues">Propuesta</option><option value="antes">Antes</option></select></label><label>Ventana <select id="ancho"><option value="768">768 px</option><option value="1280">1280 px</option><option value="390">390 px</option></select></label><div class="visor"><iframe id="vista" title="Ítems a tamaño CSS"></iframe></div></section><h2>Comparaciones ampliadas</h2>${cards}</main><script>
const key='codex-4b-lote-02-revision',f=document.getElementById('figura'),v=document.getElementById('version'),w=document.getElementById('ancho'),vista=document.getElementById('vista');
let estado={};try{estado=JSON.parse(localStorage.getItem(key)||'{}')}catch{}
function cargar(){vista.width=Number(w.value)+2;vista.src=f.value+'-'+v.value+'-pantalla.html'}
for(const e of [f,v,w])e.addEventListener('change',cargar);
document.querySelectorAll('[data-ver]').forEach(b=>b.onclick=()=>{f.value=b.dataset.ver;cargar();document.getElementById('escala').scrollIntoView()});
document.querySelectorAll('[data-decision]').forEach(e=>{e.value=estado[e.dataset.decision]||'pendiente';e.onchange=()=>{estado[e.dataset.decision]=e.value;try{localStorage.setItem(key,JSON.stringify(estado))}catch{}}});
function filtrar(){let n=0;document.querySelectorAll('article').forEach(e=>{e.hidden=!( (area.value==='todas'||e.dataset.asignatura===area.value)&&(tipo.value==='todas'||e.dataset.familia===tipo.value));if(!e.hidden)n++});document.getElementById('conteo').textContent=n+' figuras visibles'}
const area=document.getElementById('area'),tipo=document.getElementById('tipo');area.onchange=tipo.onchange=filtrar;
document.getElementById('guardar').onclick=()=>{const blob=new Blob([JSON.stringify({lote:2,fecha:new Date().toISOString(),decisiones:estado},null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='revision-4b-lote-02.json';a.click();URL.revokeObjectURL(a.href)};cargar();filtrar();
</script></body></html>`);

const blocks=propuestas.map((r,n)=>{
  const item=s.items.find(i=>i.figuraId===r.figuraId);
  return `<section class="paper-sheet" data-codigo="${r.codigo}"><header><h1>Propuesta gráfica - 4° básico - lote 2</h1><p>${esc(item.codigo)} - página ${n+1} de 44</p><p>Pendiente de aprobación. A4 al 100 %, sin ajustar a página.</p><div class="regla">Referencia: esta línea debe medir 5 cm</div><p data-medida></p></header><main>${ejercicio(item,r.despues,n+1,true)}</main><footer>${esc(r.codigo)}. ${r.usosActuales.length>1?'La figura es compartida; el visor incluye los otros ítems.':''} Esta hoja comprueba diseño y tamaño; el contenido y la clave aún no se dan por validados.</footer></section>`;
}).join('');
write('impresion-a4.html',`<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Lote 2 - Muestras A4</title><style>${css}</style><style>html{font-size:16px}body{margin:0;background:#e7ebef}.paper-sheet{width:210mm;height:297mm;box-sizing:border-box;padding:16mm;background:white;margin:20px auto;break-after:page;color:#0f172a}.paper-sheet:last-child{break-after:auto}header{font:12px/1.5 Arial;margin-bottom:8mm;border-bottom:1px solid #cbd5e1;padding-bottom:4mm}header h1{font:bold 18px Arial;margin:0 0 3mm}header p{margin:2mm 0}.regla{width:50mm;border-bottom:1px solid black;margin:4mm 0;white-space:nowrap;padding-bottom:3mm}footer{margin-top:8mm;font:11px/1.5 Arial;color:#475569}@page{size:A4;margin:0}@media print{body{background:white}.paper-sheet{margin:0}}</style></head><body>${blocks}<script>document.querySelectorAll('.paper-sheet').forEach(e=>{const svg=e.querySelector('[data-marco] svg'),v=svg.viewBox.baseVal,r=svg.getBoundingClientRect(),k=Math.min(r.width/v.width,r.height/v.height);e.querySelector('[data-medida]').textContent='Dibujo impreso: '+(v.width*k*25.4/96).toFixed(1)+' × '+(v.height*k*25.4/96).toFixed(1)+' mm.';});</script></body></html>`);

// Archivo exclusivamente para QA: un SVG por página, sin CSS que distorsione el viewBox.
write('qa.html',`<!doctype html><html><head><meta charset="utf-8"><style>body{margin:20px;font-family:Arial}.fig{margin:20px;padding:10px;border:1px solid #ddd;width:max-content}svg{display:block;color:black}</style></head><body>${propuestas.map(r=>`<div class="fig" data-codigo="${r.codigo}"><p>${r.codigo}</p>${markupReal(r.despues,'qa').replace('<svg ',`<svg width="${r.despues.ancho}" height="${r.despues.alto}" `)}</div>`).join('')}<script>window.propuestas=${JSON.stringify(propuestas.map(r=>({codigo:r.codigo,limitesTexto:r.limitesTexto}))).replace(/</g,'\\u003c')};</script></body></html>`);

// Contactos PNG de hasta ocho dibujos, con etiquetas fuera del área de imagen.
for(let start=0;start<propuestas.length;start+=8){
  const chunk=propuestas.slice(start,start+8),rows=Math.ceil(chunk.length/2),width=1400,height=rows*300;
  const cells=chunk.map((r,k)=>{const x=(k%2)*700,y=Math.floor(k/2)*300;const b64=fs.readFileSync(path.join(renders,r.codigo+'-despues.png')).toString('base64');return `<text x="${x+15}" y="${y+24}" font-size="15" font-family="Arial">${esc(r.codigo)}</text><image x="${x+15}" y="${y+38}" width="670" height="245" preserveAspectRatio="xMidYMid meet" href="data:image/png;base64,${b64}"/>`;}).join('');
  write('contacto-'+String(start/8+1).padStart(2,'0')+'.png',pngDeSvg(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="100%" height="100%" fill="white"/>${cells}</svg>`,width));
}
write('fuentes.json',JSON.stringify({copiaEntradaSHA256:sourceHash,componenteSHA256:hashArchivo('components/figura.tsx'),cssSHA256:hashArchivo('.next/static/css/app/layout.css'),scriptSHA256:hashArchivo('scripts/codex-4b/lote-02.mjs'),figuras:44,matematica:39,lectura:5,conexionBase:false,aplicadoEnOriginal:false,estado:'PENDIENTE_APROBACION'},null,2));
assert.equal(hashArchivo(archivo),sourceHash,'La copia de trabajo debe permanecer intacta');
console.log(JSON.stringify({out,propuestas:propuestas.length,copiaIntacta:true,baseNoConsultada:true}));
