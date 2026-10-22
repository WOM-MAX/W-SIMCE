# Reglas para dibujar y comprobar figuras

## Formato real

La figura contiene `ancho`, `alto` y `elementos`. Operaciones admitidas:

| Operación | Coordenadas y datos |
|---|---|
| `rect` | x, y, w, h |
| `line` | x1, y1, x2, y2 |
| `circle` | cx, cy, r |
| `poly` | puntos como `[[x,y], ...]`, cerrado |
| `path` | d con sintaxis de recorrido SVG |
| `text` | x, y, texto, tam, ancho opcional, anclaje inicio/medio/fin, negrita |

Comunes: grosor, gris, punteada, relleno, grisRelleno. No añadir claves CSS o SVG que el componente no interpreta.

`gris` controla el tono del trazo o texto; 0 es negro. `relleno:"gris"` utiliza un tono fijo del componente. `grisRelleno` controla su **opacidad**, no un tono más oscuro: un valor menor sobre blanco lo aclara. Si la pregunta exige un relleno oscuro, demostrar el contraste real con las primitivas disponibles; no suponerlo ni cambiar el renderer sin encargo.

## Composición

- Dar margen al lienzo. La coordenada y de un texto es su línea base: un texto en y positiva también puede recortarse por arriba.
- Reservar celdas y renglones según el texto real. Centrar sobre una división vertical no centra dentro de una columna.
- Mantener escalas, alturas y valores en gráficos. Cada categoría va bajo su barra; título y leyenda deben referirse al gráfico correcto.
- En pictogramas, contar símbolos de datos por fila; el símbolo de la leyenda no es otro dato.
- Mantener la misma escala en alternativas geométricas comparables. No deformar cada figura para llenar su espacio.
- En reflexiones y giros, transformar coordenadas; no dibujar una forma «parecida». Comprobar centros, distancias y orientación.
- En las opciones visuales, mostrar original cuando corresponda y A, B, C, D sin omisiones ni figuras cortadas.
- No escribir el resultado ni destacar solo la opción correcta en una figura evaluativa.
- Una flecha debe tocar su recorrido y apuntar en la dirección pertinente.

## Tres comprobaciones diferentes

1. JSON y coordenadas: operaciones reconocidas, valores finitos y geometría dentro del lienzo.
2. Render: usar el componente real y mirar cada PNG; las pruebas de coordenadas no detectan todas las colisiones de texto ni errores de contenido.
3. Presentación: comprobar tamaño con las clases de pantalla e impresión de la app. El visor básico de esta carpeta muestra el dibujo ampliado y no certifica escala física. Para la revisión final se preparan muestras CSS/A4, como en los lotes anteriores.

Las comprobaciones anteriores son condiciones de revisión, no una garantía de legibilidad para todo dispositivo o impresora.

## Referencias locales de diseño

Ejemplos aprobados visualmente, no certificados como ítems completos:

- Tablas, barras, planos y pictograma: `tmp-figuras/codex-4b/2026-10-21T20-41-46-545Z/revision/lote-02/`.
- Vistas, giros, reflejos y flecha: el directorio hermano `lote-03/`.
- Evidencia de sus pruebas: `verificacion.json` y `qa-visual.json` en cada entrega.

No copiar esos ítems para inflar el banco ni ejecutar los scripts de reparación de los lotes anteriores para generar material nuevo.
