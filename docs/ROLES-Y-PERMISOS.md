# Roles y permisos de W-SIMCE

Documento de diseño. Describe el modelo propuesto, no lo que hoy está programado.
Estado actual: 3 roles (`ADMIN`, `UTP`, `DOCENTE`), alcance único por colegio, sin
propiedad de ensayos y sin cursos asignados por persona.

## 1. El problema de fondo: dos ejes distintos

- **Capacidad**: qué acciones puede ejecutar (crear ensayos, importar estudiantes,
  crear cuentas, purgar auditoría).
- **Alcance**: sobre qué datos las ejecuta (todo el colegio, un nivel, ciertos cursos).

Si un docente y un coordinador tienen las mismas capacidades y solo cambia el
conjunto de cursos, **no son dos roles distintos**: son el mismo rol con distinto
alcance. La dirección sí necesita un rol aparte, porque pide todo el alcance y
ninguna capacidad de gestión.

## 2. Los cuatro roles

| Rol | Para quién | Alcance | En una frase |
|---|---|---|---|
| `ADMIN` | Quien administra la plataforma | Colegio completo | Mantiene la plataforma y los datos; puede todo |
| `DIRECCION` | Dirección del colegio | Colegio completo | Observa resultados y estadísticas para decidir; no modifica nada |
| `UTP` | Coordinación académica | Los cursos a su cargo | Las mismas capacidades del docente, sobre su nivel |
| `DOCENTE` | Docente de aula | Los cursos a su cargo | Gestiona su actividad en sus cursos |

`UTP` y `DOCENTE` comparten la matriz. La única diferencia es cuántos cursos tienen
asignados. `DIRECCION` es **solo lectura**. `ADMIN` es el único con atribuciones
técnicas.

## 3. Cómo se define el alcance

Tabla `MembresiaCurso`: relaciona una persona con los cursos que atiende.

- A un docente se le marcan sus cursos (4°A, 4°B).
- A un coordinador, todos los de su nivel de una sola vez (Básica o Media), con la
  posibilidad de ajustar un caso puntual.

Es más flexible que guardar el "nivel" en la membresía y usa una sola regla para
los dos roles.

## 4. Atribuciones por rol

### `DOCENTE` — su aula

**Hace:**
- Crea ensayos con el banco del colegio y los asigna a sus cursos.
- Corrige sus ensayos: amplía tiempo, anula intentos.
- Consulta reportes y exporta CSV de sus cursos.
- Da de alta estudiantes en sus cursos, corrige sus datos y los retira.
- Restablece el PIN de un estudiante de sus cursos.
- Imprime y descarga PDF y Word de sus ensayos.

**No hace:**
- Ver ensayos de otros docentes (salvo los que le asignaron explícitamente).
- Ver resultados de cursos que no atiende.
- Crear cuentas de personal ni cambiar claves de colegas.
- Borrar definitivamente un estudiante.
- Modificar la configuración del colegio ni ver la auditoría.

### `UTP` — su nivel

**Hace:** todo lo del docente, sobre los cursos de su nivel, y además:
- Ve y corrige los ensayos de todos los docentes de su nivel.
- Importa planillas de estudiantes de su nivel.
- Compara resultados entre cursos de su nivel.

**No hace:**
- Crear cuentas de personal ni asignar roles o cursos.
- Borrar definitivamente estudiantes o registros.
- Cambiar la configuración del colegio.
- Ver la auditoría del sistema.

### `DIRECCION` — observa y decide

**Hace:**
- Ve resultados por curso, nivel, eje, habilidad y dimensión, de todo el colegio.
- Compara ensayos y períodos: evolución, cobertura, participación.
- Exporta reportes para el consejo o la reunión de apoderados.
- Consulta el estado general de la plataforma (cuántos ensayos, cuántos cursos
  activos, uso por nivel).

