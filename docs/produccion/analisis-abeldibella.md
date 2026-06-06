# TP Integrador - Actividad 4
## Fase 1 - Analizar y Proponer

---

# 1.1 Análisis de la infraestructura Docker actual

## Problemas identificados

| Problema | ¿Dónde ocurre? | Impacto | Solución propuesta |
|-----------|------------------|---------|--------------------|
| Credenciales hardcodeadas | `docker-compose.yml` | Alto | Utilizar variables de entorno desde archivo `.env` |
| Ejecución como usuario root | `packages/api/Dockerfile` y `packages/web/Dockerfile` | Alto | Crear y utilizar usuario no-root |
| Uso de volúmenes bind mount en producción | `docker-compose.yml` | Medio | Copiar artefactos dentro de la imagen y eliminar montajes de código fuente |
| Sin límites de CPU y memoria | `docker-compose.yml` | Medio | Definir límites de recursos para cada servicio |
| Dockerfiles sin multi-stage build | `packages/api/Dockerfile` y `packages/web/Dockerfile` | Alto | Implementar multi-stage builds para reducir tamaño y superficie de ataque |

---

## Problema 1: Credenciales hardcodeadas

### ¿Dónde ocurre?

**docker-compose.yml**

```yaml
POSTGRES_USER: admin
POSTGRES_PASSWORD: password123
DATABASE_URL=postgres://admin:password123@db:5432/alentapp_db
```

### Impacto

Las credenciales quedan expuestas en el repositorio y cualquier persona con acceso al código puede conocerlas.

### Solución propuesta

Mover todas las credenciales a un archivo `.env` y excluirlo del repositorio con `gitignore`.

---

## Problema 2: Ejecución como root

### ¿Dónde ocurre?

**packages/api/Dockerfile**

**packages/web/Dockerfile**

### Impacto

Ninguno de los dos archivos Dockerfiles mencionados anteriormente, define a un usuario sin privilegios. Entonces, el proceso se ejecuta como root. Si la aplicación es comprometida, el atacante obtiene privilegios elevados dentro del contenedor.

### Solución propuesta

Crear un usuario específico de la aplicación y ejecutar el proceso con dicho usuario.

---

## Problema 3: Uso de bind mounts

### ¿Dónde ocurre?

**docker-compose.yml**

```yaml
volumes:
  - .:/app
```

### Impacto

El contenedor depende directamente de archivos del host. Esto es útil para desarrollo pero no para producción.

### Solución propuesta

Generar imágenes autocontenidas y eliminar los montajes de código fuente.

---

## Problema 4: Sin límites de recursos

### ¿Dónde ocurre?

**docker-compose.yml**

### Impacto

Un error o fuga de memoria puede consumir todos los recursos del servidor y, de esta forma tirar al resto de los servicios.

### Solución propuesta

Definir límites de CPU y memoria para API, Web y Base de Datos.

---

## Problema 5: Dockerfiles sin multi-stage build

### ¿Dónde ocurre?

**packages/api/Dockerfile**

**packages/web/Dockerfile**

### Impacto

Las imágenes contienen herramientas de desarrollo, dependencias innecesarias y aumentan significativamente su tamaño.

### Solución propuesta

Implementar multi-stage builds separando dependencias, build y runtime.

---

# 1.2 Investigación sobre OpenTelemetry

## ¿Qué es OpenTelemetry y cómo se diferencia de Prometheus?

OpenTelemetry es un estándar para generar, obtener y exportar información de observabilidad (métricas, logs y trazas).

Prometheus es una plataforma de monitoreo cuyas funciones principales son: recopilar, almacenar y consultar métricas.

OpenTelemetry se diferencia de Prometheus, dado que produce los datos mientras que Prometheus los almacena y analiza.

---

## ¿Cuáles son los tres pilares de la observabilidad?

Los tres pilares son:

1. **Métricas** (datos numéricos que permiten medir el rendimiento y estado de una aplicación, por ejemplo uso de CPU, memoria o cantidad de solicitudes por segundo).

2. **Logs** (registros de eventos generados por la aplicación que ayudan a entender qué ocurrió en un momento determinado y facilitar el diagnóstico de errores).

3. **Trazas** (seguimiento completo del recorrido de una solicitud a través de los distintos componentes o servicios del sistema, permitiendo identificar cuellos de botella y problemas de rendimiento).

OpenTelemetry permite recolectar información relacionada con los tres pilares.


## ¿Qué son las métricas RED?

RED significa:

### Rate

Cantidad de solicitudes recibidas por segundo. Permite medir el tráfico de la aplicación.

### Errors

Cantidad o porcentaje de solicitudes que terminan con error. Permite detectar problemas de funcionamiento.

### Duration

Tiempo que tarda una solicitud en completarse. Permite medir el rendimiento percibido por los usuarios.

---

## ¿Qué es OTLP?

OTLP (OpenTelemetry Protocol) es el protocolo de red estándar de OpenTelemetry, utilizado para transportar métricas, logs y trazas generadas por OpenTelemetry.

### Ventajas

- Formato unificado.
- Compatible con múltiples herramientas.
- Permite transportar distintos tipos de telemetría mediante un mismo protocolo.

---

## ¿Cómo se relaciona OpenTelemetry con Grafana?

OpenTelemetry genera las métricas, Prometheus las recopila y almacena, y Grafana consulta Prometheus y muestra la información mediante dashboards.

El flujo completo es:

```text
Aplicación → OpenTelemetry → Prometheus → Grafana
```

De esta forma es posible monitorear el estado y rendimiento del sistema en tiempo real.
````
---