// Registro de la aprobación explícita del usuario; no accede a PostgreSQL.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { hashArchivo } from './componente.mjs';
const out=path.resolve('tmp-figuras/codex-4b/2026-10-21T20-41-46-545Z/revision/lote-02');
const indice=JSON.parse(fs.readFileSync(path.join(out,'indice.json'),'utf8'));
const excluida='FIG-4B-MAT-GEO-F3-002-FUENTE';
assert.equal(indice.length,44);assert.equal(indice.filter(p=>p.codigo===excluida).length,1);
const backup=path.join(out,'antes-ajuste-fuente');
fs.mkdirSync(backup,{recursive:true});
for(const file of ['indice.json','muestras-a4.pdf',excluida+'.json','INFORME-LOTE-02.md','verificacion.json','fuentes.json'])fs.copyFileSync(path.join(out,file),path.join(backup,file),fs.constants.COPYFILE_EXCL);
for(const ext of ['png','svg'])fs.copyFileSync(path.join(out,'figuras',excluida+'-despues.'+ext),path.join(backup,excluida+'-despues.'+ext),fs.constants.COPYFILE_EXCL);
const r={fechaRegistro:new Date().toISOString(),mensajeUsuario:'Las imagenes quedaron bien, excepto esta por el color de la fuente.',
  estado:'43_FIGURAS_APROBADAS_VISUALMENTE_1_EXCLUIDA',
  alcance:'Aprobación de diseño y tamaño de las 43 propuestas restantes del lote 2. No autoriza aplicación en base, enlaces ni aprobación pedagógica.',
  pdfRevisadoSHA256:hashArchivo(path.join(out,'muestras-a4.pdf')),
  figuras:indice.filter(p=>p.codigo!==excluida).map(p=>({codigo:p.codigo,figuraId:p.figuraId,despuesSHA256:p.despuesSHA256,pngSHA256:hashArchivo(path.join(out,'figuras',p.codigo+'-despues.png'))})),
  excluida:{codigo:excluida,despuesSHA256:indice.find(p=>p.codigo===excluida).despuesSHA256,motivo:'Contraste del relleno de la fuente respecto a los otros lugares.'},
  perfil:'Implementación local y revisión; se conserva el esfuerzo alto solicitado. Selector exacto de modelo no verificable. Sin subagentes.',
  aplicadoEnOriginal:false};
fs.writeFileSync(path.join(out,'aprobacion-visual-parcial.json'),JSON.stringify(r,null,2),{flag:'wx'});
console.log(JSON.stringify({aprobadas:r.figuras.length,excluida,backup,conexionBase:false}));
