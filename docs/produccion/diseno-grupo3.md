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
| Stage 1 | `deps` | `node:22-alpine` | Instalar solo dependencias de producción con `npm ci --omit=dev` |
| Stage 2 | `build` | `node:22-alpine` | Copiar todas las dependencias, compilar TypeScript y generar el JS en `/dist` |
| Stage 3 | `runtime` | `node:22-alpine` | Copiar solo el JS compilado y las dependencias de producción, correr como usuario no-root |

**Requisitos no funcionales:**
- Tamaño máximo de imagen: ~300MB (reducción ≥ 70% respecto a la actual ~1GB)
- Usuario no-root: `node` (incluido en node:22-alpine)
- Healthcheck: `curl -f http://localhost:3000/ || exit 1` cada 30s con 3 reintentos
- `.dockerignore` debe excluir: `node_modules`, `.git`, `dist`, `*.test.ts`, `.env`, `coverage`

### b) packages/web/Dockerfile.prod


### c) docker-compose.prod.yml



## 2.2. Diseño de la observabilidad

### a) Métricas RED a capturar



### b) Configuración del SDK de OpenTelemetry



### c) Dashboard RED en Grafana