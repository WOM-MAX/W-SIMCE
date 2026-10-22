// Genera una revisión autónoma desde snapshot.json. No importa Prisma ni conecta a red.
import fs from 'node:fs';
import path from 'node:path';
import { renderizar, svgReal, pngDeSvg, hashArchivo, partirConPotencia } from './componente.mjs';

const archivo = path.resolve(process.argv[2] ?? '');
if (!archivo.endsWith('snapshot.json')) throw new Error('Indica snapshot.json');
const s = JSON.parse(fs.readFileSync(archivo, 'utf8'));
const soloHojas = process.argv.includes('--solo-hojas');
const base = path.dirname(archivo);
for (const f of ['components/figura.tsx', 'lib/texto.ts']) {
  if (s.fuentes[f] !== hashArchivo(f)) throw new Error('Cambió el componente desde la exportación: ' + f);
}
const out = path.join(base, 'revision');
fs.mkdirSync(path.join(out, 'figuras'), { recursive: true });
const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const texto = v => partirConPotencia(String(v ?? '')).map(t => t.supra ? `<sup>${esc(t.texto)}</sup>` : esc(t.texto)).join('');
const porId = new Map(s.figuras.map(f => [f.id, f]));
const huerfanas = s.figuras.filter(f => !f.items.length);
const candidato = f => s.items.find(i => i.codigo === f.codigo.replace(/^FIG-/, '').split('-').slice(0, 4).join('-'));
const porCandidato = new Map(huerfanas.map(f => [candidato(f)?.codigo, f]));
const dibujos = new Map();
const problemas = [];
for (const f of s.figuras) {
  dibujos.set(f.codigo, soloHojas ? svgReal(f.primitivas) : renderizar(f.primitivas, path.join(out, 'figuras', f.codigo)));
  for (const [indice, e] of (f.primitivas.elementos ?? []).entries()) {
    if (e.op === 'poly' && !Array.isArray(e.puntos)) problemas.push({ figura: f.codigo, indice, tipo: 'poligono_sin_coordenadas_array', valor: e.puntos });
    if (e.op === 'text' && Number(e.y) < Number(e.tam ?? 8)) problemas.push({ figura: f.codigo, indice, tipo: 'posible_corte_superior_texto', y: e.y, tam: e.tam, texto: e.texto });
  }
}
function hoja(figs, nombre, titulo) {
  const w = 1800, cw = 870, ch = 395, filas = Math.ceil(figs.length / 2), h = 85 + filas * ch;
  let cuerpo = `<rect width="${w}" height="${h}" fill="white"/><text x="30" y="40" font-family="Arial" font-size="26" text-anchor="start">${esc(titulo)}</text><text x="30" y="67" font-family="Arial" font-size="17" text-anchor="start">Vista del componente real · copia local · pendiente de aprobación</text>`;
  figs.forEach((f, n) => {
    const x = 20 + (n % 2) * 890, y = 85 + Math.floor(n / 2) * ch;
    cuerpo += `<rect x="${x}" y="${y}" width="${cw}" height="${ch - 12}" fill="white" stroke="#bbb"/>`;
    cuerpo += `<text x="${x + 15}" y="${y + 30}" font-family="Arial" font-size="20" text-anchor="start">${esc(f.codigo)}</text>`;
    const png = fs.readFileSync(path.join(out, 'figuras', f.codigo + '.png')).toString('base64');
    cuerpo += `<image x="${x + 15}" y="${y + 48}" width="${cw - 30}" height="${ch - 85}" preserveAspectRatio="xMidYMid meet" href="data:image/png;base64,${png}"/>`;
  });
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">${cuerpo}</svg>`;
  const etiqueta = nombre + (soloHojas ? '-rotulada' : '');
  fs.writeFileSync(path.join(out, etiqueta + '.svg'), svg, { flag: soloHojas ? 'w' : 'wx' });
  fs.writeFileSync(path.join(out, etiqueta + '.png'), pngDeSvg(svg, w), { flag: soloHojas ? 'w' : 'wx' });
}
for (let n = 0; n < huerfanas.length; n += 8) hoja(huerfanas.slice(n, n + 8), `huerfanas-${1 + n / 8}`, `4° básico · Figuras sin enlace · hoja ${1 + n / 8}`);
const activasMat = s.figuras.filter(f => f.items.some(u => s.items.some(i => i.id === u.id && i.estado === 'APROBADO' && i.asignatura.codigo === 'matematica')));
for (let n = 0; n < activasMat.length; n += 8) hoja(activasMat.slice(n, n + 8), `matematica-${String(1 + n / 8).padStart(2, '0')}`, `4° básico · Matemática · hoja ${1 + n / 8}`);
const lectura = s.figuras.filter(f => f.items.some(u => s.items.some(i => i.id === u.id && i.asignatura.codigo === 'lectura')));
for (let n = 0; n < lectura.length; n += 8) hoja(lectura.slice(n, n + 8), `lectura-${1 + n / 8}`, `4° básico · Lectura · hoja ${1 + n / 8}`);
if (soloHojas) { console.log('Hojas rotuladas generadas desde la misma copia.'); process.exit(0); }

