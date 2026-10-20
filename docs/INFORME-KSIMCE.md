# Informe de ingeniería inversa: K-SIMCE AI

**Método:** inspección pasiva con REA sobre una sesión de Chrome con depuración remota
(`inspect_web_page` y descarga del bundle para analizarlo en local).
**Fecha:** 20 de octubre de 2026.
**Alcance:** solo estructura y comportamiento. No se copió código, textos, imágenes ni
marca. La aplicación propia se escribió desde cero.

## 1. Qué es realmente

K-SIMCE está construida sobre **Base44**, un generador de aplicaciones con IA. Se
deduce de las claves que deja en el almacenamiento local:

```
base44_from_url
base44_functions_version
base44_app_id
base44_analytics_session_id
```

Consecuencias:

- Un solo bundle de React, `assets/index-1LgMkkvj.js`, de 1,94 MB.
- El backend no es propio: son "funciones" y entidades gestionadas por Base44.
- El panel se titula "Tigra Dashboard", que es una plantilla de esa plataforma.
- Hay dependencia total del proveedor: sin Base44 no hay aplicación.

Nuestra arquitectura es distinta a propósito: Next.js con Prisma sobre PostgreSQL,
esquema relacional propio y corrección determinista. No hay bloqueo de proveedor.

## 2. Rutas declaradas en el bundle

22 rutas, extraídas de las cadenas de la aplicación:

```
admin, amigos, biblioteca-conceptos, chat, ensayos, ensayos-compartidos,
forgot-password, historial-sesiones, intelligence, login, mes, mi-plan,
mis-ensayos-pdf, panel, perfil, pizarra-inteligente, pricing, progreso,
register, reset-password, train
```

## 3. Entidades del modelo

18 entidades:

```
AppConfig, ConceptMastery, ContractAcceptance, EnsayoCorrection, EnsayoPdf,
EnsayoResult, FriendRequest, HiddenFromFriend, Invitation, LearningSession,
Plan, SharedEnsayo, StudentProfile, StudyTime, Subscription,
TigraScoreHistory, User, UserSignupLocation
```

Lectura de cada grupo:

| Grupo | Entidades | Qué implica |
| --- | --- | --- |
| Identidad | `User`, `StudentProfile`, `Invitation`, `ContractAcceptance` | Cuentas, perfil de alumno, invitaciones y aceptación de contrato |
| Aprendizaje | `LearningSession`, `ConceptMastery`, `StudyTime`, `TigraScoreHistory` | Sesiones, dominio por concepto, tiempo de estudio y serie histórica |
| Evaluación | `EnsayoResult`, `EnsayoCorrection`, `EnsayoPdf`, `SharedEnsayo` | Resultados, corrección, PDF y ensayos compartidos |
| Social | `FriendRequest`, `HiddenFromFriend` | Amigos y ocultamiento entre pares |
| Negocio | `Plan`, `Subscription`, `UserSignupLocation`, `AppConfig` | Planes, suscripción, origen del registro y configuración |

## 4. Funciones del backend invocadas

24 funciones:

```
askAboutProblem, chatWithTigra, correctAnswerSheet, createCheckoutSession,
deleteUser, ensureStudentConcepts, generateEnsayo, generateProblemBatch,
generateProblemByRequest, getEconomicsDashboard, getIncomeStatement,
getMyPlan, getPricingStatus, inviteUserWithPayment, inviteVendedor,
listAllUsers, listVisibleFriends, recordSignupLocation, solveStepByStep,
solveWhiteboardImage, submitPracticeAnswer, translateLearningIntelligence,
updateUser
```

Integraciones usadas: `GenerateImage` y `UploadFile`.

Esto revela capacidades que no aparecen en ninguna captura:

| Función | Capacidad |
| --- | --- |
| `generateProblemBatch`, `generateProblemByRequest`, `generateEnsayo` | El banco no es fijo: la IA **crea ítems nuevos** |
| `chatWithTigra`, `askAboutProblem`, `solveStepByStep` | Tutor conversacional y resolución paso a paso |
| `correctAnswerSheet` | Corrección de hojas de respuesta por fotografía |
| `solveWhiteboardImage` | Resolver un ejercicio fotografiado de una pizarra |
| `ensureStudentConcepts`, `translateLearningIntelligence` | Modelo de dominio por concepto y su traducción a lenguaje natural |
| `createCheckoutSession`, `getPricingStatus`, `getMyPlan`, `inviteUserWithPayment` | Cobro con Stripe y cuotas por plan |
| `getEconomicsDashboard`, `getIncomeStatement` | Coste de IA, comisión de Stripe y estado de resultados |

## 5. Cobertura revisada

Antes estimé 80 % del núcleo y 60 % del producto. Con la lista real, baja. Pesos
asignados por esfuerzo relativo.

