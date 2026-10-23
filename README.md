# W-SIMCE

Plataforma de gestión, rendición y analítica de evaluaciones estandarizadas para
colegios de Chile. Fase 0: **rebanada vertical** de 4° básico Matemática.

## Estado actual

- Esquema completo en Neon (26 tablas) aplicado con `prisma db push`.
- **Banco completo importado**: 1.159 ítems (8 bancos, formas 1 a 3) con 4.636
  alternativas, 147 textos de Lectura, 352 figuras, 191 objetivos y 1.073 indicadores.
- 19 ensayos de 30 ítems listos para asignar.
- 1 colegio, 1 curso (4° básico B), 20 estudiantes con código + PIN y una
  asignación vigente.
- Página de inicio y `/api/health` leyendo de la base.

Todavía **no** están implementados: login, rendición, corrección y reportes.

El banco se importa desde el proyecto de ensayos con `pnpm db:importar`
(idempotente; no duplica ítems si se corre de nuevo).

## Requisitos

- Node.js 22+ (probado con 24.21)
- pnpm 12 (`npm install -g pnpm@12.3.4` si no lo tienes)

## Primer clone (la base ya existe en Neon)

```bash
git clone https://github.com/WOM-MAX/W-SIMCE.git
cd W-SIMCE
# crea .env con las dos cadenas de Neon (ver más abajo)
pnpm install
pnpm dev              # http://localhost:3005
```

Comprobación: `http://localhost:3005/api/health` debe responder
`{"ok":true,...,"conteos":{...}}`. No hace falta `db:push` ni `db:seed`: el esquema
y la semilla ya están aplicados en Neon.

## Solo si quieres recrear la base

```bash
pnpm exec prisma generate
pnpm db:push          # aplica el esquema
pnpm db:seed          # carga la rebanada
```

`pnpm db:seed` hace `TRUNCATE ... CASCADE` de todas las tablas: es para
desarrollo, no lo corras contra datos reales.

## Push desde otro equipo

El repositorio se clona sin credenciales por ser público, pero para hacer `push`
desde otra máquina necesitas autenticarte: Git Credential Manager (ventana del
navegador) o una clave SSH registrada en GitHub. La bitácora
[`docs/BITACORA.md`](docs/BITACORA.md) tiene el detalle.

## Variables de entorno

`.env` (no se versiona) con dos cadenas de Neon:

```
DATABASE_URL="postgresql://...-pooler....neon.tech/neondb?sslmode=require"   # pooler
DIRECT_URL="postgresql://.......neon.tech/neondb?sslmode=require"           # directa
```

La pooled la usa la aplicación; la directa, las migraciones. Si rotas la
credencial, cambia ambas.

Para enviar las invitaciones por correo (opcional):

```
RESEND_API_KEY="re_..."                                        # proveedor de envío
MAIL_FROM="W-SIMCE <no-reply@colegioacropolis.net>"            # remitente verificado
PUBLIC_BASE_URL="https://w-simce.colegioacropolis.net"         # opcional: base del enlace
```

Sin `RESEND_API_KEY` el alta de un funcionario igual funciona, pero el enlace de
activación se muestra en pantalla en vez de enviarse. El dominio del remitente
debe tener SPF y DKIM en el DNS del colegio.

## Estructura

```
app/                  Next.js 15 (App Router)
  api/health/         estado de la base
  page.tsx            panel de inicio (datos reales)
lib/prisma.ts         cliente singleton
prisma/schema.prisma  modelo de datos
prisma/seed.mjs       importa el banco del proyecto de ensayos
pnpm-workspace.yaml   permisos de scripts de pnpm (Prisma)
```

## Modelo de datos (resumen)

`Colegio → AnioEscolar → Curso → Matricula → Estudiante`; currículum en
`Nivel / Asignatura / Eje / Objetivo / Indicador`; banco en
`Item → ItemVersion → Alternativa`; evaluación en
`Ensayo → EnsayoItem → Asignacion → Intento → IntentoItem → Respuesta`; resultados
en `ResultadoIntento` y `ResultadoDimension`.

Dos decisiones que sostienen los informes históricos:

1. `IntentoItem` copia eje, habilidad, bloom y dificultad al iniciar. Editar un
   ítem después no reescribe el pasado.
2. El ítem se versiona: los ensayos e intentos apuntan a `ItemVersion`, nunca al
   ítem vivo.

## Credenciales de prueba (solo desarrollo)

- Docente: `docente@acropolis.cl` / `demo1234`
- Estudiantes: `W4B-01` … `W4B-20` / PIN `1234`

## Notas

- El plan gratuito de Neon suspende la base por inactividad: el primer request
  puede tardar ~1 s.
- La cadena de conexión estuvo en una conversación; conviene rotarla antes de
  abrir la plataforma a usuarios reales.
- Datos de menores: antes de producción hay que resolver base legal,
  minimización, retención y control de acceso (Ley 21.719).

## Administración

El primer administrador se crea desde la consola, porque no hay ninguno todavía:

```bash
node --env-file=.env prisma/crear-admin.mjs admin@acropolis.cl "clave-de-8-o-mas"
```

Si el correo ya existe, lo promueve a ADMIN y le cambia la clave.

Con esa cuenta, `/admin` permite crear docentes (con rol DOCENTE, UTP o ADMIN),
crear estudiantes con código automático, y restablecer claves y PIN.

Al crear un docente o directivo **no se fija una clave**: la cuenta nace con una
clave aleatoria que nadie conoce y se envía una invitación para que la persona
defina la suya. El enlace (`/activar?token=...`) sirve una sola vez y vence en
siete días; en la base queda solo el hash del token. Si `RESEND_API_KEY` no está
configurada, el alta no falla: la pantalla muestra el enlace para entregarlo a
mano.

La sesión se firma con HMAC-SHA256 y viaja en una cookie `httpOnly`. Requiere
`SESSION_SECRET` de 32 caracteres o más en el entorno; sin ella el login
responde con un error de configuración, no con un fallo genérico.