const tarjetas = [...s.items].sort((a,b) => Number(porCandidato.has(b.codigo)) - Number(porCandidato.has(a.codigo)) || a.codigo.localeCompare(b.codigo)).map(i => {
  const v = i.versiones[0], f = porId.get(i.figuraId) ?? porCandidato.get(i.codigo);
  const hu = !i.figuraId && Boolean(f);
  const img = f ? `<div class="figura-box"><img src="figuras/${esc(f.codigo)}.png" alt="${esc(f.codigo)}" loading="lazy"></div><p class="meta">${esc(f.codigo)} · Lienzo ${f.primitivas.ancho} × ${f.primitivas.alto} · <a href="figuras/${esc(f.codigo)}.png" target="_blank" rel="noopener">Ampliar PNG</a> · <a href="figuras/${esc(f.codigo)}.svg" target="_blank" rel="noopener">SVG</a></p>` : '<p class="sinfigura">Sin figura asociada ni candidata en este lote. Esto por sí solo no indica un defecto.</p>';
  return `<article data-codigo="${esc(i.codigo)}" data-materia="${i.asignatura.codigo}" data-estado="${i.estado}" data-recurso="${hu ? 'huerfana' : f ? 'figura' : 'sinfigura'}" id="${esc(i.codigo)}"><header><h2>${esc(i.codigo)}</h2><span>${esc(i.asignatura.nombre)} · ${esc(i.estado)}</span></header><p class="meta">${esc(i.eje.nombre)} · ${esc(i.objetivo?.codigo ?? 'Sin OA asignado')} · Versión ${v?.version ?? 'sin versión'}</p>${hu ? '<p class="aviso">Figura candidata sin enlace: esta asociación solo se muestra para revisión. La base sigue sin enlace.</p>' : ''}<p class="enunciado">${texto(v?.enunciado)}</p>${img}<ol class="alternativas">${(v?.alternativas ?? []).map(a => `<li><b>${esc(a.letra)}.</b> ${a.texto === null ? '<em>Opción gráfica: comprobar dibujo y rótulo.</em>' : texto(a.texto)}</li>`).join('')}</ol>${i.texto ? `<details><summary>Texto de lectura: ${esc(i.texto.titulo)}</summary><p class="enunciado">${texto(i.texto.cuerpo)}</p><p>${esc(i.texto.fuente)}</p></details>` : ''}<details><summary>Clave y justificación guardadas</summary><p><b>Clave: ${esc(v?.clave)}</b></p><p>${texto(v?.justificacion)}</p><p>Referencias guardadas: ${(v?._count.ensayoItems ?? 0)} en ensayos y ${(v?._count.intentoItems ?? 0)} en intentos. No se exportan datos personales.</p></details><div class="revision"><label>Tu decisión <select data-decision><option value="pendiente">Pendiente</option><option>Aprobar</option><option>Corregir tamaño</option><option>Corregir posición</option><option>Rehacer</option><option>Figura equivocada</option><option>No enlazar</option></select></label><label>Observación <textarea data-nota rows="2" placeholder="Describe la falla que ves"></textarea></label></div></article>`;
}).join('\n');
const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Revisión de ítems · 4° básico</title><style>
*{box-sizing:border-box}body{margin:0;background:#eef2f6;color:#172635;font:16px/1.5 Arial,sans-serif}main,.barra{max-width:1080px;margin:auto;padding:20px}h1{font-size:27px;margin:0}h2{font-size:19px;margin:0}p{margin:12px 0}.barra{position:sticky;top:0;background:#fff;border-bottom:2px solid #8da7ba;z-index:2;max-width:none}.controles{display:flex;gap:12px;flex-wrap:wrap;margin-top:12px}.controles label{font-size:14px}select,input,button,textarea{font:inherit;padding:8px;border:1px solid #92a5b3;border-radius:5px}button{cursor:pointer;background:#173c52;color:white}article{background:white;border:1px solid #ccd5dd;border-radius:9px;padding:24px;margin:20px 0;break-inside:avoid}article header{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap}.meta{color:#4c6170;font-size:13px}.aviso{background:#fff2cb;padding:12px;border-left:4px solid #c28800}.enunciado{white-space:pre-wrap}.figura-box{background:#fff;border:1px solid #dde4eb;overflow:auto;padding:16px;text-align:center}.figura-box img{display:block;margin:auto;max-width:100%;height:auto;max-height:none}.alternativas{padding:0;list-style:none}.alternativas li{margin:10px 0}details{border-top:1px solid #dae1e6;padding:12px 0}summary{cursor:pointer}.revision{background:#edf3f7;padding:14px}.revision label{display:block;margin:8px 0}.revision textarea{width:100%}.sinfigura{color:#52606a}[hidden]{display:none!important}.estado-guardado{font-size:13px}a{color:#15547b}@media print{.barra,.revision{display:none}body{background:white}main{max-width:none}article{border:1px solid #bbb;margin:0 0 15px}details{display:block}}
</style></head><body><div class="barra"><h1>Revisión de ítems · 4° básico</h1><p>Copias locales para revisión visual. Las decisiones se descargan como archivo; no se envían a la base.</p><div class="controles"><label>Asignatura <select id="materia"><option value="matematica">Matemática</option><option value="lectura">Lectura</option><option value="">Todas</option></select></label><label>Recurso <select id="recurso"><option value="visual">Con figura o candidata</option><option value="huerfana">16 figuras sin enlace</option><option value="figura">Con figura enlazada</option><option value="sinfigura">Sin figura</option><option value="">Todos</option></select></label><label>Estado <select id="estado"><option value="">Todos</option><option value="APROBADO">Aprobados</option><option value="BORRADOR">Borradores</option><option value="RETIRADO">Retirados</option></select></label><label>Buscar código o texto <input id="buscar" type="search"></label><button id="descargar" type="button">Descargar mis decisiones</button></div><p id="cuenta"></p><p id="guardado" class="estado-guardado"></p></div><main><p>Fuente: instantánea de ${esc(s.fecha)}. Son 486 ítems: 240 aprobados de Matemática, 240 aprobados de Lectura y 6 ítems fuera de aprobación. Esta vista usa PNG del componente real a tamaño ampliable; no reproduce el CSS ni la impresión de la aplicación. Las figuras candidatas siguen sin asociar en la base.</p>${tarjetas}</main><script>
const sha=${JSON.stringify(hashArchivo(archivo))};
const clave='codex-4b-'+sha;
const tarjetas=[...document.querySelectorAll('article')];
const $=id=>document.getElementById(id);
function filtrar(){const q=$('buscar').value.toLocaleLowerCase('es');let n=0;for(const a of tarjetas){const r=$('recurso').value;const ok=(!$('materia').value||a.dataset.materia===$('materia').value)&&(!$('estado').value||a.dataset.estado===$('estado').value)&&(!r||(r==='visual'?a.dataset.recurso!=='sinfigura':a.dataset.recurso===r))&&(!q||a.textContent.toLocaleLowerCase('es').includes(q));a.hidden=!ok;if(ok)n++;}$('cuenta').textContent=n+' ítems visibles';}
function decisiones(){return tarjetas.map(a=>({item:a.dataset.codigo,decision:a.querySelector('[data-decision]').value,observacion:a.querySelector('[data-nota]').value}));}
function guardar(){try{localStorage.setItem(clave,JSON.stringify(decisiones()));$('guardado').textContent='Decisiones guardadas en este navegador. Descarga el archivo para entregarlas.';}catch{$('guardado').textContent='El navegador no permite guardado local. Descarga las decisiones antes de cerrar.';}}
try{const saved=JSON.parse(localStorage.getItem(clave)||'[]');for(const d of saved){const a=tarjetas.find(a=>a.dataset.codigo===d.item);if(a){a.querySelector('[data-decision]').value=d.decision;a.querySelector('[data-nota]').value=d.observacion;}}}catch{}
for(const id of ['materia','recurso','estado','buscar'])$(id).addEventListener('input',filtrar);
document.addEventListener('input',e=>{if(e.target.matches('[data-decision],[data-nota]'))guardar();});
$('descargar').addEventListener('click',()=>{const b=new Blob([JSON.stringify({snapshotSHA256:sha,fecha:new Date().toISOString(),decisiones:decisiones()},null,2)],{type:'application/json'});const u=URL.createObjectURL(b);const a=document.createElement('a');a.href=u;a.download='decisiones-4b.json';a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);});
filtrar();
</script></body></html>`;
const htmlEscalaOriginal = html
  .replace('.figura-box img{display:block;margin:auto;max-width:100%;height:auto;max-height:none}', '.figura-box img{display:block;margin:auto;max-width:none;height:auto;max-height:none}')
  .replace('Ampliar PNG</a>', 'PNG al 100 %</a>')
  .replace('a tamaño ampliable;', 'a escala 1:1 en píxeles; las imágenes anchas se desplazan dentro del recuadro. El tamaño físico impreso requiere imprimir al 100 %;');
fs.writeFileSync(path.join(out, 'index.html'), htmlEscalaOriginal, { flag: 'wx' });
const manifest = { snapshotSHA256: hashArchivo(archivo), fuente: s.fuentes, generadoEn: new Date().toISOString(),
  items: s.items.length, figuras: s.figuras.length, aprobadosMatConFigura: activasMat.length,
  huerfanas: huerfanas.map(f=>({ figura:f.codigo, candidato:candidato(f)?.codigo, estado:candidato(f)?.estado })),
  alertasAutomaticas: problemas,
  archivos: fs.readdirSync(path.join(out,'figuras')).map(nombre=>({ nombre, sha256:hashArchivo(path.join(out,'figuras',nombre)) })),
};
fs.writeFileSync(path.join(out, 'manifest.json'), JSON.stringify(manifest,null,2), { flag: 'wx' });
console.log(JSON.stringify({ galeria:path.join(out,'index.html'), figuras:s.figuras.length,
  huerfanas:huerfanas.length, alertas:problemas.length, hojasMat:Math.ceil(activasMat.length/8) },null,2));
