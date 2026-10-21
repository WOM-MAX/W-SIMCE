# Bitácora de W-SIMCE

**Qué es:** plataforma de gestión, rendición y analítica de evaluaciones estandarizadas
para colegios de Chile (SIMCE). Nombre comercial: **W-SIMCE**.
**Última actualización:** 21 de octubre de 2026.
**Estado:** Fase 0 desplegada en producción. Acceso, administración, generación de
ensayos, rendición, corrección y reportes funcionando. Pendiente asignar los
ensayos a un curso (ver sección 14).
**Equipo del colegio:** puesto al día a `1e8ee69` el 21 de octubre de 2026
(ver sección 18).
**Datos:** 289 estudiantes reales en 8 cursos, con RUN, cargados el 21 de octubre
(ver sección 19).

> Este archivo existe dos veces con el mismo contenido:
> `C:\Proyectos\W-SIMCE\docs\BITACORA.md` (versionado, viaja con el código) y
> `ENSAYOS SIMCE APP\BITACORA-W-SIMCE.md` (visible desde OneDrive).
> Si cambias una, cambia la otra.

---

## 1. Dónde está cada cosa

| Qué | Dónde |
| --- | --- |
| Código | `C:\Proyectos\W-SIMCE` (fuera de OneDrive, a propósito) |
| Remoto | https://github.com/WOM-MAX/W-SIMCE (rama `main`) |
| Base de datos | Neon, proyecto `neondb`, región `sa-east-1` (São Paulo) |
| App en producción | Railway — **pendiente: falta la URL pública** |
| Banco de ítems original | `ENSAYOS SIMCE APP\app\datos\` (fuente; ya importado a Neon) |
| Referencia visual | k-simce.com (capturas del panel de alumno) |

**Credenciales de la base:** están en `C:\Proyectos\W-SIMCE\.env`, que **no se versiona**.
Si cambias de equipo, cópialas desde la consola de Neon (Connection string → pooled y
direct). No las escribas en documentos ni en el chat.

---

## 2. Estado verificado (no supuesto)

| Comprobación | Resultado | Cómo se verificó |
| --- | --- | --- |
| Esquema en Neon | 26 tablas | `prisma db push` y consulta a `information_schema` |
| Banco en Neon | **1.159 ítems, 4.636 alternativas, 1.159 claves** (una por ítem) | conteos y agrupación por banco |
| Currículum en Neon | 191 objetivos, 1.073 indicadores, 22 ejes | conteos |
| Textos de Lectura | 147, y los 480 ítems de Lectura con su texto | conteo con `textoId` |
| Figuras | 352 construidas a primitivas y enlazadas a 376 ítems | `Figura.primitivas` (JSON) |
| Ensayos | 19 de 30 ítems (18 importados + 1 de la semilla) | listado por nivel |
| Cobertura de OA | 114 de 114 objetivos usables; **0 ítems sin OA** | `group by` por nivel |
| Nómina | 20 estudiantes matriculados en 4° B | conteo de `Matricula` |
| App local | `GET /` 200 y `/api/health` 200 con datos reales | navegador y `curl` |
| Build de producción | correcto (3 rutas, 102 kB JS compartido) | `pnpm build` |
| Imagen Docker | construye y arranca | job `imagen` de GitHub Actions |
| CI | verde en `verificar` e `imagen` | Actions |
| Git | `main` en `f7ca303`, árbol limpio, `.env` ignorado | `git status`, `git ls-files` |

La portada actual muestra los conteos reales de Neon y la asignación sembrada.
No hay login, ni rendición, ni reportes todavía.

Nota sobre las figuras: el catálogo original registra 362; se importaron **352**,
que son las que algún ítem referencia. Las 10 restantes pertenecen al ensayo de
muestra (`MUE-*`), que se excluyó a propósito porque no es una forma del banco.

---

## 3. Stack y por qué

| Capa | Elección |
| --- | --- |
| Runtime | Node 24, pnpm 12 |
| Framework | Next.js 15.5 (App Router, `output: standalone`) |
| UI | React 19 + Tailwind 4 (tokens en el código, sin librería de componentes) |
| Datos | Prisma 6.19 + PostgreSQL en Neon |
| Validación | Zod 4 |
| Gráficos (aún no instalados) | Recharts 3 + TanStack Table |
| Auth (aún no implementada) | Sesión propia: `scrypt` + JWT `jose` en cookie `httpOnly` |
| PDF | El escritor propio del proyecto de ensayos, en un worker aparte |
| Storage de PDF | Cloudflare R2 (los volúmenes de Railway no se comparten) |
| Deploy | Railway desde GitHub, con Dockerfile y `railway.toml` |

**Decisiones que no hay que revertir sin pensarlo:**

1. **Un solo servicio web.** Los contratos `/v1/...` se implementan como route handlers
   de Next, no como un Fastify aparte. Si algún día hay que separar la API, se extrae.
2. **El ítem se versiona** (`Item` → `ItemVersion` → `Alternativa`). Un ensayo y un
   intento apuntan a la versión, nunca al ítem vivo.
3. **El intento copia la metadata** (eje, habilidad, bloom, dificultad) al iniciarse.
   Editar un ítem después no reescribe los informes históricos.
4. **Liveness separado de readiness:** `/api/live` no toca la base (lo vigila Railway),
   `/api/health` sí (sirve para monitoreo).
5. **Migraciones, no `db push`, en producción:** `preDeployCommand = prisma migrate deploy`.

---

## 4. Modelo de datos (resumen)

- **Tenancy:** `Colegio → AnioEscolar → Curso → Matricula → Estudiante`; `Usuario` +
  `Membresia` (rol `ADMIN`/`UTP`/`DOCENTE`).
- **Currículum:** `Nivel`, `Asignatura`, `Eje`, `Objetivo`, `Indicador`.
- **Banco:** `Item`, `ItemVersion`, `Alternativa`, `Figura` (primitivas en JSON),
  `TextoLectura`.
- **Evaluación:** `Ensayo`, `EnsayoItem`, `Asignacion`, `Intento`, `IntentoItem`,
  `Respuesta`.
- **Resultados:** `ResultadoIntento`, `ResultadoDimension` (eje/habilidad/bloom/dificultad).
- **Auditoría:** `Evento`.

Reglas de integridad ya en el esquema: una clave por versión, un intento por
(asignación, estudiante, número), una respuesta por ítem del intento, y el `Intento`
con `version` para el autoguardado optimista.

---

## 5. API diseñada (contratos aprobados, sin implementar)

Convenciones: REST `/v1`, JSON, `camelCase`, UTC, `{data, meta}` y `{error:{code,message,details}}`.
Sesión en cookie `httpOnly` + CSRF de doble envío. Idempotencia en crear intento y enviar.

| Módulo | Endpoints |
| --- | --- |
| Auth | `POST /auth/login` (correo o código+PIN), `POST /auth/logout`, `GET /auth/me`, `POST /auth/pin` |
| Estructura | `GET /cursos`, `GET /cursos/:id/estudiantes`, `POST /cursos/:id/estudiantes/importar`, `POST /estudiantes/:id/credencial` |
| Banco | `GET /bancos/:clave/items`, `GET /items/:id` |
| Ensayos | `POST /ensayos`, `POST /ensayos/generar`, `GET /ensayos/:id`, `POST /ensayos/:id/publicar` |
| Asignación | `POST /asignaciones`, `GET /asignaciones?cursoId=` |
| Rendición | `GET /mis-evaluaciones`, `POST /asignaciones/:id/intentos`, `GET /intentos/:id`, `PATCH /intentos/:id/respuestas`, `POST /intentos/:id/enviar`, `GET /intentos/:id/estado` |
| Reportes | `GET /reportes/asignaciones/:id`, `.../estudiantes`, `GET /reportes/intentos/:id`, `GET /reportes/asignaciones/:id/export?formato=csv\|pdf` |

Reglas de seguridad del examen: **la clave nunca viaja al cliente** durante la rendición;
el tiempo lo decide el servidor (`fechaLimite = min(inicio + duración, cierre de la asignación)`);
la corrección ocurre en el servidor y el autoguardado es por lote con `version`.

Códigos de error definidos: `AUTH_INVALID`, `AUTH_LOCKED`, `FORBIDDEN_ROLE`, `NOT_ENROLLED`,
`ATTEMPT_CLOSED`, `ATTEMPT_EXPIRED`, `VERSION_CONFLICT`, `NOT_FOUND`.

---

## 6. Datos de prueba

- Colegio Acrópolis (RBD 12345-6), año 2026, curso **4° básico B**.
- Ensayo **“Ensayo 1 de Matemática”**, 30 ítems reales (`ENSAYO-4B-MAT-01`), 90 min.
- Asignación vigente por 60 días desde el 19/10/2026.
- Docente: `docente@acropolis.cl` / `demo1234`.
- Alumnos: `W4B-01` … `W4B-20`, PIN `1234`.

El seed borra y recrea todo (`TRUNCATE ... CASCADE`). **No correrlo contra datos reales.**

---

## 7. Cómo retomar (3 comandos)

```powershell
cd C:\Proyectos\W-SIMCE
pnpm install          # solo si es un equipo nuevo
pnpm dev              # http://localhost:3005
```

Comprobación rápida: `http://localhost:3005/api/health` debe devolver
`{"ok":true,...,"conteos":{...}}`.

