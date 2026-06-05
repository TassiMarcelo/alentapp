# Análisis de Infraestructura para Producción

## 1. Análisis de la infraestructura Docker actual

Identifique los siguiente 5 problemas en los archivos `docker-compose.yml`, `packages/api/Dockerfile` y `packages/web/Dockerfile`:

| # | Problema | ¿Dónde ocurre? | Impacto | Solución propuesta |
|---|----------|----------------|---------|--------------------|
| 1 | **Imagen monolítica sin multi-stage build (incluye devDependencies y código sin compilar)**. Ambos Dockerfiles ejecutan `npm install` en una única etapa —que instala todas las dependencias, incluidas las de desarrollo— y luego copian todo el proyecto con `COPY . .`. La imagen final arrastra el toolchain completo (`typescript`, `tsx`, `vite`, etc.) y el código TypeScript sin compilar hasta el runtime de producción. Esto infla el tamaño de la imagen (~1 GB) y amplía la superficie de ataque. | `packages/api/Dockerfile:12` y `packages/web/Dockerfile:8` (`RUN npm install` + `COPY . .`) | Medio | Adoptar un [multi-stage build](https://docs.docker.com/build/building/multi-stage/): una etapa `build` que instale dependencias y compile, y una etapa `runtime` final que copie solo el artefacto compilado y las dependencias de producción (`npm ci --omit=dev`), reduciendo drásticamente el tamaño y quitando herramientas de build del contenedor. |
| 2 | **Credenciales hardcodeadas**. `POSTGRES_USER`, `POSTGRES_PASSWORD` y la `DATABASE_URL` están escritas en texto plano y versionadas en el repositorio. Las credenciales quedaron expuestas de forma permanente. | `docker-compose.yml:6-8` y `docker-compose.yml:30` | Alto | Mover los valores sensibles a un archivo `.env` excluido por `.gitignore` y referenciarlos con la sintaxis `${VAR}` (principio [Config del 12 Factor App](https://12factor.net/config)). En producción, usar [Docker secrets](https://docs.docker.com/compose/how-tos/use-secrets/) o variables de entorno del sistema. |
| 3 | **Ejecución como root**. Ninguno de los dos Dockerfiles define un usuario sin privilegios con la instrucción `USER`, por lo que el proceso corre como `root` (uid 0). Ante una vulnerabilidad de ejecución remota, el atacante obtiene control total del contenedor. | `packages/api/Dockerfile` y `packages/web/Dockerfile` (ausencia de instrucción `USER`) | Alto | Antes del `CMD`, crear y seleccionar un [usuario no-root](https://docs.docker.com/engine/security/) con la instrucción [`USER`](https://docs.docker.com/reference/dockerfile/#user): `RUN addgroup -S appgroup && adduser -S appuser -G appgroup` seguido de `USER appuser`. |
| 4 | **Bind-mount del código fuente en el servicio `api`** El volumen `.:/app` monta el directorio completo del host dentro del contenedor, anulando la imagen buildeada (el contenedor usa los archivos del host en lugar de los copiados en el build). Además otorga acceso de lectura/escritura a todo el repositorio, incluyendo archivos sensibles como `.env`. | `docker-compose.yml:25` (servicio `api`) | Alto | Eliminar el bind-mount de código fuente [en producción](https://docs.docker.com/compose/how-tos/production/). La imagen debe ser autosuficiente: todo el código necesario tiene que quedar copiado dentro de ella durante el build. |
| 5 | **Sin límites de recursos ni healthchecks para `api` y `web`** Estos servicios no definen `deploy.resources.limits` ni `healthcheck` (solo `db` tiene healthcheck). Un proceso con una fuga de memoria puede consumir todos los recursos del host y tirar al resto de los servicios, y Docker no puede saber si la API está realmente lista para recibir tráfico. | `docker-compose.yml` servicios `api` y `web` | Medio | Definir [límites de recursos](https://docs.docker.com/reference/compose-file/deploy/#resources) (p. ej. `memory: 512m`, `cpus: "0.5"`) y [healthchecks](https://docs.docker.com/reference/compose-file/services/#healthcheck) específicos: para la API `curl -f http://localhost:3000/health` y para el frontend `curl -f http://localhost:5173`. |

---

## 2. Investigación sobre OpenTelemetry

### ¿Qué es OpenTelemetry y cómo se diferencia de Prometheus?

[OpenTelemetry](https://opentelemetry.io/docs/) (OTel) es un estándar abierto de observabilidad que se encarga de **generar, recolectar y exportar** datos de telemetría (trazas, métricas y logs). Su gran ventaja es que **desacopla la instrumentación del backend de destino**: el código que mide la aplicación (contadores de requests, histogramas de latencia, etc.) no sabe a dónde van esos datos, de modo que el mismo código puede enviarlos a Prometheus, Grafana, Jaeger o cualquier herramienta
compatible sin tocar nada.

[Prometheus](https://prometheus.io/docs/introduction/overview/), en cambio, es un sistema de monitoreo **completo**: trae su propia base de datos de series temporales, un modelo de recolección *pull* (scraping, es decir, va a buscar las métricas al endpoint de cada servicio) y el lenguaje de consultas PromQL. Es decir, recolecta las métricas, las almacena y permite consultarlas. OTel solo cubre la parte de **instrumentar y exportar**: instrumentar es agregar código en la app que registre lo que ocurre internamente (como colocar sensores dentro del sistema) para luego exportar esos datos hacia herramientas como Prometheus.

### Los 3 pilares de la observabilidad

- **Trazas (Traces):** registran el recorrido completo de una request a través de los distintos servicios de un sistema distribuido.
- **Métricas (Metrics):** valores numéricos agregados que describen el estado del sistema en un momento dado (requests por segundo, uso de memoria, etc.).
- **Logs:** registro cronológico de eventos puntuales dentro de un componente (un usuario inició sesión, se creó un pago, falló una validación, etc.).

OpenTelemetry aborda **[los tres pilares](https://opentelemetry.io/docs/concepts/signals/)**, unificándolos bajo un único estándar de instrumentación y exportación.

### Métricas RED (Rate, Errors, Duration)

El método **[RED](https://grafana.com/blog/the-red-method-how-to-instrument-your-services/)**, definido por Tom Wilkie (Grafana Labs), propone monitorear tres métricas fundamentales por cada servicio:

- **Rate:** cantidad de requests por segundo que recibe el servicio. Refleja el volumen de tráfico actual.
- **Errors:** cuántas de esas requests están fallando (respuestas 4xx/5xx). Refleja la tasa de fallos que llegan al usuario.
- **Duration:** cuánto tarda en procesarse cada request. Refleja la latencia percibida por el usuario.

En conjunto dan una imagen directa de la experiencia del usuario: una tasa de error alta significa que los usuarios están recibiendo fallos, y una duración alta significa que el servicio responde lento.

### ¿Qué es OTLP y qué ventaja tiene frente a exportar directamente a Prometheus?

[OTLP](https://opentelemetry.io/docs/specs/otlp/) (OpenTelemetry Protocol) es el protocolo de red estándar de OpenTelemetry para transmitir trazas, métricas y logs desde las aplicaciones instrumentadas hacia un *collector* o un backend.

Su principal ventaja frente a exportar directamente a Prometheus es que con OTLP la instrumentación del código no queda acoplada a ningún backend en particular. Cambiar el destino de los datos (por ejemplo, de Prometheus a Datadog o a Grafana Cloud) se resuelve con un cambio de configuración en el collector (que recibe los datos y los reenvía al backend), sin modificar el código de la aplicación. Si en cambio se exporta directamente al formato de Prometheus, la app queda atada a ese backend y cualquier migración obliga a reescribir la instrumentación.

### ¿Cómo se relaciona OpenTelemetry con Grafana?

[Grafana](https://grafana.com/oss/opentelemetry/) es la **capa de visualización**. El flujo típico es:

1. El [SDK de OTel](https://www.npmjs.com/package/@opentelemetry/exporter-prometheus) en la API expone las métricas en formato Prometheus en el endpoint
   `:9464/metrics`.
2. Prometheus scrapea ese endpoint periódicamente y almacena las series temporales.
3. Grafana consulta a Prometheus como *datasource* mediante PromQL y muestra los datos en
   dashboards.

OTel no reemplaza ni a Grafana ni a Prometheus: provee los datos estandarizados que ambas herramientas consumen.
