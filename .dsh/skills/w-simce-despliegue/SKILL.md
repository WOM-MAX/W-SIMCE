---
name: w-simce-despliegue
description: Desplegar W-SIMCE en Railway y administrar el DNS del colegio en el VPS con PowerDNS y cPanel, sin tocar el sitio principal.
---

# Despliegue y DNS de W-SIMCE

## Railway

Proyecto `W-SIMCE`, entorno `production`, servicio `W-SIMCE`. El vínculo es por carpeta:
hay que estar en la raíz del repo. CLI probada: 5.71.0, autenticada con la cuenta del usuario.

```
railway status --json            # proyecto, entorno y servicio vinculados
railway up -d -y                 # construye y despliega desde el Dockerfile
railway deployment list --json    # último despliegue y su commit
railway domain status <dominio>  # estado del dominio y del certificado
railway domain certificate retry <dominio>
railway open                     # panel del proyecto
```

`railway.toml` define `preDeployCommand = prisma migrate deploy`. Corre contra la base real en
cada despliegue. Es idempotente, pero conviene saberlo antes de lanzarlo.

**Si `railway up` responde "Deploys have been paused temporarily"** puede ser una caída de la
plataforma, no un problema de cuenta. El panel muestra el aviso "Limited Access" y la barra
superior dice si es un incidente. En ese caso no hay nada que arreglar: se espera. Railway
rehabilita por tramos: Enterprise, Pro, Hobby, y al final Free y Trial.

## El DNS

La zona `colegioacropolis.net` vive en un VPS propio, no en un panel externo:

| Dato | Valor |
|---|---|
| Alias SSH | `hermes-vps`, puerto 22022, usuario root |
| IP | 162.240.230.181 y 162.240.234.63 |
| Servidor | PowerDNS con backend bind: `launch=bind`, `bind-config=/etc/named.conf` |
| Archivos de zona | `/var/named/<zona>.db` |
| Recarga | `pdns_control bind-reload-now <zona>` |

El servidor también corre cPanel y Apache, y ahí vive el sitio del colegio. **El apex y `www`
no se tocan nunca.**

## Trampas comprobadas

**`whmapi1 removezonerecord` usa números de línea que no coinciden con el archivo de zona.**
Con `line=44` borré `www.w-simce` en lugar del registro buscado. No usar esa API para borrar.
El procedimiento seguro es editar el archivo de zona con una regla por nombre y tipo, respaldar
antes, subir el serial del SOA y recargar. Después, comparar contra el respaldo con `diff` y
confirmar que solo cambió lo previsto.

**Un CNAME no puede convivir con otros registros del mismo nombre.** Un subdominio de cPanel
suele tener A, SPF, DKIM y SRV. Antes de poner un CNAME hay que quitar los que estén en el
nombre exacto, y antes de quitarlos hay que verificar que no haya buzones ni contenido:
`ls /home/<sub>`, `whmapi1 list_pops`.

**El TTL viejo se queda.** Un A con TTL 14400 sigue cacheado hasta cuatro horas en resolvers
intermedios. `ipconfig /flushdns` limpia Windows, no Chrome: el navegador tiene su propia caché
en `chrome://net-internals/#dns`. Los resolvers públicos se comprueban con
`Resolve-DnsName <host> -Server 8.8.8.8`.

**Un certificado comodín en el VPS puede ocultar el problema.** HTTPS contra el dominio puede
responder sin error aunque siga sirviendo el servidor viejo. Para saber a quién se conecta uno:
`curl -o NUL -w "%{remote_ip} %{http_code}" <url>`, y para forzar el borde de Railway:
`curl --resolve <dominio>:443:<ip-del-borde>`.

## Orden correcto para mover un dominio a Railway

1. `railway domain <dominio>` y copiar los registros que pide, que suelen ser un CNAME a un
   destino propio del tipo `<algo>.up.railway.app` y un TXT de verificación.
2. Crear el TXT. Sin él no se emite el certificado.
3. Borrar el A conflictivo y crear el CNAME.
4. `pdns_control bind-reload-now` y verificar desde el propio VPS con `dig @127.0.0.1`.
5. Esperar a que Railway marque `verified: true` y el certificado `VALID`. Puede tardar varios
   minutos, y el estado de propagación oscila mientras algunos resolvers siguen con el TTL viejo.