Para recrear la base desde cero: `pnpm db:push`, luego `pnpm db:seed` (rebanada de
4° B) y opcionalmente `pnpm db:importar` (banco completo, idempotente). El banco ya
está cargado en Neon: no hace falta volver a importarlo.

El importador (`prisma/importar-banco.mjs`) lee los archivos del proyecto de ensayos,
construye las figuras a primitivas con `FIGURAS.obtener(id)` y no duplica nada si se
corre dos veces.

---

## 8. Despliegue en Railway: dónde quedó

Hecho:
- `Dockerfile` multi-etapa (build con `prisma generate`, runtime `standalone`, CLI de
  Prisma incluido para el pre-deploy, usuario sin privilegios).
- `railway.toml` con builder Docker, `startCommand = node server.js`,
  healthcheck `/api/live`, `preDeployCommand = prisma migrate deploy`.
- Migración inicial en `prisma/migrations/20261019000000_init/` marcada como aplicada.

Falta:
1. Crear el proyecto en Railway desde GitHub y elegir región **US East**.
2. Cargar variables: `DATABASE_URL` (pooled, + `&pgbouncer=true&connection_limit=5`),
   `DIRECT_URL`, `AUTH_SECRET`, `APP_URL`.
3. Generar dominio y verificar `/api/live` y `/api/health` en producción.
4. Poner la URL real en esta bitácora.

Valor de `AUTH_SECRET`: **no se escribe en este documento**. Se genera con
`openssl rand -base64 32` (o cualquier generador de 32 bytes) y se carga únicamente
como variable de entorno en Railway y en el `.env` local.