**No hace:**
- Crear, editar ni borrar ensayos; no asigna ni corrige.
- Crear cuentas, cambiar claves ni asignar cursos.
- Importar planillas ni dar de alta estudiantes.
- Purgar auditoría ni tocar la configuración técnica.

Es un rol de **solo lectura**. Su valor está en decidir con información, no en
operar la plataforma.

### `ADMIN` — mantiene la plataforma y los datos

**Cuentas y accesos**
- Crea y desactiva cuentas de personal; asigna rol y cursos.
- Restablece claves y fuerza el cambio cuando corresponde.
- Administra su propia cuenta y la de los demás administradores.

**Datos**
- Importación masiva de estudiantes de todo el colegio.
- Corrección masiva de datos y borrado definitivo, con advertencia.
- Reasigna el dueño de un ensayo cuando un docente deja el colegio.
- Restaura desde respaldo cuando hay un error de carga.

**Operación técnica (fuera de la interfaz, pero de su cargo)**
- Despliegues, migraciones de esquema y respaldos de la base.
- Monitoreo del estado del servicio y rotación de credenciales.
- Purga de auditoría según la política de retención del colegio.
- Mantenimiento del banco de ítems.

**Diagnóstico**
- "Ver como" otro rol para comprobar qué ve cada uno (ver sección 5).

**Límite explícito:** aunque técnicamente pueda, **no califica ni modifica
resultados de estudiantes**. Si alguna vez tiene que hacerlo para reparar un dato,
queda registrado en la auditoría con su nombre. Un administrador técnico no es un
supervisor académico.

## 5. "Ver como": la función tipo Moodle

Permite al administrador entrar a la plataforma con los ojos de otro rol —docente,
coordinador o estudiante— para comprobar cómo funciona el sistema y reproducir un
problema.

Reglas:

1. **Solo `ADMIN`.** Ningún otro rol puede suplantar.
2. **Por defecto, solo lectura.** Se ve exactamente lo que vería esa persona, pero
   no se puede escribir en su nombre. Un modo con escritura, si alguna vez se
   necesita para soporte, exige confirmación explícita.
3. **Banner permanente** en pantalla: "Estás viendo como Docente · 4°A — Volver a
   administrador". Nunca debe haber duda de en qué modo se está.
4. **Todo queda registrado** con dos identidades: quién suplantó y a quién. Un
   administrador no puede actuar de forma anónima.
5. **Duración corta.** La sesión de "ver como" expira sola (30 a 60 minutos).
6. **Estudiantes: solo lectura**, por tratarse de datos de menores.
7. **Nunca para evadir la auditoría** ni para calificar.

## 6. Matriz de permisos

Leyenda: **Todo** = colegio completo · **Alcance** = sus cursos · **—** = no puede ·
**Ver** = solo lectura.

### Trabajo diario

| Acción | DOCENTE | UTP | DIRECCION | ADMIN |
|---|---|---|---|---|
| Ingresar a la plataforma | Sí | Sí | Sí | Sí |
| Inicio con resumen | Lo suyo | Su nivel | Todo | Todo |
| Consultar el banco de ítems | Sí (compartido) | Sí | Sí | Sí |
| Generar un ensayo | Sí | Sí | — | Sí |
| Ver ensayos | Los suyos y los asignados | Su alcance | Ver todos | Todos |
| Renombrar, duplicar, eliminar ensayo | Los suyos | Su alcance | — | Todos |
| Asignar un ensayo a un curso | Sus cursos | Su alcance | — | Cualquiera |
| Imprimir, PDF y Word | Los suyos | Su alcance | Ver | Todos |
| Ver la corrección | Sus cursos | Su alcance | Ver todo | Todo |
| Ampliar tiempo o anular intento | Sus cursos | Su alcance | — | Cualquiera |
| Reportes por curso y por alumno | Sus cursos | Su alcance | Todo | Todo |
| Exportar CSV | Sus cursos | Su alcance | Todo | Todo |
| Estadísticas comparadas del colegio | — | Su nivel | Todo | Todo |

