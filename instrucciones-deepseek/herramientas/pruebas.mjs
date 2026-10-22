import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {validar,hash} from './validar.mjs';
import {paraRevisionCiega} from './preparar.mjs';
const here=path.dirname(fileURLToPath(import.meta.url));
const ejemplo=JSON.parse(fs.readFileSync(path.join(here,'../ejemplos/lote-ejemplo.json'),'utf8'));
let n=0;const run=(name,fn)=>{fn();n++;console.log('OK '+name);};
const rechaza=(edit)=>{const data=structuredClone(ejemplo);edit(data);assert.ok(validar(data).errores.length>0);};
run('Ejemplo admitido por estructura',()=>assert.equal(validar(ejemplo).errores.length,0));
run('Estado APROBADO rechazado',()=>rechaza(d=>d.estado='APROBADO'));
run('Identificador de base rechazado',()=>rechaza(d=>d.items[0].id='uuid-inventado'));
run('Clave fuera de A-D rechazada',()=>rechaza(d=>d.items[0].clavePropuesta='E'));
run('Código repetido rechazado',()=>rechaza(d=>d.items.push(structuredClone(d.items[0]))));
run('Alternativas repetidas rechazadas',()=>rechaza(d=>d.items[0].alternativas[3].texto=' 11 M² '));
run('Opciones null mezcladas rechazadas',()=>rechaza(d=>d.items[0].alternativas[0].texto=null));
run('Opciones visuales sin figura rechazadas',()=>rechaza(d=>{d.items[0].alternativas.forEach(a=>a.texto=null);d.items[0].figura=null;d.items[0].necesitaFigura=false;d.items[0].modeloGeometrico=null;}));
run('Opciones visuales sin A-D rechazadas',()=>rechaza(d=>d.items[0].alternativas.forEach(a=>a.texto=null)));
run('Puntos de polígono como cadena rechazados',()=>rechaza(d=>d.items[0].figura.elementos.push({op:'poly',puntos:'1,1 2,2 3,1',cerrado:true})));
run('Atributo ignorado por renderer rechazado',()=>rechaza(d=>d.items[0].figura.elementos[0].fill='black'));
run('Coordenadas fuera del lienzo rechazadas',()=>rechaza(d=>d.items[0].figura.elementos[0].w=400));
run('Inconsistencia de necesitaFigura rechazada',()=>rechaza(d=>d.items[0].necesitaFigura=false));
run('Opacidad fuera de rango rechazada',()=>rechaza(d=>d.items[0].figura.elementos[0].grisRelleno=2));
run('Fuente ajena a dominio oficial rechazada',()=>rechaza(d=>d.items[0].oa.fuente='https://ejemplo.invalid/oa23'));
run('Campos no correspondientes a op rechazados',()=>rechaza(d=>d.items[0].figura.elementos[0].puntos=[[1,1],[2,2],[3,1]]));
run('Claves y explicaciones ausentes del paquete ciego',()=>{
  const ciego=paraRevisionCiega(ejemplo),string=JSON.stringify(ciego);
  for(const k of ['clavePropuesta','justificacionPropuesta','errorEsperado','modeloGeometrico','justificacionEncaje','dificultadEstimada'])assert.ok(!string.includes('"'+k+'"'));
  assert.equal(ciego.items[0].sha256Candidato,hash(ejemplo.items[0]));
  assert.deepEqual(ciego.items[0].alternativas,ejemplo.items[0].alternativas.map(a=>({letra:a.letra,texto:a.texto})));
});
run('Una clave matemáticamente falsa puede pasar formato: no hay certificación automática',()=>{
  const data=structuredClone(ejemplo),i=data.items[0];i.clavePropuesta='A';i.alternativas[0].errorEsperado=null;i.alternativas[2].errorEsperado='Explicación falsa puesta solo para demostrar el límite del validador.';
  assert.equal(validar(data).errores.length,0);assert.equal(validar(data).certificaContenido,false);
});
run('Equivalencias numéricas generan advertencia',()=>{
  const d=structuredClone(ejemplo);d.items[0].alternativas[0].texto='1/2';d.items[0].alternativas[1].texto='0,5';assert.ok(validar(d).advertencias.some(a=>a.includes('equivalentes')));
});
run('Aviso de enunciado repetido en banco local',()=>{
  const banco={items:[{codigo:'PRUEBA-LOCAL',asignatura:{codigo:'matematica'},versiones:[{enunciado:ejemplo.items[0].enunciado}]}]};assert.ok(validar(ejemplo,{banco}).advertencias.some(a=>a.includes('igual')));
});
console.log(JSON.stringify({pruebas:n,resultado:'TODAS_SUPERADAS',conexionBase:false,certificaContenido:false}));
