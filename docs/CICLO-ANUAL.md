# Ciclo de vida de los datos y año escolar

Documento de diseño. El colegio opera por años escolares (marzo a diciembre); la
plataforma todavía no lo refleja.

## 1. Lo que el modelo ya resuelve bien

La separación más importante ya está hecha y es la correcta:

| Concepto | Modelo | Significado |
|---|---|---|
| Identidad | `Estudiante` | La persona. Persiste mientras exista el colegio |
| Vínculo anual | `Matricula` | Ese estudiante, en ese curso, ese año. Tiene estado y fecha |
| Curso | `Curso` con `anioId` | Un curso pertenece a un solo año; no se reutiliza |
| Año | `AnioEscolar` | `colegioId + anio + estado`, único por colegio |

Es el mismo patrón de Napsis: el estudiante es uno, y cada año se matricula de nuevo.
Nada se duplica.

## 2. Lo que falta

- **Nadie filtra por año.** `anioId` existe en el esquema, pero en `app/` y `lib/` no
  se usa en ninguna consulta: lo único que lo crea es el seed. La aplicación vive en
  un año implícito.
- **El ensayo no tiene año.** Hoy se deduce por las asignaciones al curso, pero un
  ensayo sin asignar queda sin año.
- **No hay selector de año**, ni cierre, ni promoción, ni vista histórica.

Estado actual de los datos: 1 año (2026, activo), 8 cursos, 289 estudiantes
matriculados, 19 ensayos, **0 asignaciones y 0 intentos**. Es el mejor momento para
implantar el ciclo: no hay historial que reconstruir.

## 3. La idea central: la foto académica

Cada año es una foto. Al seleccionar 2026 se ve el colegio como estaba ese año: sus
cursos, sus estudiantes, sus ensayos y sus resultados. Al seleccionar 2027, la foto
nueva. Los años anteriores no se borran ni se "pierden": quedan consultables en
solo lectura.

Un egresado no desaparece porque terminó IV medio: pasa a ser una ficha histórica
con su trayectoria completa.

## 4. Calendario del año

| Periodo | Estado | Qué ocurre |
|---|---|---|
| Enero – febrero | `PLANIFICACION` | Se crea el año, los cursos y la nómina. Se promueven estudiantes y se asignan docentes. Nadie rinde todavía |
| 1 de marzo | `ACTIVO` | Arranca la operación: ensayos, asignaciones, rendiciones |
| Marzo – diciembre | `ACTIVO` | Trabajo normal del año |
| 21 de diciembre | `CERRADO` | Se bloquea la escritura. Solo lectura, certificados y estadísticas |
| Enero siguiente | histórico | Al crear el año nuevo, el anterior queda como histórico permanente |

Las fechas (1 de marzo, 21 de diciembre) deben ser configurables por año: un colegio
puede adelantar el cierre o extenderlo.

Regla: **un solo año activo a la vez** por colegio.

## 5. Estados del año escolar

```
PLANIFICACION ──▶ ACTIVO ──▶ CERRADO ──▶ (histórico)
```

- `PLANIFICACION`: se puede editar todo, nadie rinde.
- `ACTIVO`: operación normal.
- `CERRADO`: lectura para todos, incluido el administrador. Reabrir exige una acción
  explícita y queda auditada.

## 6. El proceso anual, paso a paso

| # | Paso | Quién | Cuándo |
|---|---|---|---|
| 1 | Crear el año escolar | ADMIN | Enero |
| 2 | Crear los cursos del año (copiar estructura del anterior y ajustar) | ADMIN | Enero |
| 3 | Promover estudiantes: el sistema sugiere nivel siguiente y misma letra | ADMIN | Enero – febrero |
| 4 | Revisar la nómina: repitentes, retirados del año anterior, ingresos nuevos | ADMIN | Febrero |
| 5 | Asignar docentes y coordinadores a los cursos | ADMIN | Febrero |
| 6 | Activar el año | ADMIN | 1 de marzo |
| 7 | Operación normal | Docentes, UTP | Marzo – diciembre |
| 8 | Cerrar el año: bloqueo y reporte de cierre | ADMIN | 21 de diciembre |
| 9 | Revisar y aprobar el cierre | DIRECCION | Diciembre |

