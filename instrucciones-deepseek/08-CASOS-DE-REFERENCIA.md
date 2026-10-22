# Casos que el procedimiento debe detectar

Estos casos proceden de la revisión local. Se describen como controles de calidad; no se entrega todo el banco como plantilla para producir duplicados.

| Caso | Riesgo | Comprobación necesaria |
|---|---|---|
| Signo de interrogación junto al borde superior | Su coordenada y es positiva, pero el glifo queda cortado | Render y caja del texto, no solo x/y |
| Fuente señalada como gris más oscuro | La opacidad menor la dibuja más clara | Contraste real con el enunciado |
| Triángulo 45°,45°,90° | Rótulos correctos sobre catetos desiguales | Coordenadas y proporciones, además de texto |
| Gráfico de barras | Categoría desplazada bajo otra barra | Relación categoría-centro de barra y escala |
| Pictograma | Contar el símbolo de la leyenda o cambiar símbolos por fila | Conteo independiente por fila y valor unitario |
| Vista superior 3x2 frente a 2x3 | Dos opciones pueden confundirse si se permite girar | Fijar el frente en todas las vistas |
| «Dos mitades iguales» | No exige necesariamente simetría por reflexión | Precisar el criterio y probar todas las opciones |
| Secuencia y «último salto» | El salto dibujado y el siguiente no son lo mismo | Resolver literalmente antes de consultar la clave |
| Equivalencia de tiempo | Falta la unidad junto al espacio en blanco | Comprobar la equivalencia completa |
| Justificación con una casilla inexistente | La clave puede coincidir y la explicación seguir siendo falsa | Cotejar cada referencia con el dibujo |

## Ejemplo incluido

`ejemplos/lote-ejemplo.json` muestra el contrato con un rectángulo de 8 por 3. Su dibujo utiliza 20 unidades de lienzo por metro en ambos ejes. Las opciones contrastan suma de lados, perímetro, área y duplicación del área. Es una demostración del formato y de las herramientas, no una aprobación de incorporación al banco.

## Antiejemplo de falsa confianza

Cambiar la clave propuesta de ese ejemplo a A y ajustar sus metadatos puede seguir cumpliendo el contrato JSON, aunque el resultado sea incorrecto. Las pruebas incluidas verifican expresamente ese límite. La resolución independiente debe rechazar esa clave; un esquema o un PNG legible no pueden sustituirla.
