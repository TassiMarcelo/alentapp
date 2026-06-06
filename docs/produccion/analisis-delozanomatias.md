---
autor: De Lozano Matías
fecha: 2026-06-05
---

# Análisis de Infraestructura Docker y OpenTelemetry para producción.

## 1.1. Problemas identificados en la infraestructura Docker actual

| Problema | ¿Dónde ocurre? | Impacto | Solución propuesta |
|---|---|---|---|
| **Falta `.dockerignore` — se copian archivos innecesarios al contenedor** | `packages/api/Dockerfile:14` y `packages/web/Dockerfile:9` (`COPY . .`) | Medio | Crear `.dockerignore` excluyendo: `.git`, `node_modules`, `dist`, `coverage`, `e2e`, `.env*`. Esto acelera los builds y reduce el contexto enviado a Docker. |
| **Variables de entorno hardcodeadas en docker-compose.yml** | `docker-compose.yml:6-8` (POSTGRES_PASSWORD, DATABASE_URL) | Alto | Mover credenciales a un archivo `.env` no versionado y usar `${VARIABLE}` en el compose. Evita exponer contraseñas en el repositorio. |
| **Volumen de código sin protección — permite modificar archivos sensibles desde el contenedor** | `docker-compose.yml:25` y `docker-compose.yml:47` (volumen `.:/app`) | Alto | Usar `read_only: true` o eliminar el bind-mount en producción. Protege `.env`, `package.json` y otros archivos críticos. |
| **Sin límites de recursos ni healthchecks para API y Web** | `docker-compose.yml` servicios `api` y `web` (ausencia de estos) | Medio | Agregar `deploy.resources.limits` (CPU/memoria) y `healthcheck` para cada servicio. Evita que procesos con fugas de memoria causen problemas. |
| **Comando entrypoint ejecuta múltiples comandos sin validación de errores** | `docker-compose.yml:31` (comando con `npx prisma`, `npx prisma generate`, `npx tsx`) | Medio | Usar `&&` entre comandos para que si uno falla, el contenedor no continúe en estado inconsistente. |

---

## 1.2. Investigación sobre OpenTelemetry

### ¿Qué es OpenTelemetry y cómo se diferencia de Prometheus?

**OpenTelemetry** es un estándar abierto para **instrumentar** aplicaciones. Te proporciona librerías y herramientas para agregar código que mida lo que sucede internamente (requests, errores, latencia). La ventaja principal es que **NO está acoplado a ningún backend específico**: escri­bes el código una sola vez y puedes enviar esos datos a Prometheus, Grafana, Jaeger, Datadog, etc., solo cambiando la configuración.

**Prometheus** es un sistema de monitoreo **completo**: incluye almacenamiento de datos (base de datos de series temporales), recolección activa (scraping) y un lenguaje de consultas (PromQL). Recibe las métricas, las guarda y permite consultarlas.

**En resumen:** OpenTelemetry = el código que mide; Prometheus = dónde se guardan y consultan esos datos.

### Los 3 pilares de la observabilidad y cuál aborda OpenTelemetry

La observabilidad se construye sobre 3 tipos de datos:

- **Trazas (Traces):** El recorrido completo de una request a través de múltiples servicios. Responden: "¿por dónde pasó mi request?" y "¿cuánto tiempo pasó en cada servicio?".
- **Métricas (Metrics):** Números agregados en el tiempo que muestran el estado del sistema (requests por segundo, latencia p95, CPU, memoria).
- **Logs:** Eventos puntuales con contexto ("Usuario X inició sesión", "Error en BD", "Pago procesado").

**OpenTelemetry aborda los 3 pilares.** Ofrece librerías que permiten capturar trazas, métricas y logs de forma estándar y exportarlos juntos al mismo destino, lo que mejora la correlación de datos.

### Métricas RED (Rate, Errors, Duration)

El método **RED** propone monitorear 3 métricas fundamentales que responden directamente a la experiencia del usuario:

- **Rate:** ¿cuántas requests por segundo recibe el servicio? Refleja el volumen de tráfico. Un pico inesperado puede indicar un ataque o un problema en el cliente.
- **Errors:** ¿qué porcentaje de requests falla (4xx/5xx)? Refleja la disponibilidad que ve el usuario. Una tasa alta es un problema inmediato.
- **Duration:** ¿cuánto tarda en responder? Refleja la latencia percibida. Una latencia alta degrada directamente la experiencia.

Con estas 3 métricas se tiene un panorama completo: tráfico, disponibilidad y performance.

### ¿Qué es OTLP (OpenTelemetry Protocol)? ¿Qué ventaja tiene frente a exportar directamente a Prometheus?

**OTLP** es el protocolo de red estándar de OpenTelemetry para transmitir datos de telemetría desde la aplicación hacia un backend.

**Ventaja principal:** Con OTLP el código de instrumentación NO queda acoplado a ningún backend específico. Si mañana quieres cambiar de Prometheus a Grafana Cloud o Datadog, solo cambias la configuración del exportador, no el código de la aplicación. Si en cambio exportaras directamente al formato de Prometheus, quedarías atado a ese backend y cualquier migración requeriría reescribir la instrumentación.

### ¿Cómo se relaciona OpenTelemetry con Grafana?

**Grafana** es la capa de **visualización**. El flujo típico es:

1. **OpenTelemetry** instrumenta la API y exporta métricas en formato Prometheus (`:9464/metrics`)
2. **Prometheus** scrapea ese endpoint periódicamente (cada 15s) y almacena las series temporales en su base de datos
3. **Grafana** consulta a Prometheus mediante PromQL y crea dashboards con gráficos en tiempo real

OpenTelemetry no reemplaza a Prometheus ni a Grafana; es el medio que proporciona los datos estandarizados que ambas herramientas consumen e interpretan. Juntas forman la **cadena de observabilidad**.