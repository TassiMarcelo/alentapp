---
autor: Tassi Marcelo
fecha: 2026-06-04
---

# Análisis de Infraestructura Docker y OpenTelemetry

## 1.1. Problemas identificados en la infraestructura Docker actual

| Problema | ¿Dónde ocurre? | Impacto | Solución propuesta |
|---|---|---|---|
| **Sin multi-stage build**: la imagen final incluye TypeScript, tsx y todas las devDependencies, generando imágenes de ~1GB innecesariamente | `packages/api/Dockerfile:1` y `packages/web/Dockerfile:1` | Alto | Implementar multi-stage build con etapas separadas: instalación de dependencias, compilación y runtime |
| **Corre como root**: no hay instrucción `USER`, el proceso tiene permisos totales dentro del contenedor. Si hay una vulnerabilidad, el atacante obtiene acceso root | `packages/api/Dockerfile` y `packages/web/Dockerfile` (ausencia de USER) | Alto | Agregar `RUN adduser -S appuser` y `USER appuser` antes del CMD |
| **Credenciales hardcodeadas**: contraseñas en texto plano versionadas en el repositorio (`password123`) | `docker-compose.yml:6-8` y `docker-compose.yml:30` | Alto | Usar archivo `.env` no versionado y referenciarlos con `${VARIABLE}` en el compose |
| **Sin límites de recursos ni healthchecks en API y Web**: ningún servicio tiene límites de CPU ni memoria, y solo la DB tiene healthcheck | `docker-compose.yml` servicios `api` y `web` (ausencia) | Medio | Agregar `deploy.resources.limits` con `cpus` y `memory`, y healthchecks para API y Web |
| **Orden incorrecto de capas**: `COPY . .` copia todo el código antes de instalar dependencias, invalidando la caché del `npm install` en cada cambio de código | `packages/api/Dockerfile:17` y `packages/web/Dockerfile:11` | Medio | Copiar primero solo los `package.json`, instalar dependencias, y después copiar el código fuente |

---

## 1.2. Investigación OpenTelemetry

### ¿Qué es OpenTelemetry y cómo se diferencia de Prometheus?

OpenTelemetry es un estándar abierto para **instrumentar** aplicaciones y recolectar datos de observabilidad (métricas, trazas y logs). Es agnóstico al backend: no almacena ni visualiza datos, solo los genera y exporta a distintos destinos.

Prometheus en cambio es un sistema de **almacenamiento y consulta** de métricas que además hace scraping activo (va a buscar las métricas a los servicios). OpenTelemetry puede exportar datos hacia Prometheus, pero también hacia Jaeger, Grafana, Datadog, entre otros.

### ¿Cuáles son los "3 pilares" de la observabilidad? ¿Cuál aborda OpenTelemetry?

- **Métricas** → números agregados en el tiempo (ej: requests por segundo, uso de memoria)
- **Trazas** → seguimiento del flujo de una request a través de los servicios distribuidos
- **Logs** → registros de eventos puntuales con contexto

OpenTelemetry aborda los **3 pilares**, aunque su mayor adopción actual es en métricas y trazas.

### Métricas RED (Rate, Errors, Duration)

- **Rate** → ¿cuántas requests por segundo está recibiendo el sistema? Sirve para conocer el volumen de tráfico y detectar picos inesperados.
- **Errors** → ¿qué porcentaje de requests falla (4xx/5xx)? Sirve para detectar problemas en producción de forma temprana.
- **Duration** → ¿cuánto tarda en responder el sistema? Sirve para medir la experiencia del usuario y detectar degradaciones de performance.

### ¿Qué es el OTLP (OpenTelemetry Protocol)?

OTLP es el protocolo de comunicación propio de OpenTelemetry para enviar datos de telemetría desde la aplicación hacia un backend de observabilidad.

La ventaja frente a exportar directamente a Prometheus es que OTLP es **agnóstico al backend**: con el mismo código de instrumentación podés enviar los datos a cualquier destino (Prometheus, Jaeger, Grafana Cloud, Datadog) simplemente cambiando la configuración del exportador, sin modificar el código de la aplicación.

### ¿Cómo se relaciona OpenTelemetry con Grafana?

Grafana es la herramienta de **visualización**. La relación es:

1. OpenTelemetry instrumenta la aplicación y exporta métricas
2. Prometheus las recibe y almacena
3. Grafana consulta Prometheus y las muestra en dashboards

También existe Grafana Tempo, que recibe trazas directamente desde OpenTelemetry sin necesitar Prometheus como intermediario.