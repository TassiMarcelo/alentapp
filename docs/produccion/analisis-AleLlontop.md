
# Análisis de Infraestructura Docker y OpenTelemetry

## 1.1. Problemas identificados en la infraestructura Docker actual

| Problema | ¿Dónde ocurre? | Impacto | Solución propuesta |
|---|---|---|---|
| **Sin multi-stage build**:La imagen final contiene todas las devDependencies, el código fuente sin compilar, y herramientas de build que no se necesitan en producción.Generando imágenes innecesariamente pesadas | `packages/api/Dockerfile:1` y `packages/web/Dockerfile:1` | Alto | Usar  un stage builder que instala todo y compila, y un stage production que solo copia el output compilado y las dependencias de runtime |
| **Contenedores ejecutándose como root** : Ninguno de los dos Dockerfiles define una directiva USER,los procesos se ejecutan como root dentro del contenedor. Si hay una vulnerabilidad en la aplicación, el atacante obtiene privilegios de root.    | `packages/api/Dockerfile` y `packages/web/Dockerfile`  | Alto | Agregar USER node antes del CMD en ambos Dockerfiles |
| **Credenciales hardcodeadas**: Las contraseñas y usuarios de la base de datos están  directamente en el archivo docker-compose.yml | `docker-compose.yml:6-8` y `docker-compose.yml:30` | Alto | Crear un archivo .env (agregarlo a .gitignore) y referenciar las variables con ${VAR} |
| **Sin límites de recursos ni healthchecks en API y Web**: Los servicios api y web no definen límites de CPU ni memoria ni healthchecks | `docker-compose.yml`  (ausente en servicios `api` y `web`)  | Medio |Agregar blóques deploy.resources.limits (mem_limit, cpus)  y healthcheck a los servicios api y web |
| **prisma migrate dev en el comando de arranque**: Este comando está diseñado exclusivamente para desarrollo: puede resetear datos, crear migraciones interactivas y no es idémpotente. En producción puede causar pérdida de datos. | `docker-compose.yml:36` | Medio | Reemplazar migrate dev por migrate deploy para entornos de staging/producción. Separar la configuración con docker-compose.override.yml para desarrollo y docker-compose.prod.yml para producción.
 |

---

## 1.2. Investigación OpenTelemetry

### ¿Qué es OpenTelemetry y cómo se diferencia de Prometheus?

OpenTelemetry (OTel) es el recolector universal: No almacena datos. Su trabajo es unificar la forma en que la aplicación genera y envía trazas, métricas y logs hacia cualquier herramienta de análisis. 

Prometheus es una base de datos que busca (pull) y almacena únicamente métricas para luego hacer consultas y lanzar alertas. No maneja trazas ni logs.

### ¿Cuáles son los "3 pilares" de la observabilidad? ¿Cuál aborda OpenTelemetry?

- **Métricas** → Datos numéricos acumulados en el tiempo para medir la salud y rendimiento general del sistema
- **Trazas** → Mapa de ruta completo de una petición a través de todos tus servicios
- **Logs** → El historial en texto con fecha, hora y contexto detallado de un evento específico dentro de la aplicación

OpenTelemetry aborda los **3 pilares**, aunque su mayor adopción actual es en métricas y trazas.

### Métricas RED (Rate, Errors, Duration)

- **Rate** → Cantidad de requests por unidad de tiempo (req/s)  .  Indica la carga actual del servicio. Permite detectar picos de tráfico, planificar capacidad y configurar auto-scaling. 
- **Errors** → Porcentaje o número de requests que fallan . Se utiliza para detectar problemas críticos en tiempo real.
- **Duration** → Tiempo que tarda el servicio en responder cada request . Sirve para optimizar la experiencia de usuario y detectar problemas de lentitud o cuellos de botella antes de que el servicio colapse por completo.

### ¿Qué es el OTLP (OpenTelemetry Protocol)?

OTLP es el protocolo nativo de OpenTelemetry,  el idioma universal diseñado para empaquetar y transportar métricas, trazas y logs de manera eficiente.
La ventaja  de usarlo frente a Prometheus directo es que independiza el código. Si mañana se quiere dejar de usar Prometheus y pasar a Grafana Cloud o Datadog, solo se necesita  cambiar una línea de configuración en el Collector externo .

### ¿Cómo se relaciona OpenTelemetry con Grafana?

Grafana es una plataforma de visualización y observabilidad que no recopila datos por sí misma, sino que se conecta a datasources externos. OpenTelemetry actúa como la capa de recopilación y transporte que alimenta a Grafana.
OpenTelemetry y Grafana son complementarios: OTel estandariza cómo se recopilan y transportan los datos de observabilidad, mientras Grafana provee la capa de visualización, alertas y correlación entre métricas, trazas y logs en una única interfaz.


