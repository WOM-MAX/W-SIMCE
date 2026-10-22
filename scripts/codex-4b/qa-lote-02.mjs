// Navegador aislado para mediciones y capturas locales. No accede a la app ni a la BD.
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';
const directorio=process.argv.find(a=>a.startsWith('--directorio='))?.slice('--directorio='.length);
const out=path.resolve(directorio??'tmp-figuras/codex-4b/2026-10-21T20-41-46-545Z/revision/lote-02');
const perfil=fs.mkdtempSync(path.resolve('tmp-figuras/codex-4b/perfil-lote-02-'));
const edge='C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const proc=spawn(edge,['--headless','--disable-gpu','--no-first-run','--disable-extensions','--disable-background-networking','--remote-debugging-port=0','--remote-allow-origins=*','--user-data-dir='+perfil,'about:blank'],{stdio:'ignore',windowsHide:true});
let ws;
const pause=ms=>new Promise(r=>setTimeout(r,ms));
try {
  const active=path.join(perfil,'DevToolsActivePort');
  for(let n=0;n<150&&!fs.existsSync(active);n++)await pause(100);
  assert.ok(fs.existsSync(active),'No se inició el navegador aislado');
  const port=fs.readFileSync(active,'utf8').split(/\r?\n/)[0];
  const tabs=await(await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  const tab=tabs.find(t=>t.type==='page');assert.ok(tab);
  ws=new WebSocket(tab.webSocketDebuggerUrl);
  await new Promise((resolve,reject)=>{ws.onopen=resolve;ws.onerror=reject});
  let id=0;const pending=new Map();
  ws.onmessage=e=>{const m=JSON.parse(e.data);if(!m.id)return;const p=pending.get(m.id);if(!p)return;pending.delete(m.id);clearTimeout(p.timer);m.error?p.reject(new Error(JSON.stringify(m.error))):p.resolve(m.result)};
  function call(method,params={}){return new Promise((resolve,reject)=>{const n=++id;const timer=setTimeout(()=>{pending.delete(n);reject(new Error('Timeout '+method))},30000);pending.set(n,{resolve,reject,timer});ws.send(JSON.stringify({id:n,method,params}))})}
  async function evaluate(expression){const r=await call('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw new Error(JSON.stringify(r.exceptionDetails));return r.result.value}
  async function goto(file,width=1280,height=1200){
    await call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
    await call('Page.navigate',{url:pathToFileURL(path.join(out,file)).href});
    for(let n=0;n<100;n++){await pause(40);if(await evaluate('document.readyState')==='complete')break;}
    await evaluate('document.fonts.ready.then(()=>true)');
  }
  await call('Page.enable');
  await goto('qa.html',1440,1200);
  const bounds=await evaluate(`(()=>{
    const results=[];
    for(const c of document.querySelectorAll('[data-codigo]')){
      const svg=c.querySelector('svg'),vb=svg.viewBox.baseVal,def=window.propuestas.find(p=>p.codigo===c.dataset.codigo),errors=[],texts=[];
      [...svg.children].forEach((e,i)=>{
        if(e.tagName!=='text')return;
        const b=e.getBBox(),r={indice:i,texto:e.textContent,x:b.x,y:b.y,w:b.width,h:b.height};texts.push(r);
        if(b.width&& (b.x<-.5||b.y<-.5||b.x+b.width>vb.width+.5||b.y+b.height>vb.height+.5))errors.push({tipo:'fuera_lienzo',...r});
        const lim=def.limitesTexto.find(l=>l.indice===i);
        if(lim&&b.width&&(b.x<lim.x-.5||b.y<lim.y-.5||b.x+b.width>lim.x+lim.w+.5||b.y+b.height>lim.y+lim.h+.5))errors.push({tipo:'fuera_celda',...r,limite:lim});
      });
      results.push({codigo:c.dataset.codigo,errors,texts});
    }return results;
  })()`);
  fs.writeFileSync(path.join(out,'qa-textos.json'),JSON.stringify(bounds,null,2));
  console.log('Texto SVG: '+bounds.length+' figuras; '+bounds.reduce((n,r)=>n+r.errors.length,0)+' desbordes');
  const index=JSON.parse(fs.readFileSync(path.join(out,'indice.json')));
  const pantalla=[];
  for(const width of [390,768,1280])for(const r of index){
    await goto(r.codigo+'-despues-pantalla.html',width,1100);
    const measure=await evaluate(`(()=>{const svg=document.querySelector('[data-marco] svg'),r=svg.getBoundingClientRect(),v=svg.viewBox.baseVal,k=Math.min(r.width/v.width,r.height/v.height);return{ventana:innerWidth,pagina:document.documentElement.scrollWidth,anchoDibujo:v.width*k,altoDibujo:v.height*k,minTextoPx:Math.min(...[...svg.querySelectorAll('text')].filter(t=>t.textContent.trim()).map(t=>parseFloat(getComputedStyle(t).fontSize)*k)),usos:document.querySelectorAll('[data-marco]').length}})()`);
    pantalla.push({codigo:r.codigo,...measure});
    if(width===390&&(process.argv.includes('--capturar-todas')||['FIG-4B-MAT-NUM-F2-017-TABLA','FIG-4B-MAT-DAT-F2-005-PICTOGRAMA','FIG-4B-MAT-GEO-F2-001-PLANO'].includes(r.codigo))){
      const shot=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});fs.writeFileSync(path.join(out,r.codigo+'-movil.png'),Buffer.from(shot.data,'base64'));
    }
    if(width===1280&&(process.argv.includes('--capturar-todas')||['FIG-N4B-MAT-26','FIG-N4B-MAT-09','FIG-4B-MAT-DAT-F3-005-GRAFICO'].includes(r.codigo))){
      const shot=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});fs.writeFileSync(path.join(out,r.codigo+'-escritorio.png'),Buffer.from(shot.data,'base64'));
    }
  }
  fs.writeFileSync(path.join(out,'qa-pantalla.json'),JSON.stringify(pantalla,null,2));
  console.log('Pantalla: '+pantalla.length+' mediciones; '+pantalla.filter(m=>m.pagina>m.ventana).length+' desbordes horizontales');
  await goto('impresion-a4.html',1280,1200);
  const paper=await evaluate(`([...document.querySelectorAll('.paper-sheet')].map(e=>{const s=e.querySelector('[data-marco] svg'),r=s.getBoundingClientRect(),v=s.viewBox.baseVal,k=Math.min(r.width/v.width,r.height/v.height);return{codigo:e.dataset.codigo,alto:e.clientHeight,contenido:e.scrollHeight,anchoDibujoMm:v.width*k*25.4/96,altoDibujoMm:v.height*k*25.4/96,minTextoPt:Math.min(...[...s.querySelectorAll('text')].filter(t=>t.textContent.trim()).map(t=>parseFloat(getComputedStyle(t).fontSize)*k*.75)),finContenido:e.querySelector('footer').getBoundingClientRect().bottom-e.getBoundingClientRect().top}}))`);
  fs.writeFileSync(path.join(out,'qa-papel.json'),JSON.stringify(paper,null,2));
  console.log('Papel: '+paper.length+' hojas; '+paper.filter(p=>p.contenido>p.alto||p.finContenido>p.alto-60).length+' desbordes');
  if(process.argv.includes('--pdf')){
    assert.equal(bounds.reduce((n,r)=>n+r.errors.length,0),0,'Corregir desbordes antes de imprimir');
    assert.equal(pantalla.filter(m=>m.pagina>m.ventana).length,0);
    assert.equal(paper.filter(p=>p.contenido>p.alto||p.finContenido>p.alto-60).length,0);
    const pdf=await call('Page.printToPDF',{printBackground:true,preferCSSPageSize:true,displayHeaderFooter:false});
    fs.writeFileSync(path.join(out,'muestras-a4.pdf'),Buffer.from(pdf.data,'base64'),{flag:process.argv.includes('--regenerar-pdf-local')?'w':'wx'});
    console.log('PDF creado: muestras-a4.pdf');
  }
  await call('Browser.close');
} finally {
  if(ws&&ws.readyState===WebSocket.OPEN)ws.close();
  // Solo el proceso creado aquí; nunca el servidor ni otros navegadores.
  if(proc.exitCode===null)proc.kill();
}
