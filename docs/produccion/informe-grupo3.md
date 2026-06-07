---
grupo: Grupo 3
fecha: 2026-06-07
actividad: TP Integrador - Actividad 4 (Preparando para Producción)
---

# Informe de Producción — Grupo 3

Este informe documenta la **verificación** del entorno productivo de AlentApp y las
**decisiones técnicas** adoptadas en las fases anteriores. Es la entrega de la **Fase 4**
del TP Integrador - Actividad 4.

Las verificaciones se ejecutaron sobre el stack levantado con
`docker compose -f docker-compose.prod.yml up -d` (servicios `db`, `api`, `web`,
`prometheus`, `grafana`), con tráfico real generado contra la API.

Documentos relacionados:
- Análisis individual de referencia: [analisis-mateolafalce.md](analisis-mateolafalce.md)
- Diseño del grupo: [diseno-grupo3.md](diseno-grupo3.md)

---

## 4.1. Verificación técnica

Comparación de las imágenes y el runtime **antes** (entorno de desarrollo,
`docker-compose.yml`) y **después** (entorno productivo, `docker-compose.prod.yml`).

| Métrica | Antes (desarrollo) | Después (producción) | Mejora |
|---|---|---|---|
| Tamaño imagen API | **1.67 GB** (`alentapp-api:dev`) | **473 MB** (`alentapp-api:prod`) | **−71.7%** ✅ (meta ≥70%) |
| Tamaño imagen Web | **1.02 GB** (`alentapp-web:dev`) | **82.5 MB** (`alentapp-web:prod`) | **−91.9%** ✅ |
| Tiempo de startup API | modo `tsx watch` (compila TS on-the-fly + `prisma migrate dev`): arranque en frío del orden de decenas de segundos | **~1.2 s** hasta *"Server listening"* (JS precompilado + `migrate deploy` sin migraciones pendientes) | arranque casi inmediato |
| Memoria API (idle) | — | **~64 MiB** / 512 MiB (RSS del contenedor); heap del proceso ~38 MB (gauge `process_memory_usage`) | dentro del límite (12.6%) |
| Endpoints accesibles | `:3000/api/v1/...` | `:3000/api/v1/socios`, `/sports`, `/lockers` → **HTTP 200** (con datos) | ✅ |
| Frontend vía nginx | dev-server de Vite en `:5173` | `localhost/` (nginx en `:8080`→`:80`) → **HTTP 200**, sirve la SPA | ✅ |

> **Nota sobre el tiempo de startup:** el contenedor de la API reporta `healthy`
> recién a los ~32 s, pero eso es solo la **cadencia del healthcheck**
> (`interval: 30s` + primer probe), no el arranque real. La aplicación queda
> escuchando en **~1.2 s** (verificado en los logs: `Server listening at http://127.0.0.1:3000`).
> Las migraciones de Prisma (`migrate deploy`) se aplican al arrancar; en esta corrida
> no había migraciones pendientes (`No pending migrations to apply`).

**Comandos de verificación usados:**

```bash
# Build de imágenes de producción
docker build -f packages/api/Dockerfile.prod -t alentapp-api:prod .
docker build -f packages/web/Dockerfile.prod --build-arg VITE_API_URL=$VITE_API_URL -t alentapp-web:prod .

# Tamaños
docker images alentapp-api:prod alentapp-web:prod

# Que NO haya herramientas de build en la imagen final (solo debe estar node)
docker run --rm --entrypoint sh alentapp-api:prod -c 'which tsc npm npx node'
#  → tsc/npm/npx: NO-PRESENTE  ·  node: /usr/local/bin/node

# Endpoints y frontend
curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/api/v1/socios   # 200
curl -s -o /dev/null -w '%{http_code}' http://localhost/                      # 200
```

---

## 4.2. Verificación de seguridad

Cada medida de seguridad fue confirmada sobre el contenedor en ejecución
(`alentapp-api-prod`).

| Medida | Verificación | Resultado |
|---|---|---|
| La API corre con usuario **no-root** | `docker exec alentapp-api-prod id` | `uid=1000(node) gid=1000(node)` ✅ |
| **No** hay `npm`/`tsc`/`python` en la imagen final | `docker exec alentapp-api-prod sh -c 'command -v npm npx tsc python python3'` | todos **NO-PRESENTE** (solo `node`) ✅ |
| **Read-only filesystem** activo | `docker exec alentapp-api-prod touch /test` | `Read-only file system` → falla ✅ (y `/tmp` tmpfs es escribible) |
| **Capabilities mínimas** (`cap_drop: ALL`) | `docker exec alentapp-api-prod mount -t tmpfs none /mnt` | `permission denied` → bloqueado ✅ |
| Variables sensibles vía **`.env`** (no hardcodeadas) | `docker-compose.prod.yml` usa `${POSTGRES_*}`, `${DATABASE_URL}`, etc. | ✅ |
| **Healthchecks** funcionando | `docker compose -f docker-compose.prod.yml ps` | los **5** contenedores `healthy` ✅ |

