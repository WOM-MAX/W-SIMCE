# Generación con DeepSeek y revisión independiente

Propuesta de trabajo para W-SIMCE. Primera versión: 22 de octubre de 2026.

**Entrada para DeepSeek: [EMPIEZA-AQUI.md](EMPIEZA-AQUI.md).** Desde allí se accede al [método completo](METODO.md) y a las tres skills. No depende del historial de este chat ni de la carga automática de skills.

## Qué contiene esta carpeta

DeepSeek prepara candidatos nuevos en archivos. Codex revisa cada versión antes de proponer su incorporación al banco. El usuario decide la publicación. Esta carpeta no habilita escrituras en la base.

Leer en este orden:

1. [Límites y responsabilidades](01-ALCANCE.md).
2. [Prompt completo para DeepSeek](02-PROMPT-GENERADOR.md).
3. [Reglas de los ítems](03-CONTENIDO.md).
4. [Reglas de las figuras](04-FIGURAS.md).
5. [Protocolo de revisión independiente](05-REVISION.md).
6. [Piloto y medición del costo](06-PILOTO-Y-COSTO.md).
7. [Formato JSON](07-FORMATO.md), [ejemplo](ejemplos/lote-ejemplo.json) y [esquema](esquema-lote.json).
8. [Casos que el procedimiento debe detectar](08-CASOS-DE-REFERENCIA.md).
9. [Método geométrico y de composición](09-METODO-FIGURAS.md).

## Skills y plantillas

- [Generar candidatos](skills/simce-generar-candidatos/SKILL.md).
- [Construir figuras](skills/simce-construir-figuras/SKILL.md).
- [Revisar la integridad](skills/simce-revisar-integridad/SKILL.md).
- Plantillas de [encargo](plantillas/encargo.json), [resolución independiente](plantillas/resolucion-ciega.json) y [dictamen](plantillas/dictamen.json). Son formularios pendientes, no órdenes ni aprobaciones emitidas.
- [Dependencias y límites de portabilidad](DEPENDENCIAS.md).
- [Casos de uso para comprobar el procedimiento](PRUEBAS-DE-USO.md).
- [Resultados y límites de las comprobaciones ejecutadas](VERIFICACION.md).

## Prueba local, sin base de datos

Desde `E:\DEEPSEEK\ACRO-WOM\W-SIMCE`:

```powershell
node instrucciones-deepseek/herramientas/validar.mjs instrucciones-deepseek/ejemplos/lote-ejemplo.json
node instrucciones-deepseek/herramientas/preparar.mjs instrucciones-deepseek/ejemplos/lote-ejemplo.json
node instrucciones-deepseek/herramientas/pruebas.mjs
node instrucciones-deepseek/herramientas/comprobar-paquete.mjs
```

La preparación deja un directorio nuevo en `instrucciones-deepseek/entregas/`: vista de revisión con claves ocultas, paquete ciego, sobre de respuestas separado, renders y manifiesto con hashes. No modifica archivos existentes. Abrir el `index.html` de esa entrega para inspeccionar las figuras.

Las herramientas requieren las dependencias ya instaladas en este proyecto. No usan `.env`, Prisma, credenciales, API de DeepSeek ni conexión a la aplicación. El dibujo reutiliza `scripts/codex-4b/componente.mjs`, que compila el componente real de la app.

## Qué no significa «certificar» aquí

El resultado será un **dictamen de revisión técnica y de contenido de una versión concreta**, con alcance y evidencia. No es certificación oficial SIMCE, equivalencia estadística con una prueba oficial ni garantía de ausencia de errores.

La dificultad estimada y la dificultad observada son cosas distintas. Sin respuestas de estudiantes no se informan porcentajes de dificultad, discriminación ni confiabilidad como si estuvieran medidos. La documentación del [CPEIP sobre construcción de pruebas](https://www.cpeip.cl/faqs/como-se-construye-la-prueba-ecep/) distingue revisión de contenidos, juicio de especialistas y evidencia de pilotaje. Se usa como referencia metodológica; no se trasladan sus umbrales de ECEP a este banco escolar.

## Estado de la entrega

Solo se prepararon instrucciones y herramientas. No se encargó a DeepSeek un lote, no se generaron cargos de API y no se importó contenido. El archivo de ejemplo es didáctico, no un ítem aprobado para publicar. La auditoría previa de los 246 ítems de Matemática queda detenida y no se declara terminada.

Perfil de ejecución: implementación de documentación y herramientas locales, con revisión de sus pruebas. Se conserva la configuración actual; el selector exacto del modelo y esfuerzo no está verificado. Sin subagentes. Las skills `skill-creator` y `execution-profiles` guiaron la estructura reutilizable y los límites de escritura a esta carpeta; los archivos de la app y del banco permanecen fuera del alcance.
