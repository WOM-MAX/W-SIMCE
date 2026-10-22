---
name: simce-construir-figuras
description: Construir y comprobar figuras vectoriales evaluativas para candidatos W-SIMCE con las primitivas del componente real. Usar en geometría, planos, tablas y gráficos; no para ilustraciones raster, cambios de CSS o reparaciones de registros publicados.
---

# Construir figuras W-SIMCE

Leer completas [reglas del componente](../../04-FIGURAS.md), [método de construcción](../../09-METODO-FIGURAS.md) y [casos de referencia](../../08-CASOS-DE-REFERENCIA.md). Consultar el contrato y esquema a través de la skill generadora si todavía no se han leído.

## Construcción

1. Precisar qué información debe aportar el dibujo y qué se evalúa. No revelar el resultado ni añadir un defecto accidental como distractor.
2. Crear un modelo explícito de coordenadas, medidas, transformaciones o conteos. Declarar orientación de ejes, escala y correspondencias pertinentes.
3. Calcular vértices, centros, alturas y posiciones de rótulos. Usar transformación matemática para giros y reflejos. Comprobar todas las opciones visuales antes de dibujarlas.
4. Reservar zonas para título, figura, medidas y leyenda. Conservar escala entre figuras comparables y margen para glifos, no solo para sus coordenadas.
5. Expresar el resultado solo con las primitivas admitidas. `grisRelleno` es opacidad; no escribir atributos que el componente ignore.
6. Ejecutar la preparación local y abrir cada render si hay acceso visual. Contrastar primitivas con el modelo: un texto que dice 90° no demuestra perpendicularidad.
7. Entregar la figura como parte de una versión candidata y declarar si faltan pruebas de pantalla o A4. Un PNG ampliado no acredita tamaño real.

## Si aparece un problema

Separar dato, construcción y presentación. Si el enunciado es ambiguo, corregir el candidato completo. Si la geometría es errónea, recalcular primitivas. Si el límite corresponde a CSS o a una operación no soportada, informar sin cambiar la app.

No modificar figuras aprobadas, controles ni renderer; no usar IA raster para sustituir geometría evaluativa. Si se pide reparar material existente, detenerse y solicitar el encargo específico sobre copias y alcance.
