# Contrato de candidatos

El formato `w-simce-candidatos-v1` está separado del JSON de los cargadores de Prisma. No es una migración ni un formato autorizado de importación.

## Campos

Un lote tiene `formato`, `loteId`, `estado:CANDIDATO`, `nivel:4B`, `asignatura:matematica`, `generador` e `items`. Máximo 20 candidatos por entrega. `generador` identifica herramienta y modelo declarado; usar null si el modelo no está disponible, no inferirlo.

Cada ítem tiene código local `DS4B-...`, versión candidata, eje, OA con referencia, habilidad, demanda cognitiva estimada, dificultad estimada, enunciado, cuatro alternativas A-D, clave propuesta, justificación propuesta, necesidad de figura, figura y modelo geométrico si corresponde.

Cada alternativa tiene `letra`, `texto` y `errorEsperado`. El error es null en la clave propuesta y descriptivo en las otras tres. Si las cuatro opciones son dibujos, los cuatro textos son null y A-D deben estar dibujadas. No mezclar opciones textuales con opciones null en este piloto.

`figura` es null o contiene las primitivas reales `ancho`, `alto`, `elementos`. `modeloGeometrico` es null o un objeto de evidencia, nunca código ejecutable. Una descripción geométrica del generador también se comprueba: no acredita que las coordenadas dibujadas coincidan.

`oa` incluye `codigo`, `fuente` y `justificacionEncaje`. El validador solo comprueba formato y dominio de la URL, no que la fuente exista ni que el OA sea correcto.

## Comandos

```powershell
# Formato y controles básicos, sin base.
node instrucciones-deepseek/herramientas/validar.mjs instrucciones-deepseek/ejemplos/lote-ejemplo.json

# Comparación exacta y aproximada con una instantánea local, sin Prisma.
node instrucciones-deepseek/herramientas/validar.mjs instrucciones-deepseek/ejemplos/lote-ejemplo.json --banco=tmp-figuras/codex-4b/2026-10-21T20-41-46-545Z/revision/lote-03/copia-propuesta-4b-lote-03.json

# Render y paquete con clave oculta, en un directorio nuevo.
node instrucciones-deepseek/herramientas/preparar.mjs instrucciones-deepseek/ejemplos/lote-ejemplo.json
```

La comparación aproximada de textos es una alerta, no detección exhaustiva de duplicados semánticos. Las coordenadas dentro del lienzo no prueban que un texto quepa: para eso hay que renderizar y revisar cajas de texto y presentación.

El esquema describe el contrato. El validador local comprueba estructura y reglas complementarias; ninguno evalúa la verdad matemática de la clave. La herramienta de preparación tampoco genera un dictamen de aptitud.