---

## 9. Pendientes priorizados

**P0 — cerrar la rebanada vertical (4° B Matemática, 30 ítems, 20 alumnos):**
0. ~~Importar el banco completo~~ — **hecho**: 1.159 ítems, 147 textos, 352 figuras,
   19 ensayos, 191 OA y 1.073 indicadores en Neon.
1. Login: docente por correo, alumno por código + PIN; sesión con cookie y CSRF.
2. Iniciar intento: crea `Intento` + `IntentoItem` copiando metadata, devuelve ítems **sin clave**.
3. Rendición: una a una y cuadernillo, reloj del servidor, autoguardado por lote,
   cierre automático al expirar.
4. Enviar: transacción que corrige, escribe `ResultadoIntento` y `ResultadoDimension`.
5. Panel del docente: logro por alumno, curso, eje y habilidad; export CSV y PDF.
6. `calcularLogros()` puro y testeado, más la escala referencial de puntaje.

**P1:** importación CSV de nómina, regenerar credenciales, constructor de ensayos
(manual y aleatorio por cuotas, como `tools/armar-ensayo.mjs`), figuras en pantalla
(adaptar `app/js/figuras/render-svg.js`).

**P2:** gamificación estilo referente, comparación entre aplicaciones, pilotaje y
calibración de dificultad, multi-colegio en la interfaz.

**Criterio de aceptación de la rebanada:** un docente asigna, un alumno rinde con
autoguardado y cierre por tiempo, el docente ve logro por eje y habilidad sin tocar
la base, y exporta el resumen para UTP.

---

## 10. Decisiones abiertas

1. **Región de Neon:** hoy `sa-east-1` y el servicio iría en `us-east`. Cada consulta
   suma ~120 ms. Recomendación: recrear Neon en `us-east-1` antes de cargar datos reales
   (hoy solo hay semilla, son cinco minutos).
2. **Repo público.** Pasarlo a privado antes de cargar datos de alumnos.
3. **Rotar la credencial de Neon:** la cadena circuló en el chat.
4. **Datos de menores:** resolver base legal, minimización, retención y acceso antes de
   producción (Ley 19.628 y 21.719).
5. **Dominio propio** (`app.wsimce.cl`) frente al subdominio de Railway.

---

## 11. Trampas conocidas (ya resueltas, no repetirlas)

- **pnpm 12 ignora `pnpm.onlyBuiltDependencies`**: los permisos de scripts van en
  `pnpm-workspace.yaml` con `allowBuilds`. Sin eso, Prisma falla con `ERR_PNPM_IGNORED_BUILDS`.
- **Neon necesita dos cadenas**: pooled para la app (`pgbouncer=true`), directa para
  migraciones (`DIRECT_URL`). `channel_binding=require` no lo interpreta Prisma.
- **El build local genera el motor de Prisma para Windows.** En la imagen Linux se
  regenera; no copiar `.prisma` de Windows al contenedor.
- **La imagen `standalone` no trae el CLI de Prisma** ni el schema: por eso el Dockerfile
  instala `prisma` global y copia `prisma/` al runtime.
- **Healthcheck:** usar `/api/live`; con `/api/health` un problema de base reinicia el
  contenedor en bucle.
- **Neon gratuito se suspende** por inactividad: el primer request tarda ~1 s.
- **Git Credential Manager** abre su ventana en la barra de tareas y a veces queda
  detrás: si el push se cuelga, mirar ahí. La credencial quedó guardada; la alternativa
  preparada es una clave SSH en `~/.ssh/w_simce_ed25519` (sin registrar en GitHub).
- **GitHub Actions** tuvo colas de 2–3 minutos; no es un fallo del workflow.

---

## 12. Registro de la sesión (19/10/2026)

| Hora aprox. | Hecho |
| --- | --- |
| 12:06 | Se revisa el proyecto de ensayos SIMCE y se entrega informe de situación |
| 12:14 | Se instala REA 6.7.0 y se registra como servidor MCP de DSH (207 herramientas) |
| 12:39 | Se reciben capturas del panel de k-simce (referencia visual) |
| 12:45 | Se define stack, modelo de datos y contratos de API (pasos 1 a 3) |
| 12:50 | Se crea `C:\Proyectos\W-SIMCE`, se aplica el esquema en Neon y se siembra la rebanada |
| 13:00 | La app responde en local con datos reales; captura de pantalla verificada |
| 13:20 | Se prepara el despliegue: Dockerfile, migración inicial, `railway.toml`, CI |
| 13:35 | `main` en GitHub, CI verde (incluye build y arranque de la imagen) |
| 13:40 | Se separa liveness/readiness y se empuja `f7ca303` |
| 13:45 | Se agrega la bitácora y se saca el `AUTH_SECRET` del repositorio (`8d5ae52`) |
| 13:50 | Se importa el **banco completo**: 1.159 ítems, 147 textos, 352 figuras, 19 ensayos |

---

## 13. Si retomas desde otro equipo

1. `git clone https://github.com/WOM-MAX/W-SIMCE.git` y `pnpm install`.
2. Copia las dos cadenas de Neon a un `.env` nuevo (no están en git).
3. `pnpm dev` y comprueba `/api/health`.
4. Lee esta bitácora y sigue por los pendientes P0.

Si retomas en este mismo equipo, el proyecto ya está listo: solo `pnpm dev`.

---

## 14. Plan de continuación (20 de octubre de 2026)

**Estado al cierre del 19 de octubre:** la aplicación está completa en su flujo
principal y desplegada. Último commit en `main`: `be8fd5b`.
Producción responde en https://w-simce-production.up.railway.app con 200,
1 colegio, 1 curso, 20 estudiantes, 1.159 ítems y 19 ensayos.

> Nota de rutas: esta bitácora se escribió en otro equipo y menciona
> `C:\Proyectos\W-SIMCE`. En este equipo el clon vive en
> `E:\DEEPSEEK\ACRO-WOM\W-SIMCE`. El resto del contenido sigue siendo válido.

### 14.1 Cómo arrancar en cinco minutos

1. `cd E:\DEEPSEEK\ACRO-WOM\W-SIMCE` y `pnpm dev` (puerto 3005).
2. Abrir `http://localhost:3005/login`.
3. Entrar como `admin@acropolis.cl` con clave `Acropolis2026`.
4. Comprobar `http://localhost:3005/api/health`.
5. Para probar como estudiante, ventana de incógnito con `W4B-01` y PIN `1234`.

El `.env` necesita tres variables: `DATABASE_URL` (pooled), `DIRECT_URL`
(directa) y `SESSION_SECRET` (32 caracteres o más). Las tres están puestas en
local y en Railway.

### 14.2 Qué quedó construido

| Módulo | Rutas | Estado |
| --- | --- | --- |
| Acceso | `/login`, `/api/auth/login`, `/api/auth/logout` | Listo |
| Panel | `/` con barra lateral | Listo |
| Administración | `/admin`, `/api/admin/*` | Listo |
| Generar ensayos | `/ensayos/nuevo`, `/ensayos`, `/api/ensayos/crear` | Listo |
| Rendición | `/alumno`, `/rendir/[id]/[orden]`, `/rendir/[id]/fin` | Listo |
| Corrección | `/correccion`, `lib/correccion.ts` | Listo |
| Reportes | `/reportes`, `/api/reportes/csv` | Listo |

Decisiones tomadas que no hay que volver a discutir:

- Un intento por asignación (`Asignacion.intentosPermitidos`, por defecto 1).
- Una pregunta por pantalla, con navegación hacia atrás y respuestas
  modificables hasta el envío.
- El cierre por tiempo lo decide el servidor en cada petición. El reloj del
  navegador es solo informativo.
- `tiempoMin = 0` significa sin límite propio: manda la fecha de cierre del
  ensayo.
- La escala de logro es lineal de 100 a 1000 sobre el porcentaje. Es una regla
  declarada, no una calibración psicométrica.
- Los cortes de nivel (Insuficiente, Elemental, Adecuado) son 50 y 75 por
  defecto y se editan en `/admin`. Son provisionales.
- El estudiante solo ve sus resultados si el colegio activa el interruptor en
  `/admin`.
- El ensayo generado queda en BORRADOR hasta que se asigne.
- La paleta sale del emblema: azul `#202858`, naranja `#F84828`, blanco.

### 14.3 Prioridad 0: asignar ensayos a un curso

Es lo único que impide cerrar el ciclo completo. Hoy se pueden generar ensayos,
pero no llegan a ningún estudiante.

Qué hacer:

1. Página `/ensayos/[id]/asignar` con: curso, fecha de apertura, fecha de
   cierre e intentos permitidos.
2. Ruta `POST /api/ensayos/asignar` que cree la `Asignacion` y pase el
   `Ensayo.estado` a `PUBLICADO` en la misma transacción. Guardar `docenteId`
   con el usuario de la sesión.
3. Botón "Asignar" en la fila de cada ensayo en `/ensayos`.
4. Validaciones: el ensayo debe tener ítems, el curso debe ser del colegio,
   `cierraEn` mayor que `abreEn`, y no duplicar una asignación activa del mismo
   ensayo al mismo curso.
5. Prueba de extremo a extremo: asignar el ensayo a 4° básico B, entrar como
   `W4B-01`, rendirlo, verlo en `/correccion` y en `/reportes`.

Riesgo bajo: la rendición ya copia la metadata de cada ítem al crear el intento,
así que un ensayo generado hoy se comporta igual que el del seed.

### 14.4 Prioridad 1: Ley 21.719 y trazabilidad

Son datos de menores. Antes de abrirlo a docentes y estudiantes reales hay que
resolver esto, aunque no sea visible en pantalla.

1. La tabla `Evento` existe y está sin usar. Registrar al menos: inicio de
   sesión correcto y fallido, creación y borrado de estudiantes, importación
   desde Excel, generación y asignación de ensayos, envío de intento y cambio
   de claves.
2. Definir plazo de retención y qué se borra. Hoy nada se borra nunca.
3. Derecho de acceso y supresión: el borrado ya existe y arrastra intentos y
   respuestas, pero falta una exportación de todos los datos de un estudiante.
4. Base legal y consentimiento: lo define el colegio, no la aplicación, pero la
   aplicación debe permitir cumplirlo.

### 14.5 Prioridad 2: límite de intentos en el login

Hoy se puede probar claves sin freno. Con códigos de estudiante de cuatro
dígitos el PIN es trivial de adivinar por fuerza bruta.

Propuesta: contar fallos por correo o código más IP, y bloquear quince minutos
tras cinco fallos. Se puede apoyar en `Evento` en lugar de añadir otra tabla.

### 14.6 Prioridad 3: versión imprimible en PDF

La pestaña "Imprimible (PDF)" del generador está marcada como pronto. Es la
tarea más cara de las que quedan y conviene estimarla antes de empezar.

Complicación conocida: las figuras son primitivas propias (rect, line, text,
circle, poly, path) que hoy se dibujan en SVG. Una librería de PDF no las
entiende; habría que transformarlas a instrucciones equivalentes o rasterizar
cada figura. Revisar cuántos ítems del banco traen figura antes de decidir.

### 14.7 Prioridad 4: pulido

- Iconos por eje en las tarjetas del generador, como la aplicación original.
- Cambio de la propia clave sin pasar por administración.
- Paginación o filtro por curso en el listado de estudiantes; con 500
  importados la tabla se hace inmanejable.
- Revisar el correo del administrador: hoy no se puede editar el nombre.

### 14.8 Deudas técnicas conocidas

- `prisma generate` y `prisma migrate deploy` fallan con EPERM en Windows si el
  servidor de desarrollo está corriendo, porque tiene tomada la DLL del motor.
  Parar el servidor antes.
- `prisma/seed.mjs` depende de la ruta `ORIGEN_BANCO` del equipo del autor. El
  banco ya está cargado en Neon, así que no bloquea, pero el seed no es
  reproducible en otro equipo sin el material original.
- `exceljs` agregó 176 paquetes. Es la única dependencia pesada añadida.
- No hay pruebas automatizadas. Toda la verificación de esta sesión fue manual
  con `curl` contra el servidor local, y conviene repetirla al tocar auth o
  rendición.
- La bitácora original dice que existe una copia en OneDrive
  (`ENSAYOS SIMCE APP\BITACORA-W-SIMCE.md`). Al actualizar esta, sincronizar
  aquella.

### 14.9 Comandos que se usaron

```
pnpm dev                                       # servidor local en 3005
node node_modules/typescript/bin/tsc --noEmit  # tipos
node node_modules/next/dist/bin/next build     # build de producción
node node_modules/prisma/build/index.js migrate deploy
node --env-file=.env prisma/crear-admin.mjs correo@colegio.cl "clave"
curl -s -o NUL -w "%{http_code}" https://w-simce-production.up.railway.app/api/health
```

### 14.10 Credenciales de prueba

| Perfil | Usuario | Clave |
| --- | --- | --- |
| Administrador | `admin@acropolis.cl` | `Acropolis2026` |
| Docente del seed | `docente@acropolis.cl` | `demo1234` |
| Estudiantes | `W4B-01` a `W4B-20` | `1234` |

La clave del administrador conviene cambiarla desde `/admin` en cuanto se use
con datos reales.

---

## 15. Comparación con K-SIMCE AI y plan por etapas

**Nota de verificación:** el sitio https://k-simce.com es una aplicación cerrada.
Las páginas públicas (`/`, `/panel`, `/login`, `/register`, `/pricing`) devuelven
solo el título y la descripción; el panel exige sesión. Todo lo que sigue sobre el
original procede de tres capturas del panel y del texto público, no de inspección
directa. **No se usó REA en la construcción de W-SIMCE**: la aplicación se escribió
desde cero con Next.js. REA sirve para ingeniería inversa de binarios y
aplicaciones empaquetadas, y aquí no intervino.

### 15.1 Lo que se pudo verificar del original

De las capturas del panel:

- Selector de asignatura y de curso como contexto global.
- Menús: Inicio, Progreso, Aprende, Practica (adaptativo), Evalúa (adaptativo),
  Mis amigos, Mi plan, Ajustes.
- Evalúa contiene: Generar Ensayos, Mis Ensayos PDF, Ensayos PDF Compartidos.
- Generar Ensayos: pestañas Interactivo e Imprimible (PDF), tipo de ensayo
  (aleatorio o por área), cantidad de preguntas (5, 10, 20, 30 o libre hasta 100)
  y tiempo límite (sin límite, 10, 20, 30, 45, 60 o libre hasta 180).

Del texto público y de la portada del panel:

- Tutor personal con inteligencia artificial ("Mr. Kolt", disponible 24/7, voz y chat).
- Visión artificial para corregir hojas de respuesta fotografiadas.
- Seguimiento de progreso con indicadores y estimación de desempeño en el SIMCE.
- Modelo comercial B2C con registro abierto, recuperación de contraseña y planes.

### 15.2 Inventario comparado

Los pesos son una estimación de esfuerzo relativo, no una medición del original.

| Función | Peso | W-SIMCE | Cobertura |
| --- | --- | --- | --- |
| Acceso, roles y sesiones | 10 | Listo | 90 % |
| Banco de ítems y contenido | 10 | 1.159 ítems importados | 100 % |
| Generar ensayos | 12 | Listo, sin PDF | 60 % |
| Asignar ensayo a curso y publicar | 8 | **No existe** | 0 % |
| Rendición con cierre en servidor | 15 | Listo | 100 % |
| Corrección y niveles de logro | 10 | Listo | 100 % |
| Reportes y exportación | 10 | Listo, sin PDF | 85 % |
| Práctica y aprendizaje adaptativo | 6 | No existe | 0 % |
| Progreso del estudiante | 4 | No existe | 0 % |
| Tutor con IA | 5 | No existe | 0 % |
| Visión artificial de hojas | 5 | No existe | 0 % |
| Social (Mis amigos) | 2 | No existe | 0 % |
| Planes, registro y pago | 2 | No existe | 0 % |
| Ajustes por usuario | 1 | Parcial, vía administración | 20 % |

### 15.3 Porcentaje

| Medida | Valor |
| --- | --- |
| Núcleo de evaluación (acceso, banco, generar, asignar, rendir, corregir, reportar) | **80 %** |
| Producto completo, incluyendo IA, visión artificial, adaptativo y B2C | **60 %** |

