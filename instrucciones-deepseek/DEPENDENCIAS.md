# Dependencias y portabilidad

La carpeta contiene el método, skills, plantillas, ejemplo, esquema y herramientas del circuito. Las skills son archivos legibles: su uso no requiere un cargador automático. No se ha comprobado la integración de skills de ningún cliente DeepSeek.

## Recursos del mismo proyecto

Para los renders se reutilizan, sin copiar ni cambiar sus reglas:

- [Componente de figura](../components/figura.tsx).
- [Utilidades de texto](../lib/texto.ts).
- [Adaptador de render](../scripts/codex-4b/componente.mjs).
- Dependencias instaladas de Node: TypeScript, React, React DOM y `@resvg/resvg-js`.

El adaptador usa Arial y sus rutas de fuentes de Windows. Revisar las fuentes efectivamente disponibles si se mueve a otro equipo. No afirmar paridad visual solo porque dos equipos produjeron un archivo PNG.

El validador y las pruebas de esta carpeta usan Node y sus módulos estándar. La preparación requiere además los recursos anteriores y ejecutarse desde la raíz de W-SIMCE.

No hace falta conexión a PostgreSQL ni una clave API para estos comandos. Consultar fuentes curriculares requiere acceso a esas fuentes; si no existe, dejar el currículo pendiente.

## Qué hacer si falta un recurso

Informar nombre y ruta. No instalar, actualizar ni sustituir el renderer sin autorización. Se puede continuar la parte documental que no dependa del recurso, indicando qué no se pudo verificar.

Si se desea mover el circuito a otro repositorio, habrá que trasladar o adaptar el renderer y sus dependencias con una comprobación de paridad. Esta entrega no declara portabilidad autónoma de toda la aplicación.

## Perfil usado para preparar esta entrega

Implementación de instrucciones y herramientas locales, seguida de revisión mediante pruebas. Escrituras limitadas a `instrucciones-deepseek/`; sin subagentes ni cambios de configuración del modelo. El selector exacto de modelo y esfuerzo de la interfaz no está verificado. La skill `skill-creator` guio la estructura de las tres skills; `execution-profiles` delimitó permisos y comprobaciones.