**Hardening aplicado en el compose** (servicios `api` y `web`): `read_only: true`,
`cap_drop: ALL`, `cap_add: NET_BIND_SERVICE`, `security_opt: no-new-privileges:true`,
`tmpfs` acotado para directorios de escritura temporal, límites de CPU/memoria por
servicio y logging con rotación (`json-file`, `max-size: 10m`, `max-file: 3`).

---

## 4.3. Verificación de observabilidad

Tráfico de prueba generado: **3267 requests** (2858 con `200` y 409 con `404`),
incluyendo errores 4xx deliberados (`/api/v1/socios/99999` y rutas inexistentes).

| Check | Verificación | Resultado |
|---|---|---|
| OpenTelemetry exporta en `:9464/metrics` | `curl :9464/metrics` | **HTTP 200** ✅ |
| Métricas RED presentes | `http_requests_total`, `http_requests_errors_total`, `http_request_duration_{bucket,sum,count}`, `process_memory_usage` | ✅ |
| Prometheus scrapea el endpoint OTLP | job `opentelemetry` → `api:9464` | **UP** (7 series) ✅ |
| Grafana tiene datasource Prometheus | `GET /api/datasources` | `Prometheus` (default) ✅ |
| Dashboard RED con 6 paneles | dashboard `RED — Alentapp API` (`uid=alentapp-red`) provisionado | **6 paneles** ✅ |
| Los gráficos responden al tráfico | ver tabla de valores ↓ | ✅ |
| Las métricas de error reflejan los 4xx/5xx | `http_requests_errors_total` registró los 409 × `404` | ✅ (ver nota) |

**Valores leídos de Prometheus durante la prueba** (las mismas queries PromQL que
alimentan cada panel del dashboard):

| Panel | Query (resumen) | Valor obtenido |
|---|---|---|
| 1. Requests/s | `sum(rate(http_requests_total[1m]))` | ~2.7–13.5 req/s (según carga) |
| 2. Error % (5xx) | `sum(rate(...{status=~"5.."}[1m])) / sum(rate(...[1m])) * 100` | **0%** (no se generaron 5xx; ver nota) |
| 2b. Errores totales (4xx+5xx) | `sum(http_requests_errors_total)` | **409** |
| 3. Latencia p95 | `histogram_quantile(0.95, sum by(le)(rate(..._bucket[5m])))` | **9.96 ms** |
| 3. Latencia p99 | `histogram_quantile(0.99, ...)` | **23.21 ms** |
| 4. Por status code | `sum by(status)(http_requests_total)` | `200`: 2858 · `404`: 409 |
| 5. Memoria (MB) | `process_memory_usage / 1024 / 1024` | **37.7 MB** (heap) |
| 6. Top 5 endpoints lentos | `topk(5, rate(..._sum[5m]) / rate(..._count[5m]))` | `/lockers` 6.48 ms · `/socios` 5.17 ms · `/sports` 4.39 ms |

> **Nota sobre el Panel 2 (Error %):** por diseño calcula el porcentaje sobre
> respuestas **5xx** (`status=~"5.."`). En la prueba se generaron errores **4xx** (404),
> que **sí** quedan registrados en el counter `http_requests_errors_total` y en el
> Panel 4 (status code), pero **no** mueven el Panel 2. Para ver el Panel 2 distinto
> de 0% habría que provocar un error 5xx en la API.

### ✅ Resuelto: un único job de scraping (`opentelemetry`)

El ejemplo del enunciado traía **dos** jobs en `prometheus.yml`: uno hacia
`api:9464/metrics` (`opentelemetry`) y otro hacia `api:3000/metrics`
(`alentapp-api`). El segundo correspondía a un patrón distinto —exponer las métricas
Prometheus en el **mismo puerto** de la aplicación— que esta implementación **no**
usa: las métricas RED las sirve el `PrometheusExporter` de OTel en su propio servidor
HTTP en **:9464**, mientras que la app Fastify en `:3000` **no** define ninguna ruta
`/metrics` (responde `404`). Por eso el job `alentapp-api` quedaba permanentemente
*down* sin aportar ninguna serie.

