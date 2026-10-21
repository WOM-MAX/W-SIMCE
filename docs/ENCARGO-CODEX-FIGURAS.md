# Anexo técnico para Codex: reparación de figuras del banco W-SIMCE

Este documento no define quién manda: eso lo define el plan de trabajo del usuario. Aquí solo
están los datos verificados, el formato de las figuras, las herramientas y las comprobaciones
técnicas que hacen falta para repararlas sin dañar nada.

Reparto vigente: la reparación de ítems y figuras es de Codex. DeepSeek programa la aplicación y
no escribe en `Item`, `ItemVersion`, `Alternativa`, `Figura` ni `TextoLectura`. La aplicación
puede leer el banco.

Condición previa: Codex debe renderizar con el código en el commit `4b9424a` o posterior. Los
commits `e2f20d0` y `4b9424a` corrigen tres defectos del dibujo que hacían que el render no
representara lo que ve el alumno. Con código anterior, cualquier veredicto visual es inválido.

---

## 1. Qué está verificado

Medido hoy sobre la base real, no estimado:

| Dato | Valor |
|---|---|
| Figuras | 415 |
| Figuras sin ítem asignado | 16 |
| Ítems | 1926 |
| Versiones de ítem | 1926 |
| Alternativas | 7704 |
| Ítems con figura | 439 |
| Ítems solo con texto | 884 |
| Ítems sin figura y sin texto | 603 |
| Ítems que mencionan una figura en el enunciado | 97 (4 sin figura) |
| Ítems de transformaciones en el plano | 33 (16 sin figura) |

Defectos confirmados con la figura renderizada delante:

- `6B-MAT-DAT-003`: la columna «Hojas de 6°B» repite `0 5` en las siete filas. No hay datos
  que leer y la pregunta no se puede responder.
- `8B-MAT-PRO-F3-006`: el gráfico ocupa la mitad derecha, el título queda lejos a la izquierda,
  el eje x se prolonga después de junio y las etiquetas de mes no caen bajo sus puntos.
- `4B-MAT-NUM-F2-022`: el signo `?` está dibujado en y negativa y se corta por arriba.
- `FIG-4B-MAT-GEO-002-MAPA` es idéntica a `FIG-4B-MAT-GEO-001-MAPA`, que ya está enlazada al
  ítem `4B-MAT-GEO-001`.
- `FIG-6B-MAT-DAT-F3-005-ARBOL` es idéntica a `FIG-6B-MAT-DAT-005-ARBOL`. La segunda está
  enlazada a `6B-MAT-DAT-005`.

Lo que **no** está verificado y no se puede afirmar: cuántas figuras más están mal. Solo se
revisaron unas pocas. La auditoría automática del JSON solo detecta 2 textos fuera del lienzo
y 11 textos vacíos, y varios de esos vacíos son intencionales.

---

## 2. Reglas duras

Estas reglas existen para que un error no destruya datos. Se cumplen siempre.

1. No se toca el esquema. Nada de `prisma migrate`, `prisma db push`, `migrate deploy` ni SQL
   de definición. Las migraciones ya están aplicadas.
2. No se ejecuta `DELETE`, `TRUNCATE` ni `DROP`. Ni para limpiar duplicados.
3. No se ejecuta ningún `UPDATE` sin condición por `id` exacto.
4. Columnas que se pueden escribir, y ninguna otra: `Item.figuraId`, `Figura.primitivas`,
   `Figura.ancho`, `Figura.alto`.
5. Prohibido escribir en `Item.codigo`, `ItemVersion.*`, `Alternativa.*` y `TextoLectura.*`.
   Si un arreglo de figura obliga a cambiar una clave o una alternativa, se detiene y se
   reporta. La clave no se toca nunca.
6. Nada de operaciones masivas. Una figura por escritura, verificada.
7. Sin `git`. No se hace commit, ni stash, ni checkout, ni reset.
8. No se revierten los commits `e2f20d0` ni `4b9424a`. Corrigen el tono `gris`, el grosor, los
   guiones y la opacidad del relleno en los tres renderizadores, y agregan `--figura=` al script
   de render. Sin ellos las figuras se ven mal y no se puede comprobar nada.
