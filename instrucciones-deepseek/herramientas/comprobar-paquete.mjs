// Verificación local de instrucciones y recursos. Solo lectura, sin red ni BD.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {validar} from './validar.mjs';
import {paraRevisionCiega} from './preparar.mjs';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'..');
const repo=path.resolve(root,'..');
const errores=[];
let enlaces=0,skills=0;
const check=(cond,message)=>{if(!cond)errores.push(message);};
const json=rel=>JSON.parse(fs.readFileSync(path.join(root,rel),'utf8'));
const files=[];
function recorrer(dir){
  for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
    if(entry.name==='entregas'||entry.name==='candidatos')continue;
    const full=path.join(dir,entry.name);
    if(entry.isSymbolicLink()){errores.push('Enlace simbólico no inspeccionado: '+full);continue;}
    if(entry.isDirectory())recorrer(full);else files.push(full);
  }
}
try{
  recorrer(root);
  for(const rel of ['EMPIEZA-AQUI.md','METODO.md','AGENTS.md','DEPENDENCIAS.md',
    'plantillas/encargo.json','plantillas/resolucion-ciega.json','plantillas/dictamen.json',
    'skills/simce-generar-candidatos/SKILL.md','skills/simce-construir-figuras/SKILL.md','skills/simce-revisar-integridad/SKILL.md']){
    check(fs.existsSync(path.join(root,rel)),'Falta '+rel);
  }
  for(const full of files.filter(f=>f.endsWith('.md'))){
    const content=fs.readFileSync(full,'utf8');
    for(const match of content.matchAll(/\[[^\]\n]+\]\(([^)\n]+)\)/g)){
      const href=match[1].trim().replace(/^<|>$/g,'');
      if(/^(https?:|mailto:|#)/i.test(href))continue;
      const target=path.resolve(path.dirname(full),decodeURIComponent(href.split('#')[0]));
      const relative=path.relative(repo,target);
      check(relative!== '..'&&!relative.startsWith('..'+path.sep)&&!path.isAbsolute(relative),'Referencia fuera del proyecto: '+href);
      check(fs.existsSync(target),'Enlace local roto en '+path.relative(root,full)+': '+href);
      enlaces++;
    }
    if(path.basename(full)==='SKILL.md'){
      skills++;
      const header=content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
      check(Boolean(header),'Falta cabecera de skill: '+full);
      if(header){
        const name=header[1].match(/^name:\s*([a-z0-9-]+)\s*$/m)?.[1];
        check(name===path.basename(path.dirname(full)),'Nombre de skill no coincide con carpeta: '+full);
        check(/^description:\s*\S.+$/m.test(header[1]),'Falta descripción de skill: '+full);
      }
    }
  }
  check(skills===3,'Se esperaban tres skills');
  const schema=json('esquema-lote.json'),encargo=json('plantillas/encargo.json');
  const ejes=schema.$defs.item.properties.eje.enum;
  check(Object.keys(encargo.distribucionPropuesta).every(e=>ejes.includes(e)),'Ejes de plantilla ajenos al contrato');
  check(Object.values(encargo.distribucionPropuesta).reduce((a,b)=>a+b,0)===encargo.cantidadPropuesta,'Cantidad de encargo no coincide con distribución');
  check(encargo.evidenciaEncargoUsuario===null&&encargo.estado==='PROPUESTO_PENDIENTE_DE_ENCARGO','Plantilla de encargo aparece ejecutada');
  for(const rel of ['plantillas/encargo.json','plantillas/resolucion-ciega.json','plantillas/dictamen.json']){
    check(json(rel).publicacionAutorizada===false,'Plantilla habilita publicación: '+rel);
  }
  const dictamen=json('plantillas/dictamen.json');
  check(dictamen.tipo==='plantilla-dictamen-no-emitido'&&dictamen.sha256Candidato===null,'Plantilla parece dictamen emitido');
  check(Object.values(dictamen.criterios).every(c=>c.estado==='pendiente'&&c.evidencia===null),'Criterio de plantilla aparece aprobado');
  const ejemplo=json('ejemplos/lote-ejemplo.json');
  check(validar(ejemplo).errores.length===0,'Ejemplo no cumple el contrato');
  const ciego=JSON.stringify(paraRevisionCiega(ejemplo));
  for(const campo of ['clavePropuesta','justificacionPropuesta','errorEsperado','modeloGeometrico']){
    check(!ciego.includes('"'+campo+'"'),'Campo de respuestas presente en revisión ciega: '+campo);
  }
  for(const rel of ['components/figura.tsx','lib/texto.ts','scripts/codex-4b/componente.mjs']){
    check(fs.existsSync(path.join(repo,rel)),'Dependencia del renderer ausente: '+rel);
  }
}catch(error){errores.push(error.message);}

console.log(JSON.stringify({resultado:errores.length?'FALLOS_EN_PAQUETE':'PAQUETE_LOCAL_VERIFICADO',
  archivosInspeccionados:files.length,enlacesLocalesComprobados:enlaces,skills,errores,
  alcance:'Archivos y controles locales; no prueba ejecución de DeepSeek ni calidad pedagógica futura',
  conexionBase:false,ejecucionDeepSeek:false},null,2));
if(errores.length)process.exitCode=1;
