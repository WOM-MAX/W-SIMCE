# Método geométrico y de composición

Aplicar junto con [04-FIGURAS.md](04-FIGURAS.md), que describe las primitivas admitidas. Este documento contiene criterios de construcción; el validador no ejecuta todas estas comprobaciones.

## Modelo antes de coordenadas de pantalla

Anotar magnitudes, unidad, objetos y relaciones que importan para responder. En `modeloGeometrico`, si corresponde, guardar evidencia declarativa: vértices, centro, eje, escala, conteos o correspondencias. No incluir código ejecutable. El revisor debe contrastar esa evidencia con las primitivas efectivamente dibujadas.

Para coordenadas matemáticas con y hacia arriba, una conversión uniforme es `X = margenX + s*x`, `Y = baseY - s*y`. Usar el mismo factor `s` en ambos ejes cuando se representen longitudes comparables. En un plano por casillas se puede usar y hacia abajo desde el inicio, pero hay que declararlo y conservar esa convención.

## Geometría verificable

| Construcción | Cálculo en coordenadas matemáticas |
|---|---|
| Reflexión respecto de x=a | `(x,y) -> (2*a-x,y)` |
| Reflexión respecto de y=b | `(x,y) -> (x,2*b-y)` |
| Giro antihorario de 90° sobre (cx,cy) | `(x,y) -> (cx-(y-cy),cy+(x-cx))` |
| Giro de 180° sobre (cx,cy) | `(x,y) -> (2*cx-x,2*cy-y)` |
| Traslación | `(x,y) -> (x+dx,y+dy)` |
| Igualdad de lados | Comparar distancias al cuadrado: `dx*dx+dy*dy` |
| Ángulo recto | Producto escalar de sus dos vectores igual a cero |

Aplicar el giro antes de convertir a la pantalla. Si se opera directamente con y hacia abajo, el signo del giro visual cambia. No mezclar convenciones entre la figura original y sus alternativas.

Comprobar todas las opciones: igualdad de distancias, correspondencia de vértices, orientación y centro. Dos siluetas pueden ser congruentes por giro y dejar de ser distractores si el enunciado permite girarlas.

En ángulos, calcular la diferencia entre las direcciones reales de los rayos y decidir si se pide el menor, el orientado o el reflejo. El rótulo no reemplaza esa comprobación. No usar una diferencia angular como si fuera automáticamente el ángulo menor.

## Planos y cuadrículas

Con casilla de tamaño `c`, el centro de columna `i` y fila `j`, contadas desde cero, es `(x0+(i+0.5)*c, y0+(j+0.5)*c)`. Los nombres van en el centro de su celda, no sobre la línea que separa dos celdas.

Separar las zonas de títulos de columnas y filas del interior del mapa. Colocar los lugares dentro de sus celdas con margen para texto. Si se pregunta la menor ruta por movimientos ortogonales, la distancia en casillas es `abs(deltaCol)+abs(deltaFila)`; el enunciado debe excluir las diagonales cuando eso cambie la respuesta.

## Tablas, barras y pictogramas

- Tabla: definir anchos de columnas y altos de filas antes de escribir. Una cifra o palabra larga no debe invadir otra celda. Verificar cada relación fila-columna.
- Barras: centro de categoría y centro de barra coinciden. Para escala lineal, `altura = valor*escala`; documentar origen y máximo. Una escala cortada exige indicación explícita y pertinencia para el ejercicio.
- Pictograma: mantener el mismo símbolo y valor unitario. Contar los símbolos de cada fila aparte de la leyenda. Si se usan medios símbolos, el enunciado o leyenda deben permitir interpretarlos.
- No usar un relleno que tape cuadrículas necesarias para responder.

## Composición del lienzo

Reservar primero zonas de título, dibujo, medidas y leyenda. El tamaño del lienzo debe responder al contenido; no aumentarlo dejando márgenes vacíos para aparentar una figura grande.

En texto SVG, y marca la línea base. Revisar bordes superiores, anchura de palabras, superposiciones, rótulos de medidas y guiones. Si un texto no cabe, redistribuir o partirlo mediante las primitivas admitidas; no encoger todas las letras sin comprobar su presentación final.

Conservar escala y estilo entre opciones comparables. Las etiquetas A-D deben ser claras y neutrales; no dejar más espacio, más detalle o más contraste solo a la correcta. Si todas las opciones son dibujos, revisar las cuatro por separado.

Usar `grisRelleno` como opacidad, no como tono. Un valor menor sobre blanco aclara el relleno. Si se necesita otro tono que el componente no admite directamente, no añadir un atributo SVG ignorado ni cambiar el componente: demostrar una solución con primitivas compatibles o informar el límite.

## Render y tamaño

Usar `herramientas/preparar.mjs`, que reutiliza el componente de la app. No sustituirlo por otro motor con reglas propias ni generar imágenes raster mediante IA para geometría evaluativa.

Hay que separar estas evidencias:

1. PNG/SVG ampliado: permite inspeccionar trazos, medidas y colisiones.
2. Pantalla: medir el contenedor y la figura en la presentación real o una reproducción CSS identificada. Registrar viewport y dimensiones. Una reproducción no equivale a una prueba integrada de la app.
3. Impresión: comprobar A4, márgenes y escala de impresión indicada. Declarar si se revisó un PDF al 100 % o una copia física; no confundir ambos.

En la inspección del código de esta entrega, `Figura` usa por defecto `max-h-72 w-full` y la vista de impresión usa `max-h-64 w-full`. Volver a comprobar esos usos al revisar una entrega: CSS, contenedores y fuentes pueden cambiar. No deducir píxeles finales sin medir el CSS calculado.

Como estimación de planificación, con lienzo W por H y caja útil w por h, un ajuste proporcional tiene factor `s=min(w/W,h/H)`. El tamaño visual de una letra de tamaño t será aproximadamente `t*s`; hay que verificarlo con el render. Duplicar la resolución del PNG no aumenta por sí solo el tamaño con el que la app muestra el SVG.

## Condición de entrega

Cada figura tiene modelo comprobado, render abierto cuando sea posible y hallazgos declarados. Si falta evidencia de tamaño real, dejarla pendiente. Los ejemplos de [08-CASOS-DE-REFERENCIA.md](08-CASOS-DE-REFERENCIA.md) sirven para ensayar los controles, no para aprobar automáticamente nuevos dibujos.
