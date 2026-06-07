---
grupo: Grupo 3
fecha de creación: 2026-06-04
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

**Propósito:** Un dashboard en Grafana que materializa el método **RED** (**Rate, Errors, Duration**) para visualizar en tiempo real la salud de la API en producción. Lee las métricas que OpenTelemetry captura y que Prometheus scrapea del endpoint `:9464/metrics`, permitiendo diagnosticar en un vistazo: *¿cuánto tráfico?*, *¿cuántos fallos?*, *¿qué tan rápido?*. Cierra el pilar de **observabilidad**: hoy no hay forma de monitorear el desempeño en producción.

**Metadatos del dashboard:**

| Aspecto | Valor |
|---|---|
| Nombre | `RED — Alentapp API` |
| Datasource | Prometheus (job `opentelemetry`) |
| Ubicación | `observability/grafana/dashboards/red-metrics.json` |
| Auto-refresh | 5 segundos |
| Rango temporal | Últimos 15 minutos |

**Los 6 paneles:**

| # | Panel | Gráfico | Consulta PromQL | Propósito |
|---|---|---|---|---|
| 1 | **Requests/s** | Time series | `sum by (route) (rate(http_requests_total[1m]))` | **Rate**: volumen de tráfico por ruta |
| 2 | **Error %** | Time series | `sum(rate(http_requests_total{status=~"5.."}[1m])) / sum(rate(http_requests_total[1m])) * 100` | **Errors**: % de fallos (5xx) |
| 3 | **Latencia p95/p99** | Time series | `histogram_quantile(0.95, sum by (le) (rate(http_request_duration_bucket[5m])))` y `0.99` | **Duration**: performance percibido (ms) |
| 4 | **Por status code** | Stacked area | `sum by (status) (rate(http_requests_total[5m]))` | Distribución de respuestas (2xx/3xx/4xx/5xx) |
| 5 | **Memoria (MB)** | Time series | `process_memory_usage / 1024 / 1024` | Consumo de memoria del proceso Node |
| 6 | **Top 5 lentos** | Bar chart | `topk(5, sum by (route) (rate(http_request_duration_sum[5m])) / sum by (route) (rate(http_request_duration_count[5m])))` | Endpoints más lentos (cuello de botella) |

**Decisiones de cada panel:**

- **Panel 1 (Rate/Requests):** Desglosado `by (route)` para ver qué endpoints concentran el tráfico. Ventana `[1m]` para máxima reactividad, detectando picos o caídas al instante.

- **Panel 2 (Errors):** Calcula el **% de error** como: (5xx por minuto) / (total de requests por minuto) × 100. Más útil que contar fallos absolutos. Incluir **thresholds visuales**: verde <1%, ámbar 1-5%, rojo >5% para alertar a simple vista.

- **Panel 3 (Duration):** Muestra **p95 y p99** del histograma de latencia (dos líneas). `histogram_quantile` requiere buckets agregados `by (le)`. Ventana `[5m]` suaviza el ruido cuando hay bajo volumen. Los percentiles representan mejor la experiencia del usuario que promedios simples.

- **Panel 4 (Status codes):** Área apilada con colores semafóricos: 2xx verde, 3xx azul, 4xx ámbar, 5xx rojo. Permite leer la distribución de respuestas de un golpe. Ventana `[5m]` para tendencia.

- **Panel 5 (Memoria):** Complementa RED con consumo de memoria (en MB). Detecta memory leaks o presión de heap antes de que causen crashes. Tendencia en el tiempo es clave.

- **Panel 6 (Top 5 endpoints lentos):** Latencia **promedio** por ruta = `rate(sum) / rate(count)` (fórmula correcta para histogramas). Ordenado con `topk(5, ...)` expone los cuellos de botella más relevantes.

**Layout (grilla de 24 columnas de Grafana):**

| Fila | Paneles | Distribución |
|---|---|---|
| 1 | `1 Requests/s` · `2 Error %` · `3 Latencia p95/p99` | 8 + 8 + 8 columnas |
| 2 | `4 Status code` · `5 Memoria` | 12 + 12 columnas |
| 3 | `6 Top 5 endpoints lentos` | 24 columnas (ancho completo) |

**Consideraciones técnicas:**

- **Ventanas de tiempo:** `[1m]` para tráfico y errores (máxima reactividad); `[5m]` para percentiles y latencia (estable ante bajo volumen).
- **Queries PromQL:** Todas usan `rate(...)` nunca el counter crudo. Un Counter solo crece; `rate()` devuelve la pendiente por segundo (lo que tiene sentido graficar).
- **Colores y thresholds:** Panel 2 con thresholds semafóricos (verde/ámbar/rojo). Panel 4 con mapeo de color por familia HTTP.
- **Dependencias:** El dashboard requiere que:
  - §2.2.a capture métricas RED con labels `method`, `route`, `status`
  - §2.2.b exponga PrometheusExporter en `:9464/metrics`
  - §3.4 configure Prometheus para scrapear ese endpoint
  - Si no llegan datos → paneles vacíos = validación de que OTel → Prometheus → Grafana funciona.
- **Naming de métricas:** Las consultas usan los nombres que el `PrometheusExporter` deriva de las métricas custom definidas en §2.2.a (no las de auto-instrumentación). El serializer convierte `.` → `_`, agrega `_total` solo a counters monótonos que no lo tengan y **no** agrega sufijo de unidad. Por eso los nombres efectivos son: `http_requests_total` (labels `method`, `route`, `status`), `http_requests_errors_total`, el histograma `http_request_duration_{bucket,sum,count}` (labels `method`, `route`) y el gauge `process_memory_usage` (en bytes; se divide por `1024/1024` para mostrar MB). El **Panel 2** calcula el % de error sobre `http_requests_total{status=~"5.."}` (5xx) en lugar de un sufijo de auto-instrumentación.