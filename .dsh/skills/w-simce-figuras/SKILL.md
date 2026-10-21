---
name: w-simce-figuras
description: Renderizar, auditar y corregir las figuras del banco de W-SIMCE (primitivas JSON a SVG) sin romper la paridad entre pantalla, impresión y scripts.
---

# Figuras de W-SIMCE

Las figuras del banco no son imágenes: son JSON con primitivas que se dibujan como SVG.
`Figura.primitivas` tiene la forma `{ ancho, alto, elementos: [...] }`.

## Antes de tocar nada

1. Confirmar que el render usa el código actual. Los commits `e2f20d0` y `4b9424a` corrigen
   el tono gris, el grosor, los guiones y la opacidad del relleno. Con código anterior,
   cualquier veredicto visual es inválido.
2. La reparación de la base la hace Codex. Este skill es para revisar, medir y verificar,
   no para escribir en `Figura`, `Item`, `ItemVersion` ni `Alternativa`.

## Renderizar

Por ítem:

```
node --env-file=.env scripts/render-figuras.mjs CODIGO_ITEM
```

Por figura suelta, que es el caso de las huérfanas:

```
node --env-file=.env scripts/render-figuras.mjs --figura=CODIGO_FIGURA
```

Deja el PNG en `tmp-figuras/`. Sin mirar ese PNG, una figura no está revisada.

## Paridad obligatoria

Los tres dibujan lo mismo y se cambian juntos:

- `components/figura.tsx` es la verdad, es lo que ve el alumno.
- `scripts/dibujo.mjs` sirve al PDF.
- `scripts/render-figuras.mjs` sirve a la revisión visual.

Si se separan, la revisión miente. Ya pasó: los scripts usaban grosor 0.9 contra 1, guiones
distintos y relleno opaco.

## Formato

| op | atributos |
|---|---|
| `rect` | `x`, `y`, `w`, `h` |
| `line` | `x1`, `y1`, `x2`, `y2` |
| `circle` | `cx`, `cy`, `r` |
| `poly` | `puntos: [[x,y], ...]`, `cerrado` |
| `path` | `d` |
| `text` | `texto`, `tam`, `anclaje`, `negrita`, `ancho` |

Comunes: `grosor`, `punteada`, `relleno: "gris"`, `grisRelleno`, `gris`.
`gris` va de 0 a 1 y tiñe el trazo y el texto. Un atributo desconocido se ignora en silencio.

## Defectos que la auditoría automática no ve

- Datos equivocados dentro de la tabla, como una columna que repite lo mismo en todas las filas.
- Gráficos comprimidos a un lado del lienzo.
- Figuras que no corresponden al enunciado.
- Texto que se sale del viewBox: eso sí se puede buscar, y se recorta en los tres contextos.

## Medir presentación

```
node --env-file=.env scripts/medir-presentacion.mjs
```

Da la escala efectiva y el tamaño de texto resultante en `/banco`, `/rendir` e `/imprimir`.
Separa lo que arregla el CSS de lo que depende de las primitivas.