La promoción **nunca copia resultados ni intentos**: solo identidades y estructura.
Un alumno que repite se matricula en el mismo nivel, no se duplica su ficha.

## 7. Reglas de integridad

1. **Un estudiante no se borra por egresar.** Se gradúa o se retira. El borrado
   definitivo queda para errores de carga y solo mientras no tenga intentos.
2. **El historial es inmutable.** Resultados, respuestas e intentos no se editan;
   es la misma regla que ya aplica `IntentoItem` al copiar la metadata del ítem.
3. **Un curso pertenece a un solo año.** No se reutiliza el curso de 2026 para 2027.
4. **Un ensayo pertenece al año en que se creó.** Hay que agregarle `anioId`.
5. **El alcance de un docente se calcula por año:** sus cursos del año activo, no los
   de años anteriores.
6. **Los años cerrados no aceptan escritura**, ni siquiera del administrador, salvo
   reapertura auditada.

## 8. Un detalle que va a doler si no se corrige ahora

El código de acceso actual incluye el curso: `W4B-01` significa 4° básico B, alumno 1.
Cuando ese estudiante pase a 5° básico, el código miente. Y si se regenera, el alumno
pierde el código que ya memorizó.

Recomendación: **el código de acceso debe ser estable y no contener el curso**. Un
identificador por estudiante que lo acompañe toda su vida escolar, con el curso
mostrado aparte en la interfaz. La migración es simple: conservar el código actual
como alias durante un año y emitir el nuevo.

## 9. Consultas históricas

- **Selector de año** visible en la barra, como en Napsis. Por defecto, el año activo.
- En años cerrados, todos los botones de escritura desaparecen.
- **Ficha del estudiante con línea de tiempo**: año, curso, ensayos rendidos,
  resultados y certificados.
- **Comparaciones entre años** del mismo nivel y letra: evolución del curso.
- **Estadísticas del colegio por año**: cobertura, participación, resultados.

## 10. Retención y privacidad

- **Resultados académicos**: se conservan mientras el estudiante esté matriculado y
  después, el tiempo que defina el colegio (sugerencia: mientras sea necesario para
  certificados y trayectoria).
- **Respuestas ítem por ítem de egresados**: decidir si se conservan. Conservarlas da
  trazabilidad; no conservarlas reduce exposición de datos de menores.
- **Auditoría**: doce meses, como ya está definido, con purga a cargo del administrador.
- **Borrado**: solo ADMIN, con registro, y nunca sobre un estudiante con historial.

## 11. Qué hay que construir

| Pieza | Detalle |
|---|---|
| `Ensayo.anioId` | Migración + relleno con el año actual |
| Selector de año | En la barra del panel; se guarda en cookie o sesión |
| Filtro por año | En todas las consultas: cursos, estudiantes, ensayos, reportes |
| Administración de años | Crear, activar y cerrar |
| Asistente de promoción | Sugerencia de curso destino y revisión manual |
| Vista histórica del estudiante | Línea de tiempo por año |
| Cierre de año | Bloqueo de escritura y reporte de cierre |

## 12. Decisiones pendientes

1. ¿Las fechas de inicio y cierre son fijas (1 mar / 21 dic) o configurables por año?
   *Propuesta: configurables, con esos valores por defecto.*
2. ¿Se puede reabrir un año cerrado? *Propuesta: sí, solo ADMIN y auditado.*
3. ¿Se conservan las respuestas de los egresados? *Propuesta: sí los resultados;
   las respuestas, según lo que exija la normativa.*
4. ¿El código de acceso se vuelve estable? *Propuesta: sí, antes de que haya más
   estudiantes.*
5. ¿Un curso repitente conserva la misma letra? *Propuesta: se define en la revisión
   manual del paso 4.*
