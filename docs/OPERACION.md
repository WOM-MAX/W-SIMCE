# Operación de W-SIMCE

Qué hacer cuando algo falla, cómo desplegar y cómo se respalda. Complementa
`docs/PLAN-DE-IMPLEMENTACION.md` y `docs/CICLO-ANUAL.md`.

## Estado del servicio

- Producción: <https://w-simce.colegioacropolis.net>
- Salud: `curl -s https://w-simce.colegioacropolis.net/api/health`
  Debe responder `{"ok":true,...,"conteos":{...}}`. Si responde 503, la base no
  está respondiendo.
- Base: Neon (PostgreSQL), en `sa-east-1`.

## Desplegar

1. `git push origin main`.
2. Railway construye la imagen desde `Dockerfile`.
3. Antes de levantar el contenedor corre `prisma migrate deploy` (definido en
   `railway.toml`). Si la migración falla, el despliegue se aborta: es lo deseado.
4. Verificar `/api/health` y la portada.

Las migraciones son **aditivas**: agregan columnas o tablas, nunca borran ni
renombran. Por eso el despliegue anterior sigue funcionando durante la transición.

## Volver atrás

1. Railway → Deployments → elegir el despliegue anterior → Redeploy.
2. No hay que revertir la base: las columnas nuevas quedan y el código anterior
   las ignora.

## Respaldo

```bash
node --env-file=.env scripts/respaldo.mjs
node scripts/verificar-respaldo.mjs respaldos/<sello>
```

Escribe un JSON por tabla en `respaldos/<fecha>/` con un manifiesto de conteos y
SHA-256. La verificación comprueba que cada archivo coincide con su huella.

**Limitación conocida:** este equipo no tiene el cliente de PostgreSQL
(`pg_dump`/`psql`), así que el respaldo es lógico (JSON), no un volcado
restaurable con `pg_restore`. Para una restauración completa hace falta instalar
las herramientas de PostgreSQL o usar el punto de restauración de Neon desde su
consola. Mientras tanto, el respaldo sirve como evidencia y para recuperar filas
puntuales.

## Si la base no responde

1. `/api/health` en 503 con `Authentication failed` → la credencial cambió.
   Actualizar `DATABASE_URL` y `DIRECT_URL` en Railway (ambas) y redesplegar.
2. `/api/health` en 503 con timeout → Neon suspendido por inactividad. El primer
   request puede tardar uno o dos segundos; si persiste, revisar el estado de Neon.
3. Si se rotó la contraseña en Neon, además hay que reiniciar el proceso: Prisma
   crea su pool al arrancar y no toma una URL nueva en caliente.

## Seguridad

- **Dos administradores técnicos** como mínimo: si uno no está, nadie crea cuentas
  ni restaura un respaldo.
- **"Ver como"** queda registrado en la auditoría con las dos identidades y es de
  solo lectura: no permite escribir en nombre de otro.
- **Freno de login**: 5 intentos fallidos por cuenta cada 15 minutos
  (`lib/eventos.ts`). La activación de invitaciones no lo necesita: el token tiene
  32 bytes aleatorios y una sola vida.
- **Claves**: cada persona puede cambiarla en `/cuenta`; el administrador técnico
  puede restablecerla desde Administración.
- Los datos de menores exigen acuerdo de confidencialidad para quien administra.

## Ciclo anual

| Cuándo | Qué |
|---|---|
| Enero–febrero | Crear el año en planificación; copiar cursos; promover estudiantes |
| 1 de marzo | Activar el año |
| Marzo–diciembre | Operación normal |
| 21 de diciembre | Cerrar el año (bloquea la escritura) |

Al cerrar, todo queda en solo lectura. Para corregir algo después hay que
reabrirlo a planificación desde Administración → Años escolares.

## Comprobaciones después de cada despliegue

```bash
curl -s https://w-simce.colegioacropolis.net/api/health
curl -s -o /dev/null -w "%{http_code}\n" https://w-simce.colegioacropolis.net/
```

Y las pruebas de permisos, que corren contra el servidor local:

```bash
pnpm dev                     # en otra terminal
node --env-file=.env scripts/prueba-matriz.mjs
node --env-file=.env scripts/prueba-anio.mjs
node --env-file=.env scripts/prueba-promocion.mjs
node --env-file=.env scripts/prueba-direccion.mjs
node --env-file=.env scripts/prueba-ver-como.mjs
```