**Acción aplicada en esta entrega:** se **eliminó** el job `alentapp-api` de
`observability/prometheus/prometheus.yml`, dejando únicamente `opentelemetry` →
`api:9464`. *Status → Targets* queda con un solo target, **UP**.

---

## 4.4. Documentación de decisiones

### Arquitectura final

```
                          ┌─────────────────────────────────────────────┐
                          │            red interna  alentapp-network      │
   navegador  ──:80──►  ┌─┴──────┐   ┌──────────┐   ┌──────────────┐      │
   (cliente)            │  web   │   │   api    │──►│  db (postgres │      │
                        │ nginx  │   │ Fastify  │   │  16-alpine)   │      │
                        │ :8080  │   │  :3000   │   └──────────────┘      │
                        └────────┘   │  :9464 ──┼──► /metrics (OTel)      │
                                     └────┬─────┘                          │
                                          │ scrape :9464                   │
                                     ┌────▼──────┐    ┌──────────┐         │
                                     │prometheus │◄───│ grafana  │         │
                                     │  :9090    │    │  :3001   │         │
                                     └───────────┘    └──────────┘         │
                          └────────────────────────────────────────────────┘

   El navegador llama a la API directamente en :3000 (VITE_API_URL horneada en build).
   Grafana lee de Prometheus, que scrapea el endpoint OTLP de la API en :9464.
```

- **web**: nginx unprivileged sirviendo la SPA estática (sin Node en producción).
- **api**: Fastify (JS precompilado), corre migraciones al arrancar, expone métricas
  RED en `:9464` vía OpenTelemetry.
- **db**: PostgreSQL 16, solo accesible por la red interna (no publica puerto al host).
- **prometheus** + **grafana**: stack de observabilidad provisionado por código.

### Decisiones técnicas

