# Método de trabajo

Alcance inicial: candidatos nuevos de Matemática de 4° básico. Responsable de generación: DeepSeek. Responsable de revisión independiente: Codex. Publicación: decisión separada del usuario.

## 1. Fijar el encargo

Registrar curso, asignatura, cantidad, objetivos, exclusiones y entregas. Usar [la plantilla de encargo](plantillas/encargo.json) como propuesta, no como orden ya aprobada. Si faltan curso o asignatura, preguntar. Si se ha delegado la selección de OA, elegirlos y comprobarlos en fuentes oficiales; no inventar un OA para justificar un ejercicio ya hecho.

El piloto propuesto tiene 20 candidatos en dos entregas: cinco, retroalimentación y quince. La distribución y el costo se explican en [06-PILOTO-Y-COSTO.md](06-PILOTO-Y-COSTO.md). No generar el segundo grupo antes de recibir el encargo correspondiente.

## 2. Diseñar antes de redactar

Para cada candidato, definir el conocimiento que se evalúa, la tarea observable, los datos necesarios y el procedimiento mínimo de solución. Contrastar ese procedimiento con el OA, no solo la palabra temática del enunciado. Comprobar la fuente, su fecha o versión cuando conste y su aplicabilidad al encargo. Una URL con dominio oficial no acredita por sí sola el contenido.

No copiar ejercicios oficiales ni producir variantes masivas cambiando solo los números. La comparación textual automática es parcial; revisar también duplicados de estructura, contexto y razonamiento.

## 3. Resolver antes de fabricar las alternativas

Calcular el resultado sin opciones. Conservar unidades, restricciones y un procedimiento comprobable. Probar casos que cambian la solución: diagonales, giros, escala, igualdad de áreas, lectura de filas o columnas, datos ocultos o redondeo. Si hay varios resultados válidos, corregir el problema antes de completar el candidato.

Después construir cuatro alternativas A-D homogéneas. Cada distractor debe corresponder a un error concreto. Volver a resolver usando todas las alternativas: dos expresiones distintas pueden representar la misma respuesta. La clave propuesta debe coincidir con el resultado; si no coincide, corregir el contenido, no acomodar su explicación.

Referencia obligatoria: [reglas de contenido](03-CONTENIDO.md).

## 4. Construir la figura desde un modelo

Definir primero medidas, coordenadas, conteos o transformaciones. Convertir ese modelo a primitivas compatibles. Mantener separadas las coordenadas matemáticas y las de pantalla. Reservar márgenes y zonas de rótulos antes de dibujar.

Usar [el método geométrico y de composición](09-METODO-FIGURAS.md) y [la skill de figuras](skills/simce-construir-figuras/SKILL.md). Si el ítem evalúa detectar una figura incorrecta, comprobar que el defecto es intencional y que no aparecen otros por accidente.

La figura no debe revelar la respuesta ni marcar la opción correcta con una diferencia de estilo.

## 5. Guardar el candidato y autocontrolar

Guardar JSON conforme al [contrato](07-FORMATO.md) y al [esquema](esquema-lote.json), solo en `candidatos/`, con nombre nuevo por versión. Los apuntes de producción van aparte; no añadir campos que el esquema no admite.

Desde la raíz de W-SIMCE, reemplazar la ruta de ejemplo por el archivo real:

```powershell
node instrucciones-deepseek/herramientas/validar.mjs instrucciones-deepseek/ejemplos/lote-ejemplo.json
node instrucciones-deepseek/herramientas/preparar.mjs instrucciones-deepseek/ejemplos/lote-ejemplo.json
```

El primer comando comprueba formato y reglas básicas. El segundo crea una entrega nueva con PNG, SVG, vista de inspección, paquete sin claves, sobre separado y hashes. No publica. Un error automático exige corrección; una advertencia exige análisis y explicación.

Abrir cada PNG si la herramienta visual está disponible. No afirmar revisión visual a partir del JSON. Si no se puede ver, informar el pendiente. El productor entrega para revisión; no se aprueba a sí mismo.

## 6. Hacer una resolución independiente

El revisor empieza únicamente con `revision-ciega.json` e `index.html`. Sin abrir el original ni el sobre, registra resultado propio, procedimiento, opciones válidas y supuestos en una copia nueva de [resolucion-ciega.json](plantillas/resolucion-ciega.json).

Si ya se vio la clave, declararlo. Puede usarse un nuevo contexto sin respuestas para una revisión con clave oculta; no afirmar independencia sin comprobar esa condición.

## 7. Contrastar y comprobar la integridad completa

Solo después de registrar la resolución propia, abrir `sobre-respuestas.json`. Contrastar clave, explicación, los cuatro distractores, OA y evidencia geométrica. Revisar duplicados, enunciado, dibujo y restricciones juntos. Un ítem con figura bonita pero varias respuestas correctas no pasa esta fase.

Comprobar presentación de pantalla e impresión por separado: [protocolo de revisión](05-REVISION.md). La vista ampliada que produce esta carpeta no demuestra tamaño real. Si faltan pruebas de presentación aplicables, el dictamen queda pendiente.

## 8. Emitir dictamen o devolver para corrección

Usar una copia nueva de [dictamen.json](plantillas/dictamen.json). Identificar versión y SHA-256 del candidato del manifiesto o del paquete ciego. No confundirlo con el hash del archivo de lote.

Estados documentales: `REQUIERE_AJUSTES`, `RECHAZADO`, `APTO_EN_REVISION_TECNICA`. Para declarar aptitud, todos los criterios aplicables deben tener evidencia; `no_aplica` necesita motivo. Este dictamen no es certificación oficial ni validación psicométrica.

Si hay cambios, aumentar `versionCandidata`, conservar la entrega anterior y repetir los controles y revisión pertinentes. El hash nuevo identifica contenido nuevo; no hereda el dictamen anterior.

## 9. Detenerse antes de importar

Entregar el informe al usuario. Esta carpeta no tiene importador ni autoriza escrituras en la base. Un futuro paso de incorporación necesita encargo expreso, respaldo, validación del importador y comprobación de estados e histórico. No sustituir la base completa por una copia para introducir candidatos.

## Evidencia que acompaña un lote

| Quién | Evidencia |
|---|---|
| Generador | Encargo, candidato versionado, autocontrol, controles automáticos, renders y pendientes |
| Herramientas | Archivos de revisión, hashes, errores y advertencias |
| Revisor | Resolución previa al contraste, dictamen y pruebas de contenido/presentación |
| Usuario | Decisión sobre el siguiente paso; publicación no implícita |
