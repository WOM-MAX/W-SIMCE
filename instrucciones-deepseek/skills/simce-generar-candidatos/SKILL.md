---
name: simce-generar-candidatos
description: Preparar candidatos nuevos de Matemática de cuarto básico para W-SIMCE en JSON local, con OA comprobado, cuatro opciones y solución propuesta. Usar ante un encargo de generación; no para importar, editar el banco o aprobar contenido.
---

# Generar candidatos W-SIMCE

## Antes de actuar

Leer completas las referencias obligatorias: [método](../../METODO.md), [alcance](../../01-ALCANCE.md), [contenido](../../03-CONTENIDO.md) y [contrato](../../07-FORMATO.md). Consultar el [esquema](../../esquema-lote.json) y [ejemplo](../../ejemplos/lote-ejemplo.json) antes de producir el JSON.

Si solo se pidió leer instrucciones, devolver comprensión y pendientes; no generar. Si el encargo corresponde a otro curso o asignatura, pedir ampliación de alcance. No convertir el piloto propuesto en un encargo ya autorizado.

## Procedimiento

1. Confirmar encargo y elegir o comprobar OA y fuentes oficiales según lo delegado. Declarar lo que no pueda verificarse.
2. Definir tarea y procedimiento mínimo. Resolver sin opciones. Verificar unidades y condiciones que alteren la respuesta.
3. Redactar enunciado y cuatro alternativas semánticamente distintas. Justificar cada distractor mediante un error concreto. Volver a resolver todas las opciones para comprobar la clave propuesta y la unicidad.
4. Si necesita figura, leer completa [simce-construir-figuras](../simce-construir-figuras/SKILL.md) y aplicar sus referencias antes de dibujar.
5. Guardar archivo nuevo en `instrucciones-deepseek/candidatos/`. Usar códigos locales y versión candidata, sin identificadores de base ni estados de aprobación.
6. Ejecutar validador y preparación documentados en el contrato. Analizar advertencias; no suprimirlas del informe. Abrir los renders cuando exista herramienta visual y registrar cualquier comprobación que falte.
7. Entregar rutas, resultados y pendientes para la revisión independiente. No abrir ni editar el registro de resolución del revisor para orientar su respuesta.

## Límites y cierre

No leer credenciales ni usar banco real, Prisma, cargadores, semillas, git o servidor. No cambiar controles, esquema ni renderer. Las herramientas pueden crear nuevas entregas en `entregas/`; no sobrescribir anteriores.

Pasar el formato no acredita matemáticas, currículo o tamaño. El generador hace autocontrol, no aprueba su resultado. Un rechazo exige una versión nueva; no alterar la explicación para defender una clave falsa.

Si la fuente, herramienta o figura necesaria no puede comprobarse, identificar el pendiente y detener la parte afectada. No inventar evidencia ni declarar el lote publicado.
