import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const base=path.resolve('tmp-figuras/codex-4b/2026-10-21T20-41-46-545Z'),out=path.join(base,'revision/lote-02');
const read=f=>JSON.parse(fs.readFileSync(f,'utf8'));
const s=read(path.join(base,'copia-trabajo-4b-lote-01.json')),indice=read(path.join(out,'indice.json')),v=read(path.join(out,'verificacion.json'));
const sinOpciones=['FIG-4B-MAT-GEO-003-CUERPO','FIG-4B-MAT-GEO-F2-007-BANDERA','FIG-4B-MAT-GEO-F3-003-VISTAS','FIG-4B-MAT-GEO-F3-005-MITAD','FIG-4B-MAT-GEO-F3-007-ORIGINAL'];
const pendientes=sinOpciones.map(codigo=>({codigo,tipo:'FALTAN_ALTERNATIVAS_GRAFICAS',motivo:'El enunciado pide elegir entre cuatro dibujos; el render no incluye las cuatro opciones A-D. Los textos null son intencionales y no se modifican.',bloqueo:'Requiere diseñar y comprobar las alternativas visuales; conservar el estado BORRADOR y la clave. No publicar ni enlazar como reparación suficiente.'}));
pendientes.push({codigo:'FIG-4B-MAT-PAT-006-RECTA',tipo:'AJUSTE_GRAFICO_PENDIENTE',motivo:'La punta de flecha está separada del extremo del arco +6. El texto y los valores no se deben cambiar.'});
const inventario=s.figuras.map(f=>({codigo:f.codigo,id:f.id,usosActuales:f.items.map(i=>i.codigo),sinEnlace:f.items.length===0,estado:s.trabajoLocal.figurasCorregidas.includes(f.codigo)?'LOTE_01_VISUAL_APROBADO':indice.some(r=>r.figuraId===f.id)?'LOTE_02_PROPUESTA_PENDIENTE':sinOpciones.includes(f.codigo)?'FALTAN_OPCIONES_VISUALES':f.codigo==='FIG-4B-MAT-PAT-006-RECTA'?'AJUSTE_GRAFICO_PENDIENTE':'SIN_PROPUESTA_EN_ESTA_ENTREGA'}));
const aprobacionPath=path.join(out,'aprobacion-visual-parcial.json');
if(fs.existsSync(aprobacionPath)){
  const a=read(aprobacionPath);
  for(const f of inventario)if(a.figuras.some(p=>p.codigo===f.codigo))f.estado='LOTE_02_VISUAL_APROBADO';
}
const grupos={};for(const f of inventario)grupos[f.estado]=(grupos[f.estado]??0)+1;
assert.equal(Object.values(grupos).reduce((a,b)=>a+b,0),132);
fs.writeFileSync(path.join(out,'inventario-grafico-4b.json'),JSON.stringify({conteos:grupos,figuras:inventario,pendientes,advertencia:'Sin propuesta no significa validación pedagógica ni aprobación visual definitiva.'},null,2));
const rows=indice.map(r=>`| ${r.codigo} | ${r.usosActuales.join(', ')} | ${r.familia} | ${r.motivo} |`).join('\n');
const small=read(path.join(out,'qa-pantalla.json')).filter(r=>r.ventana===390).sort((a,b)=>a.minTextoPx-b.minTextoPx).slice(0,5);
const nota=`# 4° básico: lote gráfico 2

## Resultado y alcance

44 propuestas: 39 figuras de Matemática y 5 de Lectura, utilizadas por 50 ítems. El usuario aprobó visualmente 43 y excluyó el contraste de la fuente de GEO-F3-002. Ese contraste se ajustó y queda pendiente de revisión. Se conservan las 12 figuras del lote 1 aprobadas por el usuario. El registro de aprobación parcial conserva los hashes revisados.

[Abrir el visor único de revisión](index.html). Incluye antes/después, todos los enunciados que comparten cada figura, selección de ventana de 390/768/1280 px CSS y descarga de decisiones. Las comparaciones están ampliadas; el visor CSS y las hojas A4 son las referencias de tamaño. Las decisiones no disparan escrituras.

[Muestras impresas A4](muestras-a4.pdf): 44 páginas, una figura por página con uno de sus ítems. Si la figura es compartida, los otros usos están disponibles en el visor. Imprimir al 100 %, sin ajuste a página; comprobar la línea de referencia de 5 cm.

Se trabajó exclusivamente con JSON local. No se abrió conexión a PostgreSQL, no se consultó ni modificó el servidor 3005 y no se ejecutó git. La copia aprobada del lote 1 y la instantánea original conservan sus hashes. No se cambiaron ítems, versiones, claves, alternativas, textos de lectura ni enlaces. No se creó una base PostgreSQL de pruebas.

## Comprobaciones

- 44 propuestas, cada una con PNG/SVG antes y después y diff JSON con pruebas del valor anterior.
- ${v.reemplazosProbados} reemplazos de campos permitidos reproducidos y verificados sobre objetos temporales en memoria.
- ${v.rendersComprobados} archivos de dibujo comprobados.
- ${v.htmlComprobados} HTML con scripts analizados y enlaces locales comprobados.
- 44 figuras medidas en navegador: cero textos fuera del lienzo y cero textos fuera de las celdas delimitadas para tablas y planos.
- 132 mediciones de pantalla: cero desbordes horizontales de página en las ventanas medidas.
- 44 hojas A4: sin desbordes de contenido; PDF con 44 páginas A4, convertido a PNG para inspección.
- Barras: conservan anchos, alturas, cantidades y rellenos. Planos: conservan la cuadrícula, los recintos y las ubicaciones; la fuente B2 incorpora una banda gris oscura interior, sin mover ni cambiar las letras. El formato admite gris en el trazo, mientras que grisRelleno solo controla la opacidad del relleno fijo. Tablas: conservan todos los textos, su orden y número de filas. Pictograma: conserva 6, 4, 3 y 6 vasos más el símbolo de la leyenda. Palitos: los dibujos tienen 4, 7 y 10 segmentos.

La medición de cajas de texto y la ausencia de desbordes no equivalen a aprobación de legibilidad ni a validación pedagógica. Las muestras reproducen las clases CSS capturadas de la app, pero no una sesión real conectada a una base de pruebas.

## Tamaño y límite de presentación

Se aumentaron los números de los ejes y los rótulos de los planos tras detectar texto pequeño en la primera medición. Con las propuestas finales, el texto más pequeño medido en impresión es ${v.minTextoImpresoPt.toFixed(2)} pt. En ventana de 390 px el mínimo medido es ${v.minTextoMovilPx.toFixed(2)} px CSS. El tamaño móvil sigue pendiente de revisión de legibilidad: no se declara resuelto por no desbordar.

Casos con menor tamaño móvil:

| Figura | Texto mínimo (px CSS) |
|---|---:|
${small.map(r=>`| ${r.codigo} | ${r.minTextoPx.toFixed(2)} |`).join('\n')}

El diseño del dato se corrigió dentro de las primitivas. La app sigue reduciendo el SVG para ajustarlo al ancho disponible y a sus altos máximos. DeepSeek debe evaluar presentación ampliable y tratamiento de figuras con mucho texto, tanto en móvil como en impresión. Ese trabajo no se ha aplicado aquí.

## Pendientes gráficos separados del lote

${pendientes.map(p=>`- **${p.codigo}**: ${p.motivo}`).join('\n')}

Los cinco casos de opciones faltantes corresponden a ítems BORRADOR. GEO-005 también es BORRADOR, pero su figura huérfana sí contiene A-D y ya fue comprobada en el anexo; no se incluye entre los cinco incompletos. Ninguno se publica ni se cambia de estado. Las 16 figuras sin enlace permanecen sin enlace en la copia.

## Corrección del informe anterior

Corrección: Anteriormente hice una afirmación no verificada. Eso fue incorrecto y debería haber sido etiquetado.

El informe inicial incluyó GEO-004 y GEO-F2-004 entre los rótulos A/B pegados. La inspección de sus PNG individuales muestra rótulos separados y legibles. Se retira ese hallazgo y no se modifican esas figuras. Las hojas compuestas no se usan como única evidencia de un defecto.

## Inventario y revisión de contenido

El inventario de 132 figuras distingue: 12 aprobadas visualmente en lote 1, 43 aprobadas visualmente en lote 2, 1 ajuste de contraste pendiente de revisión, 5 con opciones visuales faltantes, 1 con ajuste de flecha pendiente y 70 sin propuesta en esta entrega. Este último grupo no equivale a aprobación pedagógica ni certificación de ausencia de defectos.

La auditoría semántica completa de los 486 ítems aún no está terminada. La existencia estructural de la clave no comprueba que sea correcta o única. El siguiente informe de integridad debe resolver cada ejercicio antes de comparar su resultado con la clave, comprobar las cuatro alternativas, los distractores y la correspondencia con imágenes y justificaciones. No se declara alineación curricular oficial sin consultar las fuentes oficiales correspondientes.

Se conservan como alertas para esa revisión la formulación de PAT-003 sobre el último salto y el encaje curricular de N4B-MAT-03/07. No se cambia el contenido para compensar un problema de imagen.

## Promoción e histórico

Nada está promovido a la base original. Antes de una aplicación se requieren las aprobaciones de las figuras propuestas y de los enlaces concretos, respaldo actualizado, relectura de cada ID y comparación con su valor esperado. Los datos actuales de uso deben verificarse de nuevo: esta revisión describe la instantánea local.

Clonar una figura y cambiar Item.figuraId no conserva el histórico de ese mismo Item: los ensayos guardan ItemVersion, pero la relación de figura está en Item. No se afirma que la copia ni el clonado resuelvan ese límite del esquema. No se modifica el esquema.

## Tabla de propuestas

| Figura | Ítems que la usan | Tipo | Cambio propuesto |
|---|---|---|---|
${rows}

## Evidencia y ejecución

[Verificación técnica](verificacion.json), [inventario](inventario-grafico-4b.json), [mediciones SVG](qa-textos.json), [pantalla](qa-pantalla.json), [papel](qa-papel.json), [fuentes y hashes](fuentes.json).

Perfil: implementación local y revisión, manteniendo la configuración de esfuerzo alto solicitada. No se dispone de verificación del selector exacto del modelo. Sin subagentes. La skill de perfiles delimitó las escrituras a propuestas locales; la de PDF exigió renderizar y comprobar las muestras antes de entregarlas. No se tocaron archivos de la aplicación.
`;
fs.writeFileSync(path.join(out,'INFORME-LOTE-02.md'),nota);
fs.writeFileSync(path.join(out,'PARA-DEEPSEEK.md'),`Hola, DeepSeek.\n\nEl lote gráfico 2 de 4° básico está preparado como propuesta offline, sin acceso ni escrituras en la base. Son 44 figuras y 50 ítems usuarios; el lote 1 aprobado se conserva intacto. No hay promoción ni enlaces nuevos.\n\nLa frontera de tamaño sigue abierta: en las clases actuales de rendición el SVG se ajusta al ancho disponible y a max-h-72; en impresión a max-h-64. Tras aumentar rótulos, medí un mínimo de ${v.minTextoMovilPx.toFixed(2)} px CSS de texto en ventana de 390 px y ${v.minTextoImpresoPt.toFixed(2)} pt en la muestra A4. No hay desbordes en las pruebas, pero eso no prueba legibilidad. Por favor evalúa ampliación/zoom y el tratamiento de documentos gráficos con mucho texto; conserva intactos los datos y no compenses con cambios del banco. Las mediciones por figura están en qa-pantalla.json y qa-papel.json de este directorio.\n\nSe usó directamente components/figura.tsx, sin tocar renderizadores ni CSS de la app. Hash del componente: ${v.fuentes.componenteSHA256}. Hash CSS capturado: ${v.fuentes.cssSHA256}.\n\nSiguen cinco borradores con alternativas gráficas A-D ausentes y una flecha de PAT-006 por ajustar. No publiques esos borradores. La clave guardada y la semántica completa todavía no se dan por validadas.\n\nNo hay PostgreSQL de pruebas: solo instantánea y propuestas JSON. La validación online queda pendiente de acordar un entorno de pruebas. Cualquier futura promoción debe respetar la aprobación del usuario y el problema histórico de figuraId en Item.\n`);
console.log(JSON.stringify({informe:path.join(out,'INFORME-LOTE-02.md'),inventario:grupos},null,2));
