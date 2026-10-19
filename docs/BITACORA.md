# Bitácora de W-SIMCE

**Qué es:** plataforma de gestión, rendición y analítica de evaluaciones estandarizadas
para colegios de Chile (SIMCE). Nombre comercial: **W-SIMCE**.
**Última actualización:** 19 de octubre de 2026.
**Estado:** Fase 0 en curso. Repositorio creado, **banco completo importado en Neon**
(1.159 ítems), app funcionando en local, despliegue en Railway pendiente de la URL.

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