| Área | Peso | Nuestra cobertura | Aporte |
| --- | --- | --- | --- |
| Acceso y cuentas | 8 | 55 % (falta registro, recuperación y perfil) | 4,4 |
| Contenido y biblioteca de conceptos | 8 | 60 % (banco sí, biblioteca no) | 4,8 |
| Ensayos: web, PDF y compartidos | 12 | 45 % (generador sí, PDF y compartidos no) | 5,4 |
| Rendición web | 12 | 100 % | 12,0 |
| Corrección | 8 | 100 % (sin foto) | 8,0 |
| Reportes y progreso | 10 | 70 % (informe por curso sí, serie del alumno no) | 7,0 |
| Práctica y entrenamiento | 8 | 0 % | 0 |
| Tutor con IA | 10 | 0 % | 0 |
| Visión artificial | 10 | 0 % | 0 |
| Social | 4 | 0 % | 0 |
| Planes, cuotas y pago | 6 | 0 % | 0 |
| Economía del negocio | 4 | 0 % | 0 |
| **Total** | **100** | | **41,6** |

| Medida | Valor |
| --- | --- |
| Núcleo de evaluación (58 puntos de peso) | **72 %** |
| Producto completo | **42 %** |

La diferencia con la estimación anterior no es un retroceso del trabajo: es que
ahora el denominador es real. Había funciones, sobre todo la generación de ítems
con IA, que no se veían en las capturas.

## 6. Qué tenemos y ellos no

- Modelo relacional propio, con ítems versionados y metadata copiada al intento
  para que los informes históricos no cambien.
- Banco cargado en la base, sin dependencia de la plataforma del original. Origen real: los 1.159 items los genero yo en una sesion anterior y entraron desde la carpeta ENSAYOS SIMCE APP. No estan revisados por un docente, y constan como aprobados porque el seed los marco asi. Esto invalida la version anterior de este punto, que afirmaba un banco curado por el colegio.
- Corrección determinista con escala y cortes editables.
- Cierre por tiempo en el servidor, no en el navegador.
- Sin dependencia de una plataforma externa.

## 7. Pendiente de esta fase

- Capturar las pantallas autenticadas y las formas de datos reales, con la sesión
  abierta en el Chrome depurado.
- Redactar el plano de comportamiento pantalla por pantalla.
- Decidir qué funciones del original no se replican, con el coste a la vista.

## 8. Autenticación y navegación observadas (sesión real)

Observado con REA sobre una sesión autenticada en `/panel`.

**Autenticación:** el token JWT viaja en la propia URL (`/panel?access_token=...`) y
además queda en `localStorage` bajo `token` y `base44_access_token`. Los demás
nombres de almacenamiento son de la plataforma (`base44_app_id`,
`base44_functions_version`, `base44_analytics_session_id`, `base44_from_url`).

Consecuencia de seguridad del original: un enlace con `access_token` en la barra de
direcciones se filtra por historial, marcadores, registros de proxy y capturas de
pantalla. Nuestro diseño usa cookie `httpOnly` firmada, que no aparece en la URL ni
es legible por JavaScript.

**Navegación lateral observada en el panel:** `/panel`, `/progreso`, `/amigos`,
`/mi-plan`, `/perfil`, `/chat`, además de las entradas ya conocidas del menú.

**Recursos:** un CSS de 146 KB y un JS de 1.946 KB, más tres scripts en línea, uno
de ellos con el token.

## 9. Superficie de API observada

El identificador de la aplicación es `6a897f5a822161be5178093e`. Todas las rutas
del frontend hablan con el mismo backend gestionado:

```
GET  /api/apps/{app}/entities/User/me
GET  /api/apps/{app}/entities/Subscription?q={"user_id":"..."}
GET  /api/apps/{app}/entities/ContractAcceptance?q={"user_id":"..."}&sort=-created_date&limit=1
GET  /api/apps/{app}/entities/StudentProfile?q={"student_id":"..."}
POST /api/apps/{app}/functions/getMyPlan
POST /api/apps/{app}/functions/recordSignupLocation
POST /api/apps/{app}/analytics/track/batch
POST /api/app-logs/{app}/log-user-in-app/{ruta}
GET  /api/apps/public/prod/public-settings/by-id/{app}
GET  /api/apps/manifests/{app}/manifest.json
```

Patrón que repite cada pantalla, en este orden:

1. `User/me` para resolver la sesión.
2. `public-settings` y `manifest` de la aplicación.
3. `log-user-in-app/{ruta}`, que registra la visita.
4. Solo después, las entidades y funciones propias de la pantalla.

Consecuencia para nuestro diseño: su registro de visitas es analítica, no auditoría.
Anota que entraste a una pantalla, no qué dato modificaste. Nuestra tabla `Evento`
está pensada para lo segundo, que es lo que exige la Ley 21.719.

Consultas por pantalla, tal como se observaron:

| Pantalla | Consultas propias |
| --- | --- |
| `/ensayos` | `ContractAcceptance` (contrato aceptado) y `StudentProfile` por `student_id` |
| `/mi-plan` | `getMyPlan` y `Subscription` por `user_id` |

Observación de modelo: el original se organiza por **alumno** (`student_id`,
`StudentProfile`), no por curso. Su selector de curso es contexto de contenido, no
una entidad de gestión. Nuestro esquema es al revés, multi-colegio y por curso,
que es lo que necesita un establecimiento con varios niveles.
