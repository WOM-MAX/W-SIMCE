# Plan de implementación

Deriva de tres documentos de diseño: `docs/ROLES-Y-PERMISOS.md`,
`docs/CICLO-ANUAL.md` y la decisión sobre niveles de logro (sección 12 del primero).

## Principios del plan

1. **Primero lo que protege datos.** El alcance por cursos y la propiedad de los
   ensayos van antes que cualquier función nueva.
2. **Cada fase deja el sistema funcionando.** Nada de ramas largas: una migración,
   un despliegue, una verificación.
3. **Migraciones aditivas.** Columnas nuevas y tablas nuevas; nunca borrar ni
   renombrar en la misma fase en que se agrega. Así el despliegue anterior sigue
   funcionando y el rollback es un redeploy.
4. **El alcance se aplica en el servidor.** Un helper único, no parches por pantalla.
5. **Nada se borra.** El historial académico es inmutable; lo que sobra se retira o
   se archiva.

## Resumen de fases

| Fase | Contenido | Depende de | Esfuerzo |
|---|---|---|---|
| 0 | Respaldo y línea base | — | 1 sesión corta |
| 1 | Alcance, propiedad y rol `DIRECCION` | 0 | 3 sesiones |
| 2 | Niveles de logro por nivel educativo | 0 | 1–2 sesiones |
| 3 | Año escolar: selector, filtros y bloqueo | 1 | 2 sesiones |
| 4 | Promoción, cierre y código estable | 3 | 3 sesiones |
| 5 | Panel de dirección | 1 y 3 | 2–3 sesiones |
| 6 | "Ver como" | 1 | 1–2 sesiones |
| 7 | Endurecimiento y cierre | 1 a 6 | 1–2 sesiones |
| 8 (futura) | Referencia SIMCE: mostrar los resultados oficiales junto a los propios | 3 y 5 | 1–2 sesiones |

Total estimado: entre 13 y 18 sesiones de trabajo, con pruebas y despliegue incluidos,
sin contar la Fase 8.

---

## Fase 0 — Respaldo y línea base

**Objetivo:** poder volver atrás sin drama.

- Respaldo completo de Neon antes de tocar el esquema (`pg_dump` con la cadena
  `DIRECT_URL`, no la pooled).
- Verificar que el respaldo se puede restaurar en una base temporal: un respaldo sin
  prueba de restauración no es un respaldo.
- Anotar el commit desplegado y el estado de `/api/health` como referencia.
- Confirmar que el CI ([.github/workflows/ci.yml](.github/workflows/ci.yml)) construye
  la imagen en verde.

**Aceptación:** respaldo restaurado en una base de prueba con los 289 estudiantes y
los 19 ensayos.

---

## Fase 1 — Alcance, propiedad y rol `DIRECCION`

**Objetivo:** que cada uno vea solo lo suyo. Es la fase que protege los datos de
menores y la que hoy tiene el agujero más grande.

### Cambios de esquema (una migración)

- `Rol`: agregar `DIRECCION`.
- Tabla `MembresiaCurso` (`membresiaId`, `cursoId`), única por par.
- `Ensayo.creadoPorId` (opcional, FK a `Usuario`, `onDelete: SetNull`).
- Índices por `creadoPorId`.

### Código

| Archivo | Cambio |
|---|---|
| [lib/auth.ts](lib/auth.ts) | `RolUsuario` con `DIRECCION`; helpers `esTecnico()`, `veTodo()`, `cursosDe(sesion)` |
| `lib/alcance.ts` (nuevo) | `alcanceEnsayo(sesion)` y `alcanceCurso(sesion)` devuelven filtros de Prisma; `exigirEnsayo()` y `exigirCurso()` lanzan si no corresponde |
| [lib/ensayos.ts](lib/ensayos.ts) | `ensayosDelColegio` pasa a `ensayosVisibles(sesion)` |
| `app/api/ensayos/[id]/*` | Guarda en duplicar, renombrar, eliminar, PDF y Word |
| `app/api/intentos/*` | Guarda en ampliar y anular |
| `app/api/reportes/csv`, `app/api/estudiantes/[id]/exportar` | Guarda por curso |
| `app/api/ensayos/asignar` | Escribe `docenteId` al asignar |
| `app/ensayos`, `app/correccion`, `app/reportes`, `app/panel` | Consultas con alcance |
| `app/admin` | Selector de cursos por persona; rol `DIRECCION` en el alta |

