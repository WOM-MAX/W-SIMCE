---
name: w-simce-presentacion
description: Medir y corregir la apariencia de la interfaz de W-SIMCE (landing, banco, rendición e impresión) midiendo antes de tocar CSS, sin compensar problemas de presentación con datos.
---

# Presentación de W-SIMCE

Regla de entrada: medir primero, opinar después. Y nunca cambiar datos del banco para
compensar un problema de CSS.

## Medir

```
node --env-file=.env scripts/medir-presentacion.mjs
```

Calcula, para las 415 figuras, la escala efectiva y el tamaño de texto resultante en los tres
contextos. Los anchos salen del código, ya descontados padding y bordes:

| Contexto | Contenedor | Ancho útil | Tope de alto |
|---|---|---|---|
| `/banco` | `max-w-sm` 384, `p-2` | 366 px | `max-h-64` 256 |
| `/rendir` | `max-w-4xl`, `p-6`, `p-3` | 774 px | `max-h-72` 288 |
| `/imprimir` | `max-w-md` 448, `p-2` | 430 px | `max-h-64` 256 |

El SVG usa `preserveAspectRatio="xMidYMid meet"`: **nunca recorta**. Si el tope de alto muerde,
la figura se encoge y queda con margen lateral. Esa distinción importa: recorte es dato,
reducción es presentación.

Aspecto de las figuras: lienzo de 104 a 648 px de ancho, razón entre 0.79 y 7.69, mediana 2.03.
Un solo tope de alto sobre esa dispersión es lo que produce los extremos.

## Capturas con Chrome

```
& "C:\Program Files\Google\Chrome\Application\chrome.exe" --headless=new --disable-gpu `
  --hide-scrollbars --window-size=1440,2400 --screenshot="salida.png" "http://localhost:3005/"
```

- `--virtual-time-budget=4000` para que terminen las animaciones de entrada.
- `--force-prefers-reduced-motion` para capturar el estado final sin animación.

**Chrome headless no baja de unos 500 px de ancho de ventana.** Si se pide 390, maqueta a 500 y
recorta la imagen. Los textos parecen cortados y no lo están. Para revisar móvil de verdad hace
falta emulación por CDP, no `--window-size`.

El círculo con la "N" abajo a la izquierda es el indicador de desarrollo de Next. No es diseño.

## Contraste, ya calculado

| Par | Razón | Estado |
|---|---|---|
| blanco sobre `acento` #f84828 | 3.53:1 | falla |
| blanco sobre `acento-boton` #d63818 | 4.73:1 | pasa |
| `marca` #202858 sobre blanco | 13.95:1 | pasa |
| `tenue` #5a6480 sobre blanco | 5.88:1 | pasa |
| blanco 45% sobre `marca` | 4.04:1 | falla |
| blanco 60% sobre `marca` | 5.99:1 | pasa |

El resto de la app ya usa `acento-boton`. Si aparece `bg-acento` con texto blanco, es una
inconsistencia, no una decisión.

## Movimiento

`app/globals.css` define `.orbita`, `.orbita-inversa`, `.entra` y `.aparecer`. Las cuatro se
anulan en `prefers-reduced-motion`, y cualquier animación nueva debe agregarse a ese bloque.

## Comprobar en local

Servidor de desarrollo en `http://localhost:3005`, y por la red en `http://192.168.1.88:3005`.
`next.config.ts` incluye esa IP en `allowedDevOrigins`; sin ella Next bloquea los estilos en
accesos por IP. Las credenciales de administrador están en `docs/BITACORA.md`.