La diferencia entre las dos cifras es el punto importante: el núcleo está casi
completo, y lo que resta en el producto completo son funciones que no son "más de
lo mismo", sino modelos y datos que hoy no existen.

### 15.4 Etapas siguientes

**E1. Asignar ensayos (cierra el ciclo). Prioridad máxima.**

- Página `/ensayos/[id]/asignar`: curso, apertura, cierre, intentos permitidos.
- `POST /api/ensayos/asignar`: crea la asignación y publica el ensayo en una
  transacción, guarda el docente de la sesión.
- Botón "Asignar" en `/ensayos`.
- Validaciones: ensayo con ítems, curso del colegio, cierre posterior a apertura,
  sin duplicar asignación activa del mismo ensayo al mismo curso.
- Aceptación: asignar a 4° básico B, rendir como `W4B-01`, verlo en corrección y
  en reportes.
- Estimación: 3 a 4 horas.

**E2. Ciclo del intento completo.**

- Historial de intentos por asignación, con estado y tiempo usado.
- Anular un intento y habilitar reintento sin borrar el anterior.
- Prórroga de la fecha de cierre para un estudiante concreto.
- Vista del docente por curso, no solo por asignación.
- Estimación: 6 a 8 horas.

**E3. Progreso del estudiante.**

- Serie histórica por eje y habilidad, a partir de `ResultadoDimension`.
- Comparación entre ensayos del mismo curso.
- Solo visible si el colegio activa el interruptor.
- Estimación: 6 a 8 horas.

**E4. Práctica y modo adaptativo.**

- Banco de práctica con corrección inmediata y sin nota.
- Selección de ítems por dificultad según el desempeño reciente.
- Advertencia: sin calibración de ítems, el "adaptativo" es una heurística por
  dificultad declarada, no una medición psicométrica.
- Estimación: 10 a 14 horas la práctica; 12 a 20 horas el adaptativo.

**E5. PDF imprimible y ensayos compartidos.**

- Hoja de respuestas y prueba imprimible con las figuras convertidas.
- Complicación: las figuras son primitivas propias que hoy se dibujan en SVG.
- Estimación: 12 a 20 horas.

**E6. Tutor con IA.**

- Conversación sobre el ítem fallado, con el currículo como contexto.
- Requiere control de coste por estudiante y límites de uso.
- Estimación: 20 a 30 horas.

**E7. Visión artificial de hojas de respuesta.**

- Corrección de una foto de hoja de respuestas.
- Es la tarea más incierta: necesita fotos reales, tolerancia a perspectiva e
  iluminación, y validación con casos malos.
- Estimación: 40 horas o más, sin garantía de precisión.

**E8. Producto B2C.**

- Registro abierto, recuperación de contraseña, planes y pago.
- Solo tiene sentido si el destino es vender, no el uso interno del colegio.
- Estimación: 15 a 25 horas más la integración de pagos.

**E9. Cierre legal (Ley 21.719).**

- Trazabilidad en la tabla `Evento`, retención definida, exportación por
  estudiante y límite de intentos en el login.
- Estimación: 10 a 15 horas.

### 15.5 Lo que no depende de más código

El tutor con IA y la visión artificial no se resuelven escribiendo pantallas.
Necesitan modelo, datos y evaluación de calidad. Cualquier estimación ahí es una
aproximación, y conviene decidir si se compran hechos o se construyen.

### 15.6 Estimación total

| Bloque | Horas |
| --- | --- |
| E1 a E2 (cerrar el flujo de evaluación) | 9 a 12 |
| E3 a E4 (progreso y práctica) | 16 a 22 |
| E5 (impresión) | 12 a 20 |
| E6 (tutor IA) | 20 a 30 |
| E7 (visión artificial) | 40 o más |
| E8 (B2C) | 15 a 25 |
| E9 (legal) | 10 a 15 |

Para igualar el producto completo: entre 120 y 165 horas, con la salvedad de E7.
Para cerrar el uso interno del colegio con comodidad (E1, E2, E3 y E9): entre 25
y 35 horas.

---

## 16. Revisión y corrección de figuras (20 de octubre de 2026)

**Motivo:** el banco tiene 380 ítems con figura y las figuras se generaron sin un
sistema de coordenadas común. Al revisarlas se encontraron textos cortados,
elementos flotando fuera de la cuadrícula, curvas mal orientadas y figuras que
contradecían su propio enunciado.

**Método, que es lo que faltaba desde el principio:**

1. `scripts/render-figuras.mjs` rasteriza una figura a PNG con resvg, para poder
   mirarla con la herramienta de imagen.
2. `scripts/contacto.mjs` arma una hoja con doce figuras para revisarlas de un
   golpe.
3. `scripts/pizarra.mjs` construye figuras con una sola transformación de
   coordenadas matemáticas a píxeles: ejes, rectas, puntos rotulados, curvas por
   muestreo y triángulos.
4. `scripts/dibujo.mjs` traduce las primitivas a SVG igual que el componente de
   la aplicación.

**Hallazgo técnico:** resvg no pinta texto dentro de un elemento `<g>`. Las
figuras sí se veían en el navegador, pero el rasterizador las mostraba sin texto.
La salida se cambió a una etiqueta `<text>` por línea.

**Resultado:** 101 figuras con estructura de ejes o curvas revisadas. 24
corregidas y 77 verificadas sin cambios. Las 279 restantes son tablas, cuadros de
texto y formas simples que pasaron la revisión de anclaje.

