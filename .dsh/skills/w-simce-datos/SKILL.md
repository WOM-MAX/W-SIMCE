---
name: w-simce-datos
description: Operar la base de W-SIMCE en lectura segura, conocer sus conteos de referencia y sus trampas de Prisma y de historial, respetando que la reparación del banco la hace Codex.
---

# Datos de W-SIMCE

## Reparto

La reparación de ítems y figuras la hace Codex, sobre una copia de la base. Este skill es para
leer, medir y verificar. No es para escribir en las tablas del banco.

Prohibido sobre el banco: `prisma migrate`, `prisma db push`, `prisma db seed`, `UPDATE`,
`DELETE`, `DROP`, `TRUNCATE` y los scripts de carga o reparación.

## Conteos de referencia

Sirven para detectar que alguien cambió algo entre dos sesiones:

| Tabla | Filas |
|---|---|
| `Figura` | 415 |
| `Item` | 1926 |
| `ItemVersion` | 1926 |
| `Alternativa` | 7704 |
| Figuras sin ítem | 16 |

Otros repartos medidos: 439 ítems con figura, 884 solo con texto, 603 sin figura ni texto.

## La trampa del historial

`Item.figuraId` cuelga del ítem, pero los ensayos guardan `ItemVersion`. No hay copia de la
figura por versión. Consecuencia: **cambiar `Figura.primitivas` reescribe también los ensayos ya
rendidos que contienen ese ítem.** Hay 36 figuras compartidas por dos o más ítems.

Para corregir un solo ítem sin tocar el historial: crear una `Figura` nueva y reasignar solo ese
`Item`. Mutar la compartida cambia para todos, incluido el pasado.

## Respaldo

No hay `pg_dump` en la máquina. El respaldo es una exportación a JSON con Prisma:

```
figura, item (id, codigo, figuraId, textoId), itemVersion, alternativa -> tmp-figuras/respaldo-<fecha>.json
```

Un respaldo de las cuatro tablas ronda los 5 MB. `tmp-figuras/` está en `.gitignore`.

## Prisma en Windows

`prisma generate` falla con `EPERM` si algún proceso tiene cargado el motor. Ocurrió con dos
servidores arriba. Antes de regenerar hay que parar los procesos de Node que usen Prisma, y
después volver a levantar el de desarrollo.

## Entorno

- Base PostgreSQL. `DATABASE_URL` y `DIRECT_URL` en `.env`.
- Migraciones aplicadas, incluida `20261021100000_run_estudiante`. La carpeta
  `prisma/migrations` es la fuente de verdad.
- Servidor de desarrollo en el puerto 3005. El 3011 quedó apagado.
- El log del 3005 muestra cierres de conexión de Prisma contra Neon: son conexiones ociosas que
  se reciclan, no errores de la aplicación.

## Al consultar

Preferir `findMany` con `select` explícito y `count` para verificar. No traer `primitivas`
completas si solo se necesitan conteos: son 415 documentos JSON. Y cerrar siempre con
`prisma.$disconnect()`.
