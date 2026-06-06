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

**Propósito:** Construir una imagen de producción del frontend que **no incluya Node.js ni herramientas de build**. En desarrollo el frontend corre con el dev-server de Vite (`npm run dev --host`), pero eso no sirve para producción: es lento, expone el código sin minificar y arrastra todo el toolchain. El diseño compila la SPA a archivos estáticos y los sirve con **nginx**, que es liviano, rápido y pensado para servir assets. Así la imagen final no tiene `node`, ni `vite`, ni `typescript`, ni las devDependencies. Al igual que en la API, este **multi-stage build** es la respuesta directa al problema #1 del [análisis](analisis-mateolafalce.md) (*imagen monolítica sin multi-stage build*): la etapa final solo contiene los estáticos servidos por nginx.

**Estructura — 3 etapas:**

| Etapa | Nombre | Base | Propósito |
|---|---|---|---|
| Stage 1 | `deps` | `node:22-alpine` | Instalar dependencias del workspace con `npm ci` (necesita devDependencies como `vite`, `typescript` y `@vitejs/plugin-react` para poder compilar) |
| Stage 2 | `build` | `node:22-alpine` | Copiar el código y ejecutar `vite build` (sin `tsc -b`, para que un error de tipos no rompa la imagen de producción; el type-check vive en el CI), generando los estáticos en `packages/web/dist` |
| Stage 3 | `runtime` | `nginxinc/nginx-unprivileged:stable-alpine` | Copiar **solo** el contenido de `dist` a `/usr/share/nginx/html` y servirlo con nginx como usuario no-root (uid 101). No hay Node ni node_modules en esta etapa |

**Configuración de nginx (`packages/web/nginx.conf`):** como hoy no existe, hay que crearlo. Debe incluir:
- **SPA fallback:** `try_files $uri $uri/ /index.html;` — imprescindible porque la app usa `react-router` (client-side routing). Sin esto, recargar una ruta como `/socios` devuelve 404.
- **Compresión gzip:** activar `gzip on` para JS, CSS, JSON y SVG (reduce el peso de transferencia).
- **Cache de assets:** `Cache-Control` largo (ej. 1 año, `immutable`) para los assets con hash que genera Vite (`/assets/*`), y `no-cache` para `index.html` (así siempre toma la última versión).
- **Security headers:** `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer-when-downgrade` y, si aplica, `Content-Security-Policy`.

**Requisitos no funcionales:**
- Tamaño máximo de imagen: ~170MB (reducción ≥ 70% respecto a la actual ~570MB), apoyado en la base `nginxinc/nginx-unprivileged:stable-alpine` (~50MB) + estáticos
- Servir con **nginx**, no con Node.js en producción
- nginx escucha en el puerto `8080` (puerto no privilegiado: no requiere `CAP_NET_BIND_SERVICE`, por lo que es compatible con `cap_drop: ALL` y con correr como usuario no-root; se mapea afuera en el compose)
- Healthcheck: `wget -qO- http://127.0.0.1:8080/ || exit 1` cada 30s con 3 reintentos (se usa `wget` porque la base alpine no trae `curl`, y `127.0.0.1` en lugar de `localhost` para evitar que resuelva a IPv6 `::1`, donde nginx no escucha)
- `.dockerignore` debe excluir: `node_modules`, `.git`, `dist`, `coverage`, `e2e`, `*.test.ts`, `.env`

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

Las métricas RED permiten monitorear el comportamiento general de la API a través de tres aspectos fundamentales: volumen de tráfico, cantidad de errores y tiempo de respuesta.

| Métrica | Tipo OpenTelemetry | Descripción | Labels |
|----------|----------|----------|----------|
| Rate | Counter (`http.requests.total`) | Cantidad total de requests HTTP recibidos. Permite calcular requests por segundo (RPS). | method, route, status |
| Errors | Counter (`http.requests.errors`) | Cantidad de requests que finalizan con error (códigos 4xx y 5xx). | method, route, status |
| Duration | Histogram (`http.request.duration`) | Tiempo de procesamiento de cada request HTTP en milisegundos. | method, route |

### Métrica adicional implementada

| Métrica | Tipo OpenTelemetry | Descripción |
|----------|----------|----------|
| process.memory.usage | Observable Gauge | Memoria heap utilizada por el proceso Node.js. |

### Justificación

- **Rate** permite medir el nivel de tráfico recibido por la API.
- **Errors** permite detectar problemas funcionales y degradaciones del servicio.
- **Duration** permite analizar la latencia y experiencia percibida por los usuarios.
- **process.memory.usage** permite monitorear el consumo de memoria y detectar posibles fugas.

La combinación de estas métricas proporciona una visión completa del estado operativo de la aplicación y constituye la base para los dashboards de observabilidad en Grafana.


### b) Configuración del SDK de OpenTelemetry

```ts
// packages/api/src/infrastructure/telemetry.ts

import { NodeSDK } from '@opentelemetry/sdk-node';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { metrics } from '@opentelemetry/api';
import type { Meter } from '@opentelemetry/api';

// 1. PrometheusExporter en puerto 9464
const prometheusExporter = new PrometheusExporter({
  port: 9464,
  endpoint: '/metrics',
});

// 2. SDK con auto-instrumentaciones para HTTP y Fastify
const sdk = new NodeSDK({
  metricReader: prometheusExporter,
  instrumentations: [
    getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-http': {
        // No instrumentar el propio endpoint /metrics
        ignoreIncomingRequestHook: (req) =>
          req.url?.startsWith('/metrics') ?? false,
      },
      '@opentelemetry/instrumentation-fastify': {},
    }),
  ],
});

sdk.start();

// 3. Métricas personalizadas RED
const meter = metrics.getMeter('alentapp-api');

export function createREDMetrics(m: Meter = meter) {
  const requestCounter = m.createCounter('http.requests.total', {
    description: 'Total de requests HTTP recibidos',
  });

  const errorCounter = m.createCounter('http.requests.errors', {
    description: 'Total de requests HTTP con error (4xx/5xx)',
  });

  const requestDuration = m.createHistogram('http.request.duration', {
    description: 'Duración de cada request HTTP',
    unit: 'ms',
  });

  // Gauge: memoria del proceso
  const memoryGauge = m.createObservableGauge('process.memory.usage', {
    description: 'Uso de memoria heap del proceso Node.js',
    unit: 'By',
  });
  m.addBatchObservableCallback(
    (obs) => obs.observe(memoryGauge, process.memoryUsage().heapUsed),
    [memoryGauge]
  );

  // Gauge: requests concurrentes (se incrementa/decrementa desde los hooks)
  const activeRequests = m.createUpDownCounter('http.requests.active', {
    description: 'Requests HTTP actualmente en procesamiento',
  });

  return { requestCounter, errorCounter, requestDuration, activeRequests };
}

export { sdk, meter, prometheusExporter };
```


### c) Dashboard RED en Grafana