### Datos

- Los 19 ensayos existentes se asignan al administrador actual.
- Se cargan los cursos de cada docente y coordinador (hoy no hay ninguno asignado).

### Pruebas

Matriz por rol: docente A no ve el ensayo de docente B, ni por pantalla ni por URL ni
por POST directo; coordinador ve su nivel y no el resto; dirección no puede escribir;
administrador ve todo.

**Aceptación:** ningún endpoint acepta un id fuera de alcance; la matriz de pruebas
pasa completa.

---

## Fase 2 — Niveles de logro por nivel educativo

**Objetivo:** que los informes no prometan una equivalencia con SIMCE que no existe.

### Esquema

- Tabla `CorteNivel` (`colegioId`, `nivelId`, `corteElemental`, `corteAdecuado`),
  única por par.
- Relleno: copiar 50/75 a los cuatro niveles actuales.

### Código

| Archivo | Cambio |
|---|---|
| [lib/correccion.ts](lib/correccion.ts) | El corte se lee por el nivel del ensayo del intento, no por colegio |
| `app/admin` | Tabla de cortes por nivel; se retiran los dos campos globales |
| `app/reportes`, `app/correccion` | Aviso: "Niveles referenciales del colegio; no equivalen a los oficiales SIMCE" |

### Nota

El nivel se guarda al corregir. Cambiar cortes no reescribe el pasado; un recálculo
histórico, si se quiere, es un script aparte con confirmación explícita.

**Aceptación:** dos niveles con cortes distintos clasifican distinto el mismo
porcentaje; el aviso aparece en los informes.

---

## Fase 3 — Año escolar

**Objetivo:** que 2026 y 2027 convivan sin mezclarse.

### Esquema

- `Ensayo.anioId` (FK a `AnioEscolar`), relleno con 2026.
- `AnioEscolar.fechaInicio` y `fechaCierre` (por defecto 1 de marzo y 21 de diciembre).

### Código

| Archivo | Cambio |
|---|---|
| `lib/anio.ts` (nuevo) | `anioActual(sesion)`: cookie validada contra los años del colegio; si no hay, el activo |
| `components/panel.tsx` | Selector de año en la barra |
| Consultas de cursos, estudiantes, ensayos, asignaciones y reportes | Filtro por año |
| Guardas de escritura | Si el año no está `ACTIVO`, se rechaza (salvo reapertura de `ADMIN`, auditada) |
| `app/admin` | Crear, activar y cerrar año; un solo activo |

**Aceptación:** crear 2027 vacío y alternar años no mezcla datos; un año cerrado
rechaza cualquier POST.

---

## Fase 4 — Promoción, cierre y código estable

**Objetivo:** que marzo se pueda operar sin cargar 289 estudiantes a mano.

- **Asistente de promoción:** lista los estudiantes del año anterior por curso,
  sugiere nivel y letra siguientes, y permite marcar repitentes, retirados e ingresos
  nuevos antes de confirmar.
- **Matrículas del año nuevo:** creación idempotente; nunca copia intentos,
  asignaciones ni resultados.
- **Reporte de cierre:** conteos por curso, ensayos del año, participación y
  pendientes (ensayos sin corregir, estudiantes sin matrícula).
- **Código de acceso estable:** identificador sin curso, con el código anterior como
  alias durante un año. Decisión previa del punto 12 del documento de ciclo anual.

**Aceptación:** promover los 289 estudiantes con revisión manual, sin duplicar fichas
ni historial; el reporte de cierre cuadra con la nómina.

---

## Fase 5 — Panel de dirección

**Objetivo:** que la dirección decida con información, sin tocar datos.

- Vista agregada por año: resultados por nivel y curso, cobertura del banco,
  participación y evolución entre ensayos.
- Exportación a CSV.
- Solo lectura: sin botones de acción, sin formularios.

**Aceptación:** la directora ve todo el colegio y ningún POST le responde con éxito.

---

## Fase 6 — "Ver como"

**Objetivo:** que el administrador técnico compruebe lo que ve cada rol.

- Marca en la sesión (`verComo`) con rol, cursos y, si aplica, estudiante.
- Solo `ADMIN`; caducidad de 30 a 60 minutos.
- Banner permanente con el botón para volver.
- Solo lectura por defecto: las escrituras se rechazan mientras dura.
- Evento de auditoría con dos identidades: quién mira y a quién.

