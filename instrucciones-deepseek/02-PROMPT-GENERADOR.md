# Prompt para entregar a DeepSeek

Copiar desde «Hola, DeepSeek» hasta el final. La ejecución del piloto requiere el encargo del usuario; crear esta guía no lo inicia.

---

Hola, DeepSeek:

Prepararemos candidatos nuevos para W-SIMCE. Tú generarás los archivos y Codex hará la revisión independiente. No escribirás en la base de datos ni aprobarás los candidatos.

## Contexto y fuentes

Empieza en `instrucciones-deepseek/EMPIEZA-AQUI.md`. Lee el método y aplica la skill `skills/simce-generar-candidatos/SKILL.md` con todas sus referencias obligatorias. Cuando haya figura, aplica también `skills/simce-construir-figuras/SKILL.md` y sus referencias. Las rutas son relativas a esta carpeta; no dependas del chat anterior ni de un cargador automático de skills.

El piloto es de Matemática de 4° básico. Usa OA y fuentes oficiales verificadas para el contenido concreto. No copies textos de preguntas oficiales ni uses el banco existente como autorización curricular. Si no puedes comprobar una referencia, indícalo y deja el candidato pendiente; no inventes fuentes ni afirmes validación oficial.

Las figuras se construyen con las primitivas admitidas por el componente real, no con capturas ni imágenes generadas. Los ejemplos visuales aprobados sirven como referencia de diseño, no como aprobación pedagógica del ítem completo.

## Objetivo

Preparar primero 5 candidatos originales del piloto, uno por eje, siguiendo la distribución propuesta. Selecciona OA concretos para cada uno y comprueba sus fuentes antes de redactar. Tras recibir retroalimentación y un nuevo encargo, preparar los 15 restantes. No anticipar cientos de variantes.

## Entregables

1. Un JSON conforme a `esquema-lote.json`, con estado `CANDIDATO` y códigos locales únicos.
2. Cuatro alternativas A-D por ítem, una clave propuesta, una explicación suficiente y el error concreto de cada distractor.
3. Figura vectorial y modelo geométrico cuando sean necesarios; si las opciones son dibujos, las cuatro deben estar completas y rotuladas dentro de la figura.
4. Fuente y OA de cada candidato; demanda cognitiva y dificultad solo estimadas, sin porcentajes inventados.
5. Salida de los controles automáticos y manifiesto de preparación local. Debes declarar cualquier advertencia pendiente, no ocultarla para conseguir una aprobación.

Antes de entregar, resuelve cada problema de nuevo y revisa todas las opciones: equivalencias, unidades, supuestos, restricciones, congruencia entre dato y dibujo, y nivel curricular.

## Límites de autonomía

Escribe los archivos candidatos solo en `instrucciones-deepseek/candidatos/`, sin sobrescribir versiones anteriores. Las herramientas documentadas pueden crear sus propias salidas en directorios nuevos de `instrucciones-deepseek/entregas/`. No modifiques las guías, el esquema ni las herramientas de control para hacer pasar un candidato. No accedas a credenciales ni al banco real. No ejecutes cargadores, Prisma, semillas, git o comandos contra el servidor. No modifiques el componente de dibujo para compensar primitivas incorrectas. No cambies un ítem ya aprobado; genera una nueva versión candidata.

Puedes usar las herramientas locales documentadas. Que un archivo pase esas herramientas solo significa que supera sus controles automáticos; no significa que tenga una respuesta única ni que esté aprobado.

## Definición de completado

El lote solicitado está entregado en archivos, supera los controles estructurales, tiene todas sus figuras renderizadas y permite preparar la revisión con claves ocultas. Se informan los pendientes. Ningún registro fue importado ni marcado como aprobado en la base.

Entrega las rutas y espera el dictamen. Si hay rechazos, corrige únicamente los candidatos señalados y aumenta su versión; no acomodes las explicaciones para defender una clave errónea.
