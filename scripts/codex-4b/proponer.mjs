// Propuestas locales con pruebas de valor anterior. No hay conexión a base.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { renderizar, pngDeSvg, hashArchivo } from './componente.mjs';
const archivo = path.resolve(process.argv[2] ?? '');
const s = JSON.parse(fs.readFileSync(archivo, 'utf8'));
const out = path.join(path.dirname(archivo), 'revision', 'propuestas');
fs.mkdirSync(out, { recursive: true });
const sha = v => crypto.createHash('sha256').update(JSON.stringify(v)).digest('hex');
const esc = v => String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
function compararPNG(codigo) {
  const image=(tipo,x)=>`<image x="${x}" y="75" width="650" height="400" preserveAspectRatio="xMidYMid meet" href="data:image/png;base64,${fs.readFileSync(path.join(out,codigo+'-'+tipo+'.png')).toString('base64')}"/>`;
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="520"><rect width="1400" height="520" fill="white"/><text x="25" y="28" font-size="19" font-family="Arial" text-anchor="start">${esc(codigo)}</text><text x="25" y="60" font-size="18" font-family="Arial" text-anchor="start">Actual</text><text x="725" y="60" font-size="18" font-family="Arial" text-anchor="start">Propuesta local — pendiente de aprobación</text>${image('antes',25)}${image('despues',725)}</svg>`;
  fs.writeFileSync(path.join(out,codigo+'-comparacion.png'),pngDeSvg(svg,1400));
}
if(process.argv.includes('--comparaciones')) {
  const indice=JSON.parse(fs.readFileSync(path.join(out,'indice.json'),'utf8'));
  for(const p of indice)compararPNG(p.codigo);
  console.log('Comparaciones PNG verificables, sin SVG anidados: '+indice.length);
  process.exit(0);
}
const propuestas = [];
const reemplazar = process.argv.includes('--regenerar-propuestas-locales');
function proponer(codigo, motivo, editar) {
  const anterior = s.figuras.find(f=>f.codigo===codigo);
  if (!anterior) throw new Error('Figura inexistente: '+codigo);
  const nueva = structuredClone(anterior);
  editar(nueva.primitivas);
  nueva.ancho = Math.round(nueva.primitivas.ancho);
  nueva.alto = Math.round(nueva.primitivas.alto);
  const cambios=[];
  function comparar(a,b,ruta) {
    if (JSON.stringify(a)===JSON.stringify(b)) return;
    if (a && b && typeof a==='object' && typeof b==='object' && !Array.isArray(a) && !Array.isArray(b)) {
      for (const k of new Set([...Object.keys(a),...Object.keys(b)])) comparar(a[k],b[k],ruta+'/'+k);
    } else if (Array.isArray(a)&&Array.isArray(b)&&a.length===b.length&&ruta==='/primitivas/elementos') {
      a.forEach((v,n)=>comparar(v,b[n],ruta+'/'+n));
    } else {
      if (a===undefined || b===undefined) throw new Error('Esta propuesta admite solo reemplazos');
      cambios.push({op:'test',path:ruta,value:a},{op:'replace',path:ruta,value:b});
    }
  }
  comparar(anterior.primitivas,nueva.primitivas,'/primitivas');
  comparar(anterior.ancho,nueva.ancho,'/ancho');
  comparar(anterior.alto,nueva.alto,'/alto');
  if (!cambios.length) throw new Error('No hay cambios: '+codigo);
  const propuesta = { estado:'PROPUESTA LOCAL, NO APLICADA',figuraId:anterior.id,codigo,motivo,
    snapshotSHA256:hashArchivo(archivo),antesSHA256:sha(anterior.primitivas),despuesSHA256:sha(nueva.primitivas),
    dimensionesAntes:{ancho:anterior.ancho,alto:anterior.alto},dimensionesDespues:{ancho:nueva.ancho,alto:nueva.alto},
    usosActuales:anterior.items.map(i=>i.codigo),
    jsonPatch:[{op:'test',path:'/id',value:anterior.id},...cambios],
    antes:anterior.primitivas,despues:nueva.primitivas };
  renderizar(anterior.primitivas,path.join(out,codigo+'-antes'),{reemplazar});
  renderizar(nueva.primitivas,path.join(out,codigo+'-despues'),{reemplazar});
  compararPNG(codigo);
  fs.writeFileSync(path.join(out,codigo+'.json'),JSON.stringify(propuesta,null,2),{flag:reemplazar?'w':'wx'});
  propuestas.push(propuesta);
}
proponer('FIG-4B-MAT-NUM-F2-022-RECTA','Dar margen superior al signo de interrogación sin cambiar la marca de 3/5.',p=>{
  const q=p.elementos.find(e=>e.op==='text'&&e.texto==='?');
  if (q?.y!==6) throw new Error('Cambió la posición esperada del signo');
  q.y=18;
  const flecha=p.elementos.find(e=>e.op==='line'&&e.x1===186&&e.x2===186&&e.y1===12&&e.y2===38);
  if(!flecha)throw new Error('Flecha no esperada');
  flecha.y1=24;
});
for(const code of ['FIG-4B-MAT-PAT-003-RECTA','FIG-N4B-MAT-03','FIG-N4B-MAT-07','FIG-N4B-MAT-43']){
  proponer(code,code==='FIG-N4B-MAT-07'?'Recuperar el polígono y dibujar catetos iguales para representar 45°, 45° y 90°; reubicar los rótulos.':'Conservar cada coordenada y convertir puntos de cadena a arreglo admitido por el componente real.',p=>{
    for(const e of p.elementos.filter(e=>e.op==='poly'&&typeof e.puntos==='string')){
      const pts=e.puntos.trim().split(/\s+/).map(par=>par.split(',').map(Number));
      if(pts.some(par=>par.length!==2||par.some(n=>!Number.isFinite(n))))throw new Error('Coordenadas inválidas');
      e.puntos=pts;
    }
    if(code==='FIG-N4B-MAT-07'){
      p.elementos.find(e=>e.op==='poly').puntos=[[40,130],[130,130],[40,40]];
      const rotulos=p.elementos.filter(e=>e.op==='text'&&e.texto==='45°');
      rotulos[0].x=48;rotulos[0].y=74;
      rotulos[1].x=108;rotulos[1].y=124;
      p.ancho=170;
    }
  });
}
for(const code of ['FIG-4B-MAT-DAT-002-GRAFICO','FIG-4B-MAT-DAT-006-GRAFICO']){
  proponer(code,'Centrar cada categoría bajo su barra, centrar el título y quitar margen izquierdo excesivo conservando las cantidades.',p=>{
    const barras=p.elementos.filter(e=>e.op==='rect');
    const categorias=p.elementos.filter(e=>e.op==='text'&&e.y===154);
    if(barras.length!==categorias.length)throw new Error('No coincide la cantidad de categorías');
    categorias.forEach((e,n)=>e.x=barras[n].x+barras[n].w/2);
    const titulo=p.elementos.find(e=>e.op==='text'&&e.negrita);
    titulo.x=338;
    for(const e of p.elementos)for(const k of ['x','x1','x2','cx'])if(typeof e[k]==='number')e[k]-=160;
    p.ancho-=160;
  });
}
for(const code of ['FIG-4B-MAT-DAT-004-TABLA','FIG-4B-MAT-NUM-010-TABLA']){
  proponer(code,'Centrar los textos de la segunda columna para que la división no los atraviese.',p=>{
    const ancho=p.elementos.find(e=>e.op==='rect').w;
    for(const e of p.elementos.filter(e=>e.op==='text'&&e.anclaje==='medio'))e.x=ancho*0.75;
  });
}
for(const code of ['FIG-4B-MAT-NUM-001-TABLA','FIG-4B-MAT-PAT-001-TABLA']){
  proponer(code,'Centrar los datos y encabezados en su propia celda sin cambiar el contenido.',p=>{
    const w=p.elementos.find(e=>e.op==='rect').w;
    const filas=new Map();
    for(const e of p.elementos.filter(e=>e.op==='text'&&e.y>10)){const a=filas.get(e.y)??[];a.push(e);filas.set(e.y,a);}
    for(const fila of filas.values()){
      if(fila.length!==4)throw new Error('Se esperaban cuatro columnas');
      fila.sort((a,b)=>a.x-b.x).forEach((e,n)=>{e.x=(n+0.5)*w/4;e.anclaje='medio';});
    }
  });
}
proponer('FIG-4B-MAT-GEO-002-MAPA','Centrar los nombres en sus casillas, conservando C1 y A2 y todas las posiciones del mapa.',p=>{
  for(const e of p.elementos.filter(e=>e.op==='text'&&['plaza','biblioteca','museo','colegio','cine'].includes(e.texto))){
    const r=p.elementos.find(r=>r.op==='rect'&&r.x===e.x&&Math.abs(r.y+19-e.y)<0.01);
    if(!r)throw new Error('Casilla no encontrada');
    e.x=r.x+r.w/2;
  }
});
fs.writeFileSync(path.join(out,'indice.json'),JSON.stringify(propuestas.map(({antes,despues,...p})=>p),null,2),{flag:reemplazar?'w':'wx'});
console.log(JSON.stringify({propuestas:propuestas.length,directorio:out},null,2));