**Aceptación:** el administrador ve como docente sin poder escribir; el evento queda
registrado; la marca expira sola.

---

## Fase 7 — Endurecimiento y cierre

- Pantalla "Mi cuenta" para que cada persona cambie su propia clave (hoy nadie puede:
  solo se cambia desde `/admin`).
- Límite de intentos en `/activar` y refuerzo del freno de login.
- Confirmación explícita en borrados; "retirar" como acción por defecto.
- Revisión de respaldos y un runbook de operación (qué hacer si Neon falla, si el
  despliegue falla, cómo restaurar).
- Actualización de `README.md` y de los tres documentos de diseño.

---

## Fase 8 (futura) — Referencia SIMCE

**Objetivo:** poner los resultados oficiales del establecimiento al lado de los
propios, **sin calcularlos**.

Queda fuera del plan actual y se aborda cuando la plataforma tenga al menos un año de
historial propio.

### Reglas que la hacen honesta

1. **No se calculan niveles SIMCE.** Se cargan los resultados oficiales publicados por
   la Agencia de Calidad, por RBD del establecimiento.
2. **Solo donde SIMCE evalúa.** En 2026: 4° básico, 6° básico y II medio, en
   Matemática y Lectura. 8° básico no tiene referente este año, y la plataforma no
   debe insinuar que lo tiene.
3. **A nivel de colegio y de curso, nunca por alumno.** Los resultados oficiales no
   se publican por estudiante.
4. **Escalas en paralelo, no superpuestas.** Un ensayo propio y una prueba SIMCE no
   comparten escala: se muestran uno al lado del otro, con su origen rotulado.
5. **Asociado al año escolar**, que es lo que habilita el eje temporal.

### Qué construir

- Tabla `ResultadoSimce` (`colegioId`, `anio`, `nivelId`, `asignatura`, categoría o
  puntaje, fuente y fecha de carga).
- Carga manual desde planilla, con validación; sin scraping ni integraciones frágiles.
- Vista "Referencia SIMCE" dentro del panel de dirección: propio vs oficial, con la
  advertencia visible.

**Aceptación:** cargar los resultados oficiales del colegio y verlos junto a los del
año, sin que ninguna cifra propia pretenda reproducirlos.

**Depende de:** Fase 3 (año escolar) y Fase 5 (panel de dirección).

---

## Estrategia de despliegue

Para cada fase:

1. Migración aditiva + script de relleno con modo simulación (sin escribir).
2. Verificación del relleno sobre una copia o contando filas.
3. Commit y push: Railway ejecuta `prisma migrate deploy` y luego despliega.
4. Comprobación posterior: `/api/health`, rutas nuevas, y la matriz de pruebas del rol.
5. Si algo falla: redeploy del commit anterior. Las columnas nuevas quedan y no
   estorban.

**Rollback:** al ser aditivo, volver atrás es desplegar el commit previo. Ninguna fase
borra columnas ni renombra tablas.

## Riesgos

| Riesgo | Mitigación |
|---|---|
| Windows bloquea el motor de Prisma al regenerar | Detener `pnpm dev` antes de `prisma generate` |
| Una consulta queda sin filtro y filtra datos | Un solo helper de alcance; pruebas por rol en cada fase |
| El relleno de datos se aplica mal | Modo simulación y conteos antes de escribir |
| El cierre de año bloquea trabajo legítimo | Reapertura auditada para `ADMIN` |
| Concentración de poder en un administrador | Dos administradores y acuerdo de confidencialidad |

## Decisiones que necesito antes de empezar

1. **Código de acceso estable**: ¿se cambia ahora? (afecta la Fase 4)
2. **Fechas del año**: ¿1 de marzo y 21 de diciembre configurables? (Fase 3)
3. **Dirección y auditoría**: ¿ve la auditoría en solo lectura? (Fase 5)
4. **Dos administradores técnicos**: ¿quiénes? (operativo, no técnico)

## Qué no entra en este plan

- Equivalencia real con SIMCE (requiere calibración psicométrica). La Fase 8 solo
  **muestra** resultados oficiales; no los reproduce.
- Edición de ítems del banco desde la interfaz.
- Configuración por curso (hoy es por colegio).
- Aplicación móvil o notificaciones.
