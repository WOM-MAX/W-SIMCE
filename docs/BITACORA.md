# Bitácora de W-SIMCE

**Qué es:** plataforma de gestión, rendición y analítica de evaluaciones estandarizadas
para colegios de Chile (SIMCE). Nombre comercial: **W-SIMCE**.
**Última actualización:** 19 de octubre de 2026.
**Estado:** Fase 0 desplegada en producción. Acceso, administración, generación de
ensayos, rendición, corrección y reportes funcionando. Pendiente asignar los
ensayos a un curso (ver sección 14).

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