Figuras corregidas, por tipo de defecto:

| Defecto | Figuras | Ejemplo |
| --- | --- | --- |
| Texto anclado al centro con coordenada de borde | 482 textos en total | Afiche del barrio, tabla de la feria |
| Curva con orientación equivocada | 2 | Parábolas que abrían hacia los lados |
| Vértice o punto fuera de su curva | 1 | Parábola con vértice en x = 1,5 en vez de 3 |
| Original dibujado fuera de la cuadrícula | 7 | Todas las transformaciones isométricas |
| Figura que contradice su enunciado | 1 | Inecuación con recta y = 2x + 1 y sombreado al revés |
| Elementos flotando sin relación | 8 | Esferas, semiesferas, ángulos |
| Cuadrícula con menos divisiones que las declaradas | 1 | Cubo de 4 cm dibujado con 3 por lado |
| Escala inconsistente entre ejes | 1 | Triángulo 6-8-10 dibujado con dos escalas |

**Pendiente anotado:** en `8B-MAT-PRO-F3-007` las dos series se superponen porque
las escalas hacen que coincidan. Se lee, pero la comparación se pierde. Es una
debilidad de diseño, no un dato erróneo.

**Regla nueva:** ninguna figura entra al banco sin haberse renderizado y mirado.

---

## 17. Generador sin repetición (20 de octubre de 2026)

El generador de ensayos evita las preguntas que ya aparecieron en las últimas
evaluaciones del mismo nivel y asignatura. La ventana se elige en la pantalla:
no evitar, últimas 3, últimas 6 o todas.

Si las preguntas libres no alcanzan, el ensayo se completa igual con las ya
vistas y la pantalla lo avisa diciendo cuántas se repitieron. El ensayo nunca
sale incompleto.

**Comprobación con 4° básico Matemática, 191 ítems aprobados y 86 ya usados en
las tres evaluaciones existentes:**

| Ensayo generado | Preguntas repetidas |
| --- | --- |
| 1 | 0 |
| 2 | 0 |
| 3 | 0 |
| 4 | 15 |
| 5 | 30 |
| 6 | 30 |

Es decir: un curso con 180 ítems aprobados alcanza para seis ensayos de 30
preguntas sin repetir ninguna. Lectura tiene 120 por nivel, así que alcanza para
cuatro. Los 60 ítems que faltan por nivel de lectura son exactamente lo que
convierte cuatro ensayos en seis.

---

## 18. Puesta al día del equipo del colegio (21 de octubre de 2026)

El 20 de octubre se trabajó en el equipo de casa; el 21 se retomó en el equipo del
colegio, que seguía en `84fc4b9` (la versión del 19). Se actualizó a `1e8ee69`:
117 commits y 202 archivos, con los módulos de acceso, administración, ensayos,
rendición, corrección, reportes y el banco ampliado.

| Paso | Comando | Resultado |
| --- | --- | --- |
| Código | `git pull --ff-only origin main` | `84fc4b9` → `1e8ee69`, sin conflictos |
| Dependencias | `pnpm install` | `exceljs` 4.4.0 y `@resvg/resvg-js` 2.6.2 (178 paquetes) |
| Cliente Prisma | `prisma generate` | 6.19.3, sin errores |
| Migración | `prisma migrate status` | `ConfiguracionColegio` ya aplicada; no se tocó la base |
| Secreto de sesión | — | `SESSION_SECRET` generado (64 caracteres) |
| Tipos | `tsc --noEmit --incremental false` | sin errores |

**Estado verificado el 21 de octubre** (reemplaza los conteos de la sección 2):

| Comprobación | Resultado |
| --- | --- |
| `/api/health` | 200, latencia 246 ms: 1 colegio, 1 curso, 20 estudiantes, **1.926 ítems**, 19 ensayos |
| Login administrador | `admin@acropolis.cl` → `/`, panel con datos reales |
| Login docente | `docente@acropolis.cl` → `/` |
| Login estudiante | `W4B-01` + PIN `1234` → `/alumno` |
| Clave incorrecta | `/login?error=credenciales`, sin sesión |
| Páginas con sesión | `/`, `/admin`, `/banco`, `/ensayos`, `/ensayos/nuevo`, `/reportes`, `/correccion`: 200 sin errores |

**Trampas nuevas de esta puesta al día:**

- El `.env` que llegó del otro equipo trae `channel_binding=require` en las dos
  cadenas. Prisma 6.19 conecta igual, pero si el pooler falla es lo primero que
  hay que quitar (es la trampa de la sección 11).
- El `.env` del equipo del colegio tenía credenciales del 19 de octubre que Neon
  ya rechazaba (`P1000`). Se reemplazó por las del otro equipo; las cadenas no
  entran al repositorio.
- Faltaba `SESSION_SECRET`: la aplicación arranca, pero el login redirige a
  `/login?error=configuracion`. Se generó uno de 64 caracteres.
- `tsc --noEmit` a secas falla con `EPERM` si queda un `tsconfig.tsbuildinfo` de
  otra sesión; con `--incremental false` no escribe ese archivo.
- En este equipo el clon vive en `C:\Proyectos\W-SIMCE`; la nota de rutas de la
  sección 14 corresponde al equipo de casa.

**Comandos de la puesta al día:**

```
git pull --ff-only origin main
pnpm install
node node_modules/prisma/build/index.js generate
node node_modules/prisma/build/index.js migrate status
node node_modules/typescript/bin/tsc --noEmit --incremental false
pnpm dev
```