9. No se para el servidor de desarrollo del puerto 3005.
10. No se ejecuta `prisma generate` mientras el 3005 esté arriba. En Windows el motor queda
    bloqueado y la regeneración falla con `EPERM` (comprobado dos veces).
11. Las alternativas con `texto` en `null` son intencionales. Hay 24 en 6 ítems
    (`4B-MAT-GEO-005`, `4B-MAT-GEO-003`, `4B-MAT-GEO-F3-003`, `4B-MAT-GEO-F2-007`,
    `4B-MAT-GEO-F3-005`, `4B-MAT-GEO-F3-007`): las opciones son los dibujos rotulados A, B, C y D
    de la propia figura. No se les agrega texto. No es un defecto.

Si una regla impide hacer algo que parece necesario, se reporta y se espera autorización.

---

## 3. Entorno

- Prisma con PostgreSQL. `DATABASE_URL` y `DIRECT_URL` están en `.env`.
- Migración `20261021100000_run_estudiante` aplicada. No hay nada pendiente.
- No existe `pg_dump` en la máquina. El respaldo se hace exportando tablas a JSON.
- Respaldo ya existente: `tmp-figuras/respaldo-2026-10-21T19-08-53.json` (5 MB, con las 415
  figuras, los 1926 ítems, las 1926 versiones y las 7704 alternativas).
- Servidor de desarrollo en `http://localhost:3005`, levantado.

---

## 4. Formato de una figura

`Figura.primitivas` es JSON con esta forma:

```
{ "ancho": 302, "alto": 76, "elementos": [ ... ] }
```

Operaciones admitidas y sus atributos:

| op | Atributos |
|---|---|
| `rect` | `x`, `y`, `w`, `h` |
| `line` | `x1`, `y1`, `x2`, `y2` |
| `circle` | `cx`, `cy`, `r` |
| `poly` | `puntos: [[x,y], ...]`, `cerrado` |
| `path` | `d` (sintaxis SVG) |
| `text` | `texto`, `tam`, `anclaje` (`inicio`/`medio`/`fin`), `negrita`, `ancho` para cortar línea |

Comunes: `grosor`, `punteada`, `relleno: "gris"`, `grisRelleno` (opacidad del relleno),
`gris` (tono del trazo y del texto).

`gris` va de 0 a 1, donde 0 es negro. Está presente en 691 elementos de 86 figuras. Sin `gris`
el trazo sale negro.

Cualquier otra clave se ignora al dibujar. No inventes atributos nuevos: si hace falta una
capacidad que el formato no tiene, se reporta.

---

## 5. Cómo comprobar una figura

Por ítem:

```
node --env-file=.env scripts/render-figuras.mjs CODIGO_DE_ITEM
```

Por figura suelta, que es el caso de las 16 huérfanas:

```
node --env-file=.env scripts/render-figuras.mjs --figura=CODIGO_DE_FIGURA
```

Deja `tmp-figuras/CODIGO.png`. Ninguna figura se da por corregida sin mirar ese PNG.

El renderizador del script replica `components/figura.tsx`. Si el PNG se ve bien, la app se
ve bien. Si cambias una regla de dibujo, hay que cambiarla en los tres archivos a la vez:
`components/figura.tsx`, `scripts/dibujo.mjs` y `scripts/render-figuras.mjs`.

---

## 6. Fase 0: comprobación, sin escribir

1. Confirmar los conteos de la sección 1. Si alguno no coincide, detenerse y reportar.
2. Confirmar que las 16 figuras huérfanas siguen siendo estas y siguen sin ítem:

```
FIG-4B-MAT-DAT-002-GRAFICO      FIG-4B-MAT-MED-002-RELOJ
FIG-4B-MAT-DAT-004-TABLA        FIG-4B-MAT-NUM-001-TABLA
FIG-4B-MAT-DAT-006-GRAFICO      FIG-4B-MAT-NUM-010-TABLA
FIG-4B-MAT-GEO-002-MAPA         FIG-4B-MAT-NUM-020-AFICHE
FIG-4B-MAT-GEO-003-CUERPO       FIG-4B-MAT-NUM-021-BARRA
FIG-4B-MAT-GEO-005-SIMETRIA     FIG-4B-MAT-PAT-001-TABLA
FIG-4B-MAT-GEO-007-TRANSFORMACION  FIG-4B-MAT-PAT-006-RECTA
FIG-4B-MAT-GEO-009-ANGULOS      FIG-4B-MAT-PAT-007-CAJA
```