### Estudiantes

| Acción | DOCENTE | UTP | DIRECCION | ADMIN |
|---|---|---|---|---|
| Ver la nómina | Sus cursos | Su alcance | Ver todo | Todos |
| Crear estudiante | Sus cursos | Su alcance | — | Cualquiera |
| Editar datos | Sus cursos | Su alcance | — | Todos |
| Retirar estudiante | Sus cursos | Su alcance | — | Todos |
| Borrar definitivamente | — | — | — | Sí |
| Importar planilla Excel | Sus cursos | Su alcance | — | Todo |
| Descargar la plantilla | Sí | Sí | — | Sí |
| Restablecer PIN | Sus cursos | Su alcance | — | Todos |

### Administración y mantención

| Acción | DOCENTE | UTP | DIRECCION | ADMIN |
|---|---|---|---|---|
| Ver cortes de logro y visibilidad de resultados | — | Ver | Ver | Sí |
| Editar cortes de logro | — | — | — | Sí |
| Decidir si el estudiante ve sus resultados | — | — | — | Sí |
| Crear cuentas de personal y asignar rol | — | — | — | Sí |
| Asignar cursos a cada funcionario | — | — | — | Sí |
| Restablecer la clave de otro funcionario | — | — | — | Sí |
| Reasignar el dueño de un ensayo | — | — | — | Sí |
| Ver la auditoría | — | — | Ver | Ver |
| Purgar registros de auditoría | — | — | — | Sí |
| Mantenimiento del banco de ítems | — | — | — | Sí |
| Importación masiva de estudiantes | — | Su nivel | — | Todo |
| Respaldos, migraciones y despliegues | — | — | — | Sí |
| "Ver como" otro rol | — | — | — | Sí |

## 7. Ciclo de vida del dato

| Etapa | Quién |
|---|---|
| Alta individual de un estudiante | Docente o UTP en sus cursos; ADMIN en cualquiera |
| Importación masiva | UTP en su nivel; ADMIN en todo el colegio |
| Corrección de datos | Igual que el alta |
| Retiro (deja de estar activo) | Docente o UTP en sus cursos; ADMIN |
| Borrado definitivo | Solo ADMIN, con advertencia y registro |
| Reasignación de ensayos | Solo ADMIN |
| Respaldo y restauración | ADMIN, fuera de la interfaz |
| Migraciones de esquema | ADMIN, en el despliegue |
| Purga de auditoría | ADMIN, según la política del colegio |

Nota importante: borrar un estudiante arrastra en cascada sus intentos, respuestas y
resultados. Por eso el borrado definitivo queda en `ADMIN` y el resto de los roles
usa "retirar", que conserva el historial.

## 8. Reglas que evitan los agujeros típicos

1. **Visible = lo que creé + lo que me asignaron.** Si la coordinación arma un
   ensayo y lo asigna al curso de un docente, ese docente debe verlo y corregirlo.
2. **Nada de ensayos huérfanos.** Al irse un docente, sus ensayos pasan a la
   coordinación o a dirección mediante reasignación.
3. **El banco de ítems es del colegio.** No se aísla por docente, o cada uno termina
   duplicando el trabajo.
4. **Borrar no es retirar** (ver sección 7).
5. **Ocultar el botón no es seguridad.** El alcance se aplica en el servidor, en cada
   consulta y en cada endpoint. Hoy un POST directo al id de un ensayo ajeno funciona.
6. **La suplantación se registra siempre** con las dos identidades.

## 9. Riesgos del administrador técnico único

Concentrar cuentas, datos y mantención en una sola persona es cómodo, pero tiene
tres consecuencias que conviene aceptar con los ojos abiertos:

- **Punto único de falla.** Si esa persona no está, nadie puede crear cuentas ni
  restaurar un respaldo. Mínimo dos administradores técnicos, o credenciales
  custodiadas por el colegio.
