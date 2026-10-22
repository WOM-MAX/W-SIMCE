// Registro documental de la aprobación explícita. Sin conexión a base.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
const out=path.resolve('tmp-figuras/codex-4b/2026-10-21T20-41-46-545Z/revision/lote-03');
const hash=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const sha=v=>crypto.createHash('sha256').update(JSON.stringify(v)).digest('hex');
const ix=JSON.parse(fs.readFileSync(path.join(out,'indice.json'),'utf8'));
const v=JSON.parse(fs.readFileSync(path.join(out,'verificacion.json'),'utf8'));
assert.equal(ix.length,6);
assert.equal(hash(path.join(out,'muestras-a4.pdf')),v.pdfSHA256);
assert.equal(hash(path.join(out,'copia-propuesta-4b-lote-03.json')),v.copiaPropuestaSHA256);
const figuras=ix.map(r=>{
  const p=JSON.parse(fs.readFileSync(path.join(out,r.codigo+'.json'),'utf8'));
  assert.equal(sha(p.despues),r.despuesSHA256);
  return{codigo:r.codigo,figuraId:r.figuraId,despuesSHA256:r.despuesSHA256,pngSHA256:hash(path.join(out,'figuras',r.codigo+'-despues.png'))};
});
const registro={fechaConfirmacion:'2026-10-22',mensajeUsuario:'las figuras estan aprobadas',estado:'LOTE_03_APROBADO_VISUALMENTE',
  alcance:'Diseño y tamaño de las seis figuras del lote 3: cinco juegos A-D y una flecha.',
  noIncluye:['Validación completa de contenido','Cambio de claves, enunciados, alternativas o estados','Enlaces de recursos','Aplicación en base original'],
  figuras,pdfRevisadoSHA256:v.pdfSHA256,copiaRevisadaSHA256:v.copiaPropuestaSHA256,
  alertaContenidoPendiente:'GEO-F3-005: referencia en la justificación a una casilla de columna 2 no pintada.',
  nuevosEnlaces:0,aplicadoEnBaseOriginal:false};
fs.writeFileSync(path.join(out,'aprobacion-visual.json'),JSON.stringify(registro,null,2),{flag:'wx'});
const guardado=JSON.parse(fs.readFileSync(path.join(out,'aprobacion-visual.json'),'utf8'));
assert.equal(guardado.figuras.length,6);assert.equal(guardado.aplicadoEnBaseOriginal,false);
console.log(JSON.stringify({estado:guardado.estado,figuras:guardado.figuras.length,baseNoConsultada:true}));
