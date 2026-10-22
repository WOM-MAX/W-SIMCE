# Alcance, permisos y estados

## Reparto propuesto

| Responsable | Entrega | No hace en este circuito |
|---|---|---|
| DeepSeek | Enunciados, opciones, solución propuesta, distractores, OA y primitivas en JSON | Escribir en el banco ni aprobar su propio resultado |
| Herramientas locales | Control de formato, duplicados básicos, hashes y renders | Resolver matemáticamente un ítem ni acreditar su nivel |
| Codex | Resolución independiente, contraste, revisión visual y dictamen con evidencia | Declarar validez psicométrica sin datos ni publicar por su cuenta |
| Usuario | Objetivo, prioridad, aceptación del piloto y permiso de publicación | Tener que descubrir por sí mismo todos los errores técnicos |

Esta tabla propone la ampliación del reparto anterior: DeepSeek podrá producir **archivos candidatos nuevos**, no alterar el banco existente. No modifica los permisos de la aplicación ni de PostgreSQL.

## Límite técnico

- Solo Matemática de 4° básico para el piloto inicial. Lectura y otros niveles requieren encargo separado.
- DeepSeek escribe candidatos únicamente en `candidatos/`; las herramientas documentadas pueden generar nuevas salidas en `entregas/`. No altera guías, esquema ni controles para hacer pasar un candidato.
- Prohibido leer o copiar credenciales, estudiantes, cuentas, respuestas o intentos.
- Prohibido usar Prisma, cargadores, semillas, migraciones, comandos de git o detener el servidor 3005.
- No crear, modificar o borrar registros de `Item`, `ItemVersion`, `Alternativa`, `Figura` o `TextoLectura`.
- No reemplazar las figuras ya aprobadas, sus ejemplos maestros ni las copias históricas.
- No ejecutar `prisma/cargar-items.mjs`: el código inspeccionado crea `Item` con estado `APROBADO`. Su importación no forma parte de este circuito.

## Estados del proceso

`CANDIDATO` → control automático → revisión independiente → `REQUIERE_AJUSTES`, `RECHAZADO` o `APTO_EN_REVISION_TECNICA`.

`APTO_EN_REVISION_TECNICA` es un dictamen documental, no el valor `APROBADO` del esquema de la base. No habilita una importación automática. La publicación exige autorización expresa y un procedimiento separado de respaldo, transacción y comprobación.

Toda modificación de un enunciado, una opción, un dato o una figura cambia su hash y obliga a revisar esa nueva versión. No se traslada una aprobación al contenido cambiado solo porque conserve el código.

## Histórico

La relación `figuraId` está en `Item`, mientras los ensayos guardan `ItemVersion`. Clonar una figura y reenlazar el mismo ítem no congela su histórico. Por eso esta fase no toca recursos publicados ni promete conservar ensayos mediante un simple clonado.
