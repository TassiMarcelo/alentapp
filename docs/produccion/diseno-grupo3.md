---
grupo: Grupo 3
fecha: 2026-06-04
---

# Diseño de Infraestructura de Producción

## 2.1. Diseño de la infraestructura Docker

### a) packages/api/Dockerfile.prod

**Propósito:** Construir una imagen de producción optimizada de la API, eliminando todas las herramientas de desarrollo (TypeScript, tsx, devDependencies) del artefacto final. Esto reduce el tamaño de imagen y la superficie de ataque.

**Estructura — 3 etapas:**

| Etapa | Nombre | Base | Propósito |
|---|---|---|---|
| Stage 1 | `build` | `node:22-alpine` | Instalar dependencias completas, generar cliente Prisma y compilar TypeScript a `/dist` |
| Stage 2 | `deps-prod` | `node:22-alpine` | Instalar solo dependencias de producción con `npm ci --omit=dev` y limpiar paquetes innecesarios |
| Stage 3 | `runtime` | `node:22-alpine` | Copiar JS compilado y dependencias de producción, correr como usuario no-root |

**Requisitos no funcionales:**
- Tamaño obtenido: ~575MB (reducción del ~64% respecto a la imagen de desarrollo de 1.61GB)
- Usuario no-root: `node` (incluido en node:22-alpine)
- Healthcheck: `wget -qO- http://127.0.0.1:3000/ || exit 1` cada 30s con 3 reintentos
- Las migraciones de Prisma se ejecutan automáticamente al arrancar el contenedor

### b) packages/web/Dockerfile.prod












































### c) docker-compose.prod.yml

**Propósito:** definir un entorno productivo con los servicios `api`, `web` y `db`, aplicando buenas prácticas de seguridad, configuración externa, límites de recursos, healthchecks y logging con rotación.

**Servicios:**

| Servicio | Propósito |
|---|---|
| `db` | Base de datos PostgreSQL |
| `api` | Backend de la aplicación |
| `web` | Frontend servido con Nginx unprivileged |

**Configuración propuesta:**

| Aspecto | Requisito |
|---|---|
| Resource limits | CPU y memoria definidos por servicio |
| Healthchecks | Para API, Web y DB |
| Seguridad | `read_only: true`, `cap_drop: ALL`, `cap_add: NET_BIND_SERVICE`, `no-new-privileges:true` |
| Logging | Driver `json-file` con rotación: `max-size: 10m` y `max-file: 3` |
| Red | Red interna personalizada `alentapp-network` |
| Secrets | Variables sensibles desde archivo `.env` con `${VARIABLE}` |

**Límites de recursos por servicio:**

| Servicio | CPU | Memoria |
|---|---|---|
| `db` | 0.5 cores | 512MB |
| `api` | 1.0 cores | 512MB |
| `web` | 0.5 cores | 256MB |

**Decisiones técnicas:**
- La API usa `tmpfs` en `/tmp` para directorios de escritura temporal compatibles con `read_only: true`
- El Web usa `nginxinc/nginx-unprivileged` que corre como usuario no-root en puerto 8080, compatible con `cap_drop: ALL`
- Los directorios de caché de nginx se montan como `tmpfs` para permitir `read_only: true`



## 2.2. Diseño de la observabilidad

### a) Métricas RED a capturar



### b) Configuración del SDK de OpenTelemetry



### c) Dashboard RED en Grafana