| Decisión | Por qué |
|---|---|
| **Multi-stage build** (API: `build`→`deps-prod`→`runtime`; Web: `deps`→`build`→`runtime`) | Saca el toolchain (`typescript`, `tsx`, `vite`, devDependencies) del artefacto final. Resuelve el problema #1 del análisis y logra la reducción de tamaño ≥70%. |
| **nginx** para el frontend (no Node en prod) | El dev-server de Vite no sirve para producción. nginx es liviano, rápido y pensado para servir estáticos; baja la imagen a 82.5 MB. |
| **nginx-unprivileged** en puerto 8080 | Corre como usuario no-root y en puerto no privilegiado, compatible con `cap_drop: ALL` y `read_only: true`. |
| **`read_only: true` + `tmpfs`** | Filesystem inmutable reduce la superficie de ataque; los pocos directorios de escritura (`/tmp`, cache de nginx) se montan como `tmpfs`. |
| **Usuario no-root** (`node`, `nginx`) | Ante un RCE el atacante no obtiene root del contenedor. Resuelve el problema #3 del análisis. |
| **Secrets vía `.env`** con `${VAR}` | Saca credenciales del repo (problema #2 del análisis), siguiendo *Config* de 12-Factor. |
| **OpenTelemetry + PrometheusExporter** | Estándar abierto que desacopla la instrumentación del backend; expone las métricas en formato Prometheus en `:9464`. |
| **Métricas RED vía hook global de Fastify** | En lugar de instrumentar controller por controller, un único `onResponse` captura `method`/`route`/`status` de **todas** las rutas. Menos código y sin riesgo de olvidar una ruta. |
| **Límites de recursos + healthchecks** por servicio | Evita que una fuga de memoria tire el host y permite a Docker saber si el servicio está listo. Resuelve el problema #5 del análisis. |

### Problemas encontrados

- **Poda de `node_modules` en la imagen de la API:** algunas dependencias hoisteadas
  por el monorepo (de `web` o tooling) eran seguras de borrar, pero otras
  (`valibot`, `remeda`, `effect`, `@prisma/dev`) las exige el **CLI de Prisma** al
  cargar `migrate deploy`. Quitarlas rompía el arranque con `MODULE_NOT_FOUND`. Se
  documentó en el Dockerfile qué se puede podar y qué no.
- **`read_only` vs. `npx`:** correr `prisma migrate deploy` con `npx` fallaba porque
  `npx` quiere escribir su cache en `/home/node/.npm`, incompatible con el filesystem
  de solo lectura. Se resolvió llamando al binario de Prisma **directo**
  (`node /app/node_modules/prisma/build/index.js`) sin `npx`.
- **Healthcheck con `localhost` (IPv6):** dentro del contenedor `localhost` resuelve a
  `::1` y los servicios escuchan en IPv4 → *connection refused*. Se usó `127.0.0.1`.
- **Target `alentapp-api` DOWN en Prometheus:** job redundante heredado del ejemplo
  del enunciado (apuntaba a `:3000/metrics`, que no existe). Resuelto eliminándolo;
  detalle en §4.3.

### Capturas de pantalla

Capturas del dashboard **RED — Alentapp API** funcionando con tráfico real
(provisionado en **http://localhost:3001** → *Dashboards → RED — Alentapp API*).

**Dashboard completo (6 paneles):**

![Dashboard RED — Alentapp API](img/red-dashboard.png)

**Paneles individuales:**

| Panel | Captura |
|---|---|
| 1. Requests/s (Rate) | ![Requests/s](img/requests.png) |
| 2. Error % / errores (Errors) | ![Errores](img/errors.png) |
| 3. Latencia p95/p99 (Duration) | ![Latencia p95/p99](img/panel-latencia.png) |
| 4. Por status code (200 vs 404) | ![Status code](img/panel-status-code.png) |
| 5. Memoria del proceso | ![Memoria](img/panel-memory.png) |

**Prometheus → Status → Targets** (único job `opentelemetry`, **UP**):

![Prometheus Targets](img/prometheus-targets.png)

---

## 4.5. Presentación (guion de 10 minutos)

1. **Antes y después (2 min)** — Tamaño de imágenes: API 1.67 GB → 473 MB (−71.7%),
   Web 1.02 GB → 82.5 MB (−91.9%). Tiempo de startup: de modo watch (decenas de
   segundos) a ~1.2 s. Mostrar `docker images` lado a lado.
2. **Seguridad (3 min)** — Demostrar en vivo: `docker exec ... id` (no-root),
   `touch /test` (read-only falla), `which tsc/npm` (no-presente), `mount` (capability
   denegada). Explicar cada medida y el problema del análisis que resuelve.
3. **Demo del dashboard RED (4 min)** — Generar tráfico real (script de la Fase 3),
   abrir Grafana y mostrar los 6 paneles reaccionando: Requests/s, Error %, Latencia
   p95/p99, status codes (forzar un 404 y verlo aparecer), memoria y top 5 lentos.
4. **Cierre (1 min)** — Arquitectura final y lecciones aprendidas.

### Lecciones aprendidas

- Lo más difícil fue **podar la imagen de la API** sin romper el CLI de Prisma: el
  análisis dependencia-por-dependencia llevó más tiempo que escribir el multi-stage.
- `read_only: true` obliga a repensar **todo** lo que escribe en disco (cache de npx,
  cache de nginx, `/tmp`): es donde más fallos de arranque aparecieron.
- Separar **build-time de runtime** (tanto en Docker como en la URL de la API horneada
  por Vite) es la clave para imágenes chicas y seguras.
- Qué cambiaríamos: agregar un caso que genere un 5xx real para ejercitar el Panel 2
  (Error %), que hoy solo se mueve con respuestas 5xx (en la prueba solo se generaron
  4xx). *(El job `alentapp-api` redundante de Prometheus ya fue eliminado, ver §4.3.)*

---

## Comandos de reproducción

```bash
# 1. Build
docker build -f packages/api/Dockerfile.prod -t alentapp-api:prod .
docker build -f packages/web/Dockerfile.prod --build-arg VITE_API_URL=$VITE_API_URL -t alentapp-web:prod .

# 2. Levantar el stack productivo
docker compose -f docker-compose.prod.yml up -d
docker compose -f docker-compose.prod.yml ps        # los 5 servicios healthy

# 3. Generar tráfico (incluye errores 4xx)
for i in $(seq 1 100); do
  curl -s -o /dev/null http://localhost:3000/api/v1/socios
  curl -s -o /dev/null http://localhost:3000/api/v1/sports
  curl -s -o /dev/null http://localhost:3000/api/v1/lockers
done
curl -s -o /dev/null http://localhost:3000/api/v1/socios/99999   # 404

# 4. Ver observabilidad
curl -s http://localhost:9464/metrics | grep -E 'http_requests_total|http_request_duration'
#   Grafana:    http://localhost:3001  (admin/admin) → dashboard "RED — Alentapp API"
#   Prometheus: http://localhost:9090  → Status → Targets

# 5. Bajar el stack
docker compose -f docker-compose.prod.yml down       # agregar -v para borrar volúmenes
```