**Sincronización de esta bitácora:** la copia de OneDrive seguía en la versión del
19 de octubre (13.470 bytes, secciones 1 a 13). Al copiar este archivo quedó con
las secciones 14 a 18 incluidas.

---

## 19. Nóminas reales y RUN (21 de octubre de 2026)

El colegio entregó el libro de matrícula `LIBRO DE MATRÍCULA DIGITAL-08-10-2026.xlsx`.
Tiene 23 hojas, pero las nóminas vigentes están solo en `110-EB` (básica) y
`310-EM` (media): las hojas `SBÁSICA` y `SMEDIA` están incompletas (4° B aparecía
con un solo alumno). Nomenclatura: `10` parvularia, `110` básica, `310` media, de
modo que `110-4A` es 4° básico A.

**Alcance cargado:** los ocho cursos de 4°, 6°, 8° básico y II medio.

| Curso | Vigentes | Códigos |
| --- | --- | --- |
| 4° básico A | 36 | `W4A-01…` |
| 4° básico B | 35 | `W4B-01…` |
| 6° básico A | 41 | `W6A-01…` |
| 6° básico B | 41 | `W6B-01…` |
| 8° básico A | 30 | `W8A-01…` |
| 8° básico B | 34 | `W8B-01…` |
| II medio A | 37 | `W2MA-01…` |
| II medio B | 35 | `W2MB-01…` |
| **Total** | **289** | PIN inicial `1234` |

Criterios aplicados:

- Se excluyeron **22 retirados definitivos** (no vuelven a aparecer en ninguna
  sección). Quedaron listados aparte, fuera del repositorio.
- **4 alumnos** aparecen en las dos secciones del mismo nivel: se interpretaron
  como cambio de curso y quedaron con **una sola ficha**, con matrícula `RETIRADA`
  en el origen y `ACTIVA` en el destino, usando las fechas del libro (el retiro del
  origen coincide con la matrícula del destino).
- Un RUN traía la fecha de retiro ilegible (`08-05-206`): se leyó como 08-05-2026 y
  ese alumno quedó excluido.
- Se borraron los 20 alumnos de prueba de 4° B y su asignación de ensayo. El
  respaldo quedó en `respaldo-4b.json`, fuera del repositorio.
- Los códigos de acceso incluyen la sección (`W4A`, `W4B`, `W2MA`…). El importador
  de `/admin` todavía arma el código con el nivel (`W4B`), así que una importación
  futura de 4° A por esa vía numeraría `W4B-36…` y no `W4A-…`: queda pendiente.

**RUN como dato del estudiante.** A pedido de la coordinación, el RUN pasó al
modelo: columna `run` opcional y única por colegio (migración
`20261021100000_run_estudiante`), cargada en los 289 alumnos. Validación del dígito
verificador: 278 correctos, 10 con cuerpo de 9 dígitos (RUN de extranjeros, válidos)
y **1 con dígito erróneo**, que se cargó tal como venía en el libro y quedó anotado
para confirmar con coordinación. Ningún RUN repetido.

El RUN ya se muestra en `/admin`, se acepta al crear un alumno y en la importación
desde Excel (columna `RUN` o `RUT`), viene en la plantilla descargable y aparece en
la ficha del alumno.

**Dónde quedaron los datos:** el libro, los planes intermedios y los respaldos con
datos personales se movieron a `C:\Proyectos\_matricula-privada`, **fuera del
repositorio**, para que no puedan versionarse por accidente. Lo único que quedó en
git es el código.

**Trampa nueva:** `pnpm db:seed` hace `TRUNCATE` de todas las tablas y borraría a
los 289 alumnos reales. No volver a correrlo contra esta base.

**Verificación:** `/api/health` responde 8 cursos y 289 estudiantes; el login de
`W4A-01` y de `W2MA-01` con PIN `1234` entra a `/alumno`; `/admin` lista los ocho
cursos y los 289 códigos.

---

## 20. Portada pública y login único (21 de octubre de 2026)

La aplicación ya no abre en el formulario de identificación. Ahora:

- **`/` es una portada pública**, estática e indexable: emblema del colegio, seis
  bloques con lo que la plataforma hace hoy, tres pasos de uso y una sección de
  privacidad que incluye el estado frente a la Ley 21.719. No consulta la base ni
  expone datos del colegio.
- **`/panel` es el panel** (antes vivía en `/`); se actualizaron el menú y las diez
  redirecciones internas.
- **`/login` es un solo formulario**: «Correo o código» y «Clave o PIN». La ruta
  deduce el rol por la forma del dato (con `@` es cuenta del equipo; sin `@`, código
  de estudiante) y sigue aceptando los campos antiguos (`tipo`, `email`, `clave`,
  `codigo`, `pin`).
- El emblema se procesó para quitarle el fondo blanco y recortarlo al círculo; de
  ahí sale también el icono de la pestaña.
- `robots.txt` y `sitemap.xml` nuevos; las rutas privadas quedan fuera del índice.

Pendiente: el **RBD real** del colegio (el `12345-6` era de la semilla y se quitó
del pie) y el **dominio definitivo**, que obliga a tocar `metadataBase`,
`robots.txt` y `sitemap.ts` si algún día deja de ser el de Railway.

**Verificación:** portada 200 con su titular y la sección de privacidad; `/panel`
sin sesión redirige a `/login`; clave incorrecta a `?error=credenciales`; un docente
en `/admin` vuelve a `/panel`; administrador y alumno entran a su panel; estáticos
200; tipos sin errores. Revisada renderizada en 1440, 768 y 500 px.


