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



## 2.2. Diseño de la observabilidad

### a) Métricas RED a capturar



### b) Configuración del SDK de OpenTelemetry



### c) Dashboard RED en Grafana