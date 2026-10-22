---
name: simce-revisar-integridad
description: Revisar integridad matemática, curricular, gráfica y de alternativas de candidatos W-SIMCE, registrando resolución antes de contrastar la clave. Usar para emitir dictamen documental; no para aprobar el propio lote del generador ni publicar en la base.
---

# Revisar integridad W-SIMCE

Leer completos [protocolo de revisión](../../05-REVISION.md), [reglas de contenido](../../03-CONTENIDO.md) y [límites](../../01-ALCANCE.md). Si hay figura, leer [reglas gráficas](../../04-FIGURAS.md) y [método de comprobación](../../09-METODO-FIGURAS.md).

## Separación del productor

Esta skill describe el trabajo del revisor. No concede a DeepSeek permiso para aprobar su propia producción: el reparto actual asigna la revisión independiente a Codex. El productor puede usar los criterios para autocontrol, identificándolo como tal.

Declarar si el contexto ya contiene claves o soluciones. En ese caso no afirmar revisión con clave oculta. Si no se conoce la clave, abrir únicamente paquete ciego y vista de inspección hasta registrar una resolución propia.

## Revisión

1. Registrar por ítem versión, hash, procedimiento, resultado, todas las opciones válidas y supuestos. Usar una copia nueva de [resolucion-ciega.json](../../plantillas/resolucion-ciega.json).
2. Después abrir el sobre separado. Contrastar clave, explicación y cada distractor, sin acomodar la solución propia a la propuesta.
3. Comprobar fuente y encaje curricular, duplicados semánticos y coherencia entre datos, pregunta, figura y opciones. Declarar fuentes no verificables y dudas didácticas.
4. Comprobar geometría y presentación aplicables. Identificar evidencia visual real, tamaño de pantalla y muestra de impresión; una tarea no ejecutada queda pendiente.
5. Emitir un registro versionado con [dictamen.json](../../plantillas/dictamen.json). Aptitud requiere respuesta única y todos los criterios aplicables comprobados, no solo ausencia de errores automáticos.

## Decisión y límites

Usar `REQUIERE_AJUSTES`, `RECHAZADO` o `APTO_EN_REVISION_TECNICA`. Explicar fallos y pruebas que permitirían cerrar cada pendiente. No sustituir la revisión por un voto entre modelos ni declarar validez psicométrica sin datos.

Una corrección cambia versión y hash; no hereda el dictamen previo. No escribir en candidatos ajenos, app o base, ni importar un lote. Entregar dictamen al usuario y esperar su decisión sobre publicación o ajustes.
