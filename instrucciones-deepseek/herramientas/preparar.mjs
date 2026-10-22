// Prepara una entrega nueva con claves ocultas. Sin API ni acceso a BD.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {validar,hash} from './validar.mjs';
const here=path.dirname(fileURLToPath(import.meta.url)),repo=path.resolve(here,'../..');
const shaArchivo=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const esc=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
export function paraRevisionCiega(lote){
  return{formato:'w-simce-revision-ciega-v1',loteId:lote.loteId,nivel:lote.nivel,asignatura:lote.asignatura,
    items:lote.items.map(i=>({codigoLocal:i.codigoLocal,versionCandidata:i.versionCandidata,sha256Candidato:hash(i),
      enunciado:i.enunciado,alternativas:i.alternativas.map(a=>({letra:a.letra,texto:a.texto})),necesitaFigura:i.necesitaFigura,figura:structuredClone(i.figura)}))};
}
export async function preparar(file){
  if(fs.realpathSync(process.cwd())!==fs.realpathSync(repo))throw Error('Ejecutar desde la raíz de W-SIMCE, como indican las instrucciones');
  const lote=JSON.parse(fs.readFileSync(file,'utf8')),control=validar(lote);
  if(control.errores.length)throw Error('Candidato rechazado: '+control.errores.join('; '));
  const {renderizar}=await import('../../scripts/codex-4b/componente.mjs');
  const root=path.join(repo,'instrucciones-deepseek/entregas');fs.mkdirSync(root,{recursive:true});
  const out=fs.mkdtempSync(path.join(root,lote.loteId+'-'));fs.mkdirSync(path.join(out,'figuras'));
  const write=(name,v)=>fs.writeFileSync(path.join(out,name),v,{flag:'wx'});
  const ciego=paraRevisionCiega(lote),figuras=[];
  for(const i of lote.items)if(i.figura){
    const dest=path.join(out,'figuras',i.codigoLocal);renderizar(i.figura,dest);
    figuras.push({codigoLocal:i.codigoLocal,pngSHA256:shaArchivo(dest+'.png'),svgSHA256:shaArchivo(dest+'.svg')});
  }
  write('revision-ciega.json',JSON.stringify(ciego,null,2));
  write('sobre-respuestas.json',JSON.stringify({advertencia:'No abrir antes de registrar resolución propia. No contiene dictámenes emitidos.',loteId:lote.loteId,
    items:lote.items.map(i=>({codigoLocal:i.codigoLocal,versionCandidata:i.versionCandidata,sha256Candidato:hash(i),oa:i.oa,
      demandaCognitivaEstimada:i.demandaCognitivaEstimada,dificultadEstimada:i.dificultadEstimada,clavePropuesta:i.clavePropuesta,
      justificacionPropuesta:i.justificacionPropuesta,erroresPropuestos:i.alternativas.map(a=>({letra:a.letra,errorEsperado:a.errorEsperado})),modeloGeometrico:i.modeloGeometrico}))},null,2));
  write('control-automatico.json',JSON.stringify(control,null,2));
  const cards=ciego.items.map(i=>`<article><h2>${esc(i.codigoLocal)} - versión ${i.versionCandidata}</h2><p>${esc(i.enunciado)}</p>${i.figura?`<div class="dibujo"><img src="figuras/${i.codigoLocal}.png" alt="Figura del candidato"></div><p class="nota">Dibujo ampliado para inspección. No es prueba de tamaño real de pantalla o impresión.</p><a href="figuras/${i.codigoLocal}.png">Abrir PNG</a> · <a href="figuras/${i.codigoLocal}.svg">Abrir SVG</a>`:''}<ol type="A">${i.alternativas.map(a=>`<li>${esc(a.texto??'Ver esta opción en el dibujo.')}</li>`).join('')}</ol><p class="nota">Registrar resultado propio y opciones válidas antes de abrir el sobre separado.</p><p class="hash">SHA-256 del candidato: ${i.sha256Candidato}</p></article>`).join('');
  write('index.html',`<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Revisión con clave oculta - ${esc(lote.loteId)}</title><style>*{box-sizing:border-box}body{font:17px/1.6 Arial,sans-serif;background:#edf1f5;color:#162e40;margin:0}header{background:white;padding:24px;border-bottom:1px solid #b9c8d1}main{max-width:1000px;padding:24px;margin:auto}h1{font-size:26px}h2{font-size:20px}article{background:white;border:1px solid #bdcbd4;padding:24px;margin-bottom:24px;border-radius:8px}.dibujo{margin:24px 0;padding:16px;border:1px solid #dae2e8;display:flex;justify-content:center}.dibujo img{width:100%;max-width:650px;max-height:340px;object-fit:contain}.nota{font-size:14px;color:#475c6b}.hash{font:11px monospace;overflow-wrap:anywhere}li{padding:6px}a{color:#125780}</style></head><body><header><h1>Revisión con claves ocultas</h1><p>${esc(lote.loteId)} - ${ciego.items.length} candidatos. No aprobados ni publicados.</p><p>Esta vista no incluye clave, justificación ni explicaciones de distractores. La revisión curricular y el contraste se hacen después de registrar las soluciones propias.</p></header><main>${cards}</main></body></html>`);
  write('manifiesto.json',JSON.stringify({formato:'w-simce-manifiesto-local-v1',loteId:lote.loteId,estado:'PREPARADO_PARA_REVISION_NO_APROBADO',
    archivoCandidatoSHA256:shaArchivo(file),revisionCiegaSHA256:shaArchivo(path.join(out,'revision-ciega.json')),sobreRespuestasSHA256:shaArchivo(path.join(out,'sobre-respuestas.json')),
    componenteSHA256:shaArchivo(path.join(repo,'components/figura.tsx')),figuras,
    conexionBase:false,publicado:false,certificaContenido:false,alcance:'Inspección de dibujo y preparación del flujo. Faltan revisión matemática, currículo, duplicados semánticos, tamaño CSS/A4 y dictamen independiente.'},null,2));
  return{directorio:out,items:ciego.items.length,figuras:figuras.length,resultado:control.resultado,conexionBase:false};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{if(!process.argv[2])throw Error('Falta archivo candidato');console.log(JSON.stringify(await preparar(path.resolve(process.argv[2])),null,2));}
  catch(e){console.error(e.message);process.exitCode=1;}
}
