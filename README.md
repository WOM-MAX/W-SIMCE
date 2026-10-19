# W-SIMCE

Plataforma de gestión, rendición y analítica de evaluaciones estandarizadas para
colegios de Chile. Fase 0: **rebanada vertical** de 4° básico Matemática.

## Estado actual

- Esquema completo en Neon (26 tablas) aplicado con `prisma db push`.
- Banco sembrado con los **30 ítems reales** de `ENSAYO-4B-MAT-01`, sus
  alternativas, claves y justificaciones.
- 1 colegio, 1 curso (4° básico B), 20 estudiantes con código + PIN y una
  asignación vigente.
- Página de inicio y `/api/health` leyendo de la base.

Todavía **no** están implementados: login, rendición, corrección y reportes.

## Requisitos

- Node.js 22+ (probado con 24.21)
- pnpm 12+

## Puesta en marcha

```bash
pnpm install
pnpm exec prisma generate
pnpm db:push          # aplica el esquema en Neon
pnpm db:seed          # carga la rebanada (borra y recrea los datos)
pnpm dev              # http://localhost:3005
```

`pnpm db:seed` hace `TRUNCATE ... CASCADE` de todas las tablas: es para
desarrollo, no lo corras contra datos reales.

## Variables de entorno

`.env` (no se versiona) con dos cadenas de Neon:

```
DATABASE_URL="postgresql://...-pooler....neon.tech/neondb?sslmode=require"   # pooler
DIRECT_URL="postgresql://.......neon.tech/neondb?sslmode=require"           # directa
```

La pooled la usa la aplicación; la directa, las migraciones. Si rotas la
credencial, cambia ambas.

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