3. Renderizar las 16 y adjuntar los PNG.

---

## 7. Fase 1: el plan, todavía sin escribir nada

Entregar una tabla, una fila por figura huérfana:

| Figura | Ítem candidato | Qué pide el enunciado | Qué muestra la figura | Veredicto | Motivo |

Veredictos posibles: `enlazar`, `no enlazar`, `figura equivocada`, `falta rehacer`.

Criterio: se enlaza solo si el enunciado pide mirar una figura y la figura muestra exactamente
lo que el enunciado describe. Si la figura no corresponde, no se enlaza.

Ya comprobado, no hace falta volver a decidirlo:

- Los 16 enunciados de los ítems candidatos mencionan explícitamente una tabla, un gráfico, un
  mapa, un reloj o una figura. El enlace procede en los 16, siempre que el dibujo coincida con
  lo que el enunciado describe.
- `FIG-4B-MAT-GEO-002-MAPA` es idéntica a `FIG-4B-MAT-GEO-001-MAPA` y eso es correcto. Los dos
  ítems usan el mismo mapa con preguntas distintas: `4B-MAT-GEO-001` pregunta en qué casilla
  está la plaza y `4B-MAT-GEO-002` pregunta cómo caminar de la plaza a la biblioteca. Se enlaza.
- `FIG-4B-MAT-GEO-005-SIMETRIA` tiene cuatro polígonos y cuatro rótulos, y el enunciado de
  `4B-MAT-GEO-005` pide «Observa las cuatro figuras». Coincide. Renderizada: cuadrado, rectángulo,
  triángulo y forma en L. La clave es B, que es el rectángulo, y el rectángulo es el único con
  exactamente dos ejes de simetría. Figura y clave concuerdan. Se enlaza.

Después, la lista de ítems que mencionan una figura y no tienen ninguna. Se obtienen con:

```js
const versiones = await prisma.itemVersion.findMany({
  select: { enunciado: true, item: { select: { codigo: true, figuraId: true } } },
});
const patron = /seg[uú]n la figura|en la figura|la figura muestra|observa la figura/i;
versiones.filter((v) => patron.test(v.enunciado ?? '') && !v.item.figuraId);
```

Y para cada defecto confirmado de la sección 1, proponer el cambio exacto de `primitivas`
como diff de JSON, con la figura renderizada antes y después.

**Al terminar la Fase 1 se detiene y se espera aprobación.** No se escribe nada en la base.

---

## 8. Fase 2: aplicar, solo lo aprobado

Para cada figura aprobada, en este orden:

1. Respaldo fresco a `tmp-figuras/respaldo-<fecha>.json` si pasaron más de 30 minutos desde
   el anterior o si otra persona pudo haber escrito.
2. Lectura del estado actual de la fila, guardada en el informe.
3. Escritura en una transacción que afecte una sola fila.
4. Render y PNG adjunto.
5. Si el render sale mal o no coincide con el enunciado, se revierte esa fila al valor
   guardado y se reporta.

Al final de la fase, los conteos deben ser idénticos a los de la sección 1 salvo
`Item.figuraId`, que puede haber crecido. Nada más puede cambiar.

---

## 9. Fase 3: informe

- Tabla de cambios: figura, ítem, columna, valor anterior, valor nuevo.
- PNG de antes y después de cada figura tocada.
- Conteos finales, con la comparación contra la sección 1.
- Lista de lo que quedó pendiente y por qué.
- Confirmación explícita de que no se tocó ninguna columna fuera de las permitidas.

---

## 10. Cuándo el trabajo no sirve

Se rechaza y se rehace si:

- cambió un conteo que no debía cambiar;
- cambió una clave, un enunciado o una alternativa;
- alguna figura quedó enlazada a un ítem cuyo enunciado no la pide;
- alguna figura se declara arreglada sin PNG;
- se escribió algo masivo o sin respaldo previo.