- **Acceso total a datos de menores.** El administrador puede ver respuestas de
  cualquier estudiante. Debe existir un acuerdo escrito de confidencialidad y la
  auditoría debe ser suficiente para reconstruir qué hizo.
- **Concentración de poder.** Quien administra las cuentas podría, en teoría, mirar
  resultados antes de que se publiquen. No se resuelve con software, se resuelve con
  política interna y trazabilidad.

## 10. Lo que hay que cambiar en el código

| Cambio | Detalle |
|---|---|
| Rol `DIRECCION` | Agregar al enum y a la pantalla de alta de personal; sin permisos de escritura |
| `MembresiaCurso` | Tabla nueva: qué cursos atiende cada persona |
| `Ensayo.creadoPorId` | Dueño del ensayo; hoy no existe |
| `Asignacion.docenteId` | Ya está en el modelo, pero nunca se escribe: poblarlo al asignar |
| `alcanceDe(sesion)` | Una sola función que devuelve el filtro según rol y cursos |
| Guardas en endpoints | Duplicar, renombrar, eliminar, PDF, Word, CSV, ampliar y anular |
| Filtros en pantallas | Ensayos, corrección, reportes, inicio |
| Modo "ver como" | Marca en la sesión, banner, caducidad y registro en auditoría |
| Datos existentes | Los 19 ensayos actuales quedan sin dueño: asignarlos a `ADMIN` |

## 11. Decisiones pendientes

1. ~~¿La dirección puede fijar los cortes de logro?~~ **Resuelto:** los edita el
   administrador; dirección solo los ve (ver sección 12).
2. ¿La dirección ve la auditoría? *Propuesta: sí, en lectura.*
3. ¿"Ver como" permite escribir o solo mirar? *Propuesta: solo mirar por defecto.*
4. ¿Cuántos administradores técnicos habrá? *Propuesta: dos.*
5. ¿El administrador técnico puede calificar? *Propuesta: no; si lo hace para
   reparar, queda auditado.*

## 12. Niveles de logro

Son tres, con nombres oficiales: **Insuficiente, Elemental y Adecuado**.

La definición oficial no usa porcentajes: el nivel se asigna por **puntajes de corte
sobre la escala SIMCE**, fijados por paneles de especialistas y equiparados entre
aplicaciones. Por eso un ensayo propio con 60% de logro no equivale a "Elemental"
en términos SIMCE: depende de la dificultad de cada ítem y de la escala de esa
prueba.

Decisión adoptada:

- Se mantienen los tres nombres, porque son los que el colegio ya usa y entiende.
- Los cortes se configuran **por nivel educativo** (4° básico, 6°, 8°, II medio) y
  no con un solo par para todo el colegio.
- La pantalla muestra el aviso: *"Niveles referenciales del colegio; no equivalen a
  los niveles oficiales SIMCE."*
- Los edita el administrador; dirección los ve.

Detalles de implementación:

- Tabla nueva de cortes por `colegioId` y `nivelId`; los valores actuales (50/75) se
  copian a todos los niveles como punto de partida.
- El nivel se guarda al corregir cada intento. Cambiar los cortes **no reescribe el
  pasado**: recalcular resultados históricos debe ser una acción explícita, no un
  efecto colateral.
- Con 30 ítems, cada pregunta vale 3,3 puntos: dos alumnos con 14 y 15 aciertos no
  están en niveles distintos. La banda se muestra como orientación.
- Las dimensiones (eje, habilidad, bloom, dificultad) guardan solo porcentaje y no
  llevan banda: con pocas preguntas por dimensión, el semáforo sería ruido.

## 13. Resumen en una línea

- **Docente**: mi actividad, en mis cursos.
- **Coordinación**: lo mismo, en los cursos de mi nivel.
- **Dirección**: ve todo y no toca nada.
- **Administrador**: mantiene la plataforma, las cuentas y los datos; puede ver
  como cualquiera, y todo lo que hace queda registrado.
