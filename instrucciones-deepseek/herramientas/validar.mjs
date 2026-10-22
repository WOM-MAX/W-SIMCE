// Controles locales de contrato; no es un comprobador matemático.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url));
export const esquema=JSON.parse(fs.readFileSync(path.join(here,'../esquema-lote.json'),'utf8'));
export const normalizar=t=>String(t??'').normalize('NFD').replace(/\p{M}/gu,'').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
const canonical=v=>Array.isArray(v)?v.map(canonical):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,canonical(v[k])])):v;
export const hash=v=>crypto.createHash('sha256').update(JSON.stringify(canonical(v))).digest('hex');
const igual=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
function tipo(v,t){return t==='null'?v===null:t==='array'?Array.isArray(v):t==='object'?v!==null&&typeof v==='object'&&!Array.isArray(v):t==='integer'?Number.isInteger(v):t==='number'?typeof v==='number'&&Number.isFinite(v):typeof v===t;}
export function revisarEsquema(v,s=esquema,ruta='$',root=esquema){
  const errs=[];
  if(s.$ref){const ref=s.$ref.split('/').slice(1).reduce((a,k)=>a[k],root);return revisarEsquema(v,ref,ruta,root);}
  if(s.anyOf){if(!s.anyOf.some(a=>revisarEsquema(v,a,ruta,root).length===0))errs.push(`${ruta}: no corresponde a ninguna forma admitida`);return errs;}
  if('const'in s&&!igual(v,s.const))errs.push(`${ruta}: se exige ${JSON.stringify(s.const)}`);
  if(s.enum&&!s.enum.some(x=>igual(x,v)))errs.push(`${ruta}: valor no admitido`);
  if(s.type&&![s.type].flat().some(t=>tipo(v,t))){errs.push(`${ruta}: tipo incorrecto`);return errs;}
  if(typeof v==='string'){
    if(s.minLength!==undefined&&v.trim().length<s.minLength)errs.push(`${ruta}: texto insuficiente`);
    if(s.maxLength!==undefined&&v.length>s.maxLength)errs.push(`${ruta}: texto demasiado largo`);
    if(s.pattern&&!new RegExp(s.pattern).test(v))errs.push(`${ruta}: patrón no admitido`);
  }
  if(typeof v==='number'&&(s.minimum!==undefined&&v<s.minimum||s.maximum!==undefined&&v>s.maximum))errs.push(`${ruta}: número fuera de rango`);
  if(Array.isArray(v)){
    if(s.minItems!==undefined&&v.length<s.minItems||s.maxItems!==undefined&&v.length>s.maxItems)errs.push(`${ruta}: cantidad de elementos incorrecta`);
    if(s.items)v.forEach((e,n)=>errs.push(...revisarEsquema(e,s.items,`${ruta}[${n}]`,root)));
  }else if(v!==null&&typeof v==='object'){
    for(const k of s.required??[])if(!Object.hasOwn(v,k))errs.push(`${ruta}.${k}: falta campo`);
    for(const k of Object.keys(v))if(s.properties?.[k])errs.push(...revisarEsquema(v[k],s.properties[k],`${ruta}.${k}`,root));else if(s.additionalProperties===false)errs.push(`${ruta}.${k}: campo no admitido`);
  }
  return errs;
}
const specific={rect:['x','y','w','h'],line:['x1','y1','x2','y2'],circle:['cx','cy','r'],poly:['puntos','cerrado'],path:['d'],text:['x','y','texto','tam','anclaje']};
const extras={text:['ancho','negrita']};
const comunes=['op','grosor','gris','punteada','relleno','grisRelleno'];
function equivalenciaSimple(t){
  // Solo opciones numéricas aisladas. No evalúa expresiones ni ejecuta código.
  const m=String(t).trim().match(/^(\d+)(?:\s*\/\s*(\d+)|([,.])(\d+))?\s*([a-zA-Z²³]*)$/);
  if(!m)return null;let n=BigInt(m[1]),d=1n;
  if(m[2]){d=BigInt(m[2]);if(!d)return null;}
  else if(m[4]){d=10n**BigInt(m[4].length);n=n*d+BigInt(m[4]);}
  let a=n,b=d;while(b)[a,b]=[b,a%b];return `${n/a}/${d/a}:${m[5].toLowerCase()}`;
}
export function validar(lote,{banco=null}={}){
  const errores=revisarEsquema(lote),advertencias=[];
  if(errores.length)return{resultado:'RECHAZADO_POR_CONTROLES_AUTOMATICOS',errores,advertencias,certificaContenido:false};
  const codes=new Set(),firmas=new Set();
  for(const it of lote.items){
    const p=it.codigoLocal;
    if(codes.has(p))errores.push(`${p}: código repetido`);codes.add(p);
    if(it.alternativas.map(a=>a.letra).join('')!=='ABCD')errores.push(`${p}: se exigen A,B,C,D en orden`);
    for(const a of it.alternativas)if(a.letra===it.clavePropuesta?a.errorEsperado!==null:!a.errorEsperado)errores.push(`${p}/${a.letra}: explicación de distractor incompatible con clave propuesta`);
    const nulos=it.alternativas.filter(a=>a.texto===null).length;
    if(nulos!==0&&nulos!==4)errores.push(`${p}: no mezclar opciones null y textuales`);
    if(it.necesitaFigura!==(it.figura!==null))errores.push(`${p}: necesitaFigura y figura no coinciden`);
    if(it.figura===null&&it.modeloGeometrico!==null)errores.push(`${p}: modelo geométrico sin figura`);
    if(nulos===4&&!it.figura)errores.push(`${p}: opciones gráficas sin figura`);
    if(!nulos){
      const textos=it.alternativas.map(a=>normalizar(a.texto));if(new Set(textos).size!==4)errores.push(`${p}: alternativas textuales repetidas`);
      const nums=it.alternativas.map(a=>equivalenciaSimple(a.texto)).filter(Boolean);
      if(new Set(nums).size<nums.length)advertencias.push(`${p}: hay opciones numéricamente equivalentes; comprobar significado y unicidad`);
    }
    try{const u=new URL(it.oa.fuente);if(u.protocol!=='https:'||!['www.curriculumnacional.cl','curriculumnacional.cl','aprendoenlinea.mineduc.gob.cl','bibliotecadigital.mineduc.cl'].includes(u.hostname)||u.username||u.password)throw Error();}
    catch{errores.push(`${p}: referencia OA fuera de los dominios oficiales admitidos o URL inválida`);}
    if(it.figura){
      const f=it.figura;
      if(it.modeloGeometrico===null)advertencias.push(`${p}: falta evidencia geométrica explícita; revisar correspondencia del dibujo`);
      for(const [n,e] of f.elementos.entries()){
        const tag=`${p}/elemento${n}`;
        for(const k of specific[e.op])if(!Object.hasOwn(e,k))errores.push(`${tag}: falta ${k}`);
        for(const k of Object.keys(e))if(![...comunes,...specific[e.op],...(extras[e.op]??[])].includes(k))errores.push(`${tag}: ${k} no pertenece a la operación ${e.op}`);
        const pts=e.op==='rect'?[[e.x,e.y],[e.x+e.w,e.y+e.h]]:e.op==='line'?[[e.x1,e.y1],[e.x2,e.y2]]:e.op==='circle'?[[e.cx-e.r,e.cy-e.r],[e.cx+e.r,e.cy+e.r]]:e.op==='poly'?e.puntos:e.op==='text'?[[e.x,e.y]]:[];
        if(pts.some(([x,y])=>!Number.isFinite(x)||!Number.isFinite(y)||x<0||y<0||x>f.ancho||y>f.alto))errores.push(`${tag}: coordenadas fuera del lienzo`);
        if(e.op==='path')advertencias.push(`${tag}: recorrido path requiere comprobación de límites y dibujo; no se analiza aquí su geometría`);
        if(e.op==='text'&&(e.tam<10||e.y<e.tam))advertencias.push(`${tag}: revisar tamaño o margen superior del texto en el render`);
      }
      if(nulos===4)for(const letter of ['A','B','C','D'])if(f.elementos.filter(e=>e.op==='text'&&e.texto.trim()===letter).length!==1)errores.push(`${p}: debe haber exactamente un rótulo ${letter} en las opciones gráficas`);
    }
    const firma=hash([normalizar(it.enunciado),it.alternativas.map(a=>normalizar(a.texto)),it.figura]);
    if(firmas.has(firma))errores.push(`${p}: candidato duplicado en el lote`);firmas.add(firma);
    if(banco){
      const existentes=(banco.items??[]).filter(i=>i.asignatura?.codigo==='matematica');
      for(const old of existentes){
        if(old.codigo===p)errores.push(`${p}: código existente en la instantánea`);
        for(const version of old.versiones??[]){
          const enunciado=normalizar(version.enunciado);
          if(enunciado===normalizar(it.enunciado))advertencias.push(`${p}: enunciado igual al de ${old.codigo}; comprobar figura y variantes`);
          else{
            const a=new Set(normalizar(it.enunciado).split(' ')),b=new Set(enunciado.split(' '));
            const inter=[...a].filter(x=>b.has(x)).length,union=new Set([...a,...b]).size;
            if(union&&inter/union>=.82)advertencias.push(`${p}: texto próximo a ${old.codigo}; similitud léxica, no dictamen de duplicación semántica`);
          }
        }
      }
    }
  }
  return{resultado:errores.length?'RECHAZADO_POR_CONTROLES_AUTOMATICOS':'CONTROLES_AUTOMATICOS_SUPERADOS_NO_APROBADO',items:lote.items.length,errores,advertencias:[...new Set(advertencias)],certificaContenido:false};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{
    const file=process.argv[2];if(!file)throw Error('Falta archivo candidato');
    const bankArg=process.argv.find(a=>a.startsWith('--banco='));
    const banco=bankArg?JSON.parse(fs.readFileSync(bankArg.slice(8),'utf8')):null;
    const r=validar(JSON.parse(fs.readFileSync(file,'utf8')),{banco});console.log(JSON.stringify(r,null,2));process.exitCode=r.errores.length?1:0;
  }catch(e){console.error(JSON.stringify({resultado:'ERROR_DE_LECTURA_O_CONTRATO',mensaje:e.message}));process.exitCode=1;}
}
