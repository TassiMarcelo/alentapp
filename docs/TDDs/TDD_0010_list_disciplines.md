---
id: 0010
estado: Pendiente
autor: Mateo Lafalce
fecha: 2026-05-01
titulo: Listado y Consulta de Sanciones Disciplinarias
---

# TDD-0010: Listado y Consulta de Sanciones Disciplinarias

## Contexto de Negocio (PRD)

### Objetivo

Permitir a los administrativos visualizar el historial de sanciones del club y, mediante filtros, responder dos preguntas críticas con un único endpoint: "¿qué sanciones existen?" (vista de gestión) y "¿este socio está actualmente suspendido?" (regla que otros módulos como inscripción a deportes o alquiler de lockers consultan antes de operar). Unificar ambos casos en un mismo recurso evita duplicar lógica de filtrado por rango de fechas y mantiene un único contrato de respuesta.

### User Persona

- **Nombre**: Alberto (Tesorero/Administrativo) y otros casos de uso del sistema (`EnrollmentUseCase`, `AssignLockerUseCase`).
- **Necesidad**: Por un lado, una vista para revisar sanciones cargadas con filtros por socio y por estado de vigencia. Por otro, un mecanismo programático para que otros casos de uso pregunten "¿el socio X está suspendido ahora?" y bloqueen operaciones cuando corresponda.

### Criterios de Aceptación

- El sistema debe devolver todas las sanciones con sus campos completos cuando no se aplican filtros.
- El sistema debe permitir filtrar por `member_id` para obtener el historial de un socio.
- El sistema debe permitir filtrar por estado de vigencia mediante `status`:
  - `active`: sanciones donde `start_date <= now() <= end_date`.
  - `expired`: sanciones donde `end_date < now()`.
  - `upcoming`: sanciones donde `start_date > now()`.
- Los filtros son combinables: `?member_id=X&status=active` responde la pregunta "¿está suspendido ahora?" — si el array viene vacío, no lo está.
- La comparación con `now()` debe ejecutarse en la base de datos (no en memoria del backend) para evitar drift de reloj entre instancias.
- El listado **siempre** excluye sanciones borradas lógicamente (registros con `deleted_at != null`). Este filtro es implícito y no configurable desde el endpoint público; las sanciones borradas no deben aparecer en ninguna vista de gestión ni en la consulta de suspensión activa.
- El listado se ordena por `start_date`. La dirección es configurable mediante el query param booleano `sort_desc`: `true` (default) devuelve las más recientes primero; `false` ordena ascendente (las más antiguas primero, útil para reconstruir cronología en auditoría).
- Si no hay coincidencias, retornar `200 OK` con `[]`, no `404`.

## Diseño Técnico (RFC)

### Contrato de API (@alentapp/shared)

- **Endpoint**: `GET /api/v1/disciplines`
- **Query Params** (todos opcionales):

```ts
{
  member_id?: string;
  status?: 'active' | 'expired' | 'upcoming';
  sort_desc?: boolean; // default true
}
```

- **Response**: `200 OK` con un array de `DisciplineDTO`.

```ts
DisciplineDTO[]
```

### Componentes de Arquitectura Hexagonal

- **Domain**: ampliar `DisciplineRepository` (interfaz definida en [TDD-0007](TDD_0007_create_discipline.md)) con `findAll(filters: { member_id?: string; status?: 'active' | 'expired' | 'upcoming'; sort_desc?: boolean; at?: Date }): Promise<Discipline[]>`. El parámetro `at` se inyecta para que el filtro temporal sea testeable sin mockear el reloj global. `sort_desc` controla la dirección del ordenamiento por `start_date` (default `true`).
- **Application**: `ListDisciplinesUseCase` recibe los filtros, inyecta `new Date()` como `at` cuando hay filtro por `status`, aplica `sort_desc = true` cuando el query param viene ausente, y delega al repositorio.
- **Infrastructure**: `PostgresDisciplineRepository.findAll` traduce los filtros a un `where` de Prisma y `sort_desc` a `orderBy: { start_date: sort_desc ? 'desc' : 'asc' }`. **Siempre** incluye `deleted_at: null` en el `where` para excluir sanciones borradas lógicamente (semántica de borrado lógico establecida en [TDD-0009](TDD_0009_delete_discipline.md)). Para `status=active` usa `{ start_date: { lte: at }, end_date: { gte: at } }`; para `expired` usa `{ end_date: { lt: at } }`; para `upcoming` usa `{ start_date: { gt: at } }`. `DisciplineController` valida los query params con `zod` (incluyendo el coerce booleano de `sort_desc`) antes de invocar al caso de uso.

## Casos de Borde y Errores

| Escenario                                          | Resultado Esperado                                                          | Código HTTP               |
| -------------------------------------------------- | --------------------------------------------------------------------------- | ------------------------- |
| Sin filtros                                        | Devuelve todas las sanciones ordenadas por `start_date` desc (default)      | 200 OK                    |
| `?sort_desc=false`                                 | Devuelve todas las sanciones ordenadas por `start_date` asc                 | 200 OK                    |
| `sort_desc` con valor no booleano                  | "Filtro `sort_desc` debe ser booleano"                                      | 400 Bad Request           |
| `member_id` válido sin sanciones                   | `[]`                                                                        | 200 OK                    |
| `?member_id=X&status=active` con sanción vigente   | Array con la sanción vigente                                                | 200 OK                    |
| `?member_id=X&status=active` sin sanción vigente   | `[]` (interpretación: el socio NO está suspendido)                          | 200 OK                    |
| Sanción ya vencida con `status=active`             | No se incluye (sí aparece con `status=expired`)                             | 200 OK                    |
| Sanción aún no iniciada con `status=active`        | No se incluye (sí aparece con `status=upcoming`)                            | 200 OK                    |
| `status` con valor desconocido                     | "Filtro `status` inválido"                                                  | 400 Bad Request           |
| `member_id` con UUID malformado                    | "Formato de `member_id` inválido"                                           | 400 Bad Request           |
| Error de conexión a DB                             | "Error interno, reintente más tarde"                                        | 500 Internal Server Error |

## Plan de Implementación

1. Ampliar la interfaz `DisciplineRepository` con `findAll(filters)` en la capa `domain`.
2. Implementar el método en `PostgresDisciplineRepository` traduciendo `status` a rangos de fechas.
3. Implementar `ListDisciplinesUseCase` en la capa `application`.
4. Validar query params con `zod` en `DisciplineController` y registrar la ruta `GET /api/v1/disciplines` en `app.ts`.
5. Añadir `list(filters)` al servicio frontend `disciplines.ts`.
6. Construir la vista `DisciplinesView.tsx` con tabla y filtros (socio, estado de vigencia).
7. En la vista de detalle de socio, llamar a `list({ member_id, status: 'active' })` para mostrar un badge "Suspendido" cuando el array no esté vacío.
8. En módulos consumidores (`EnrollmentUseCase`, `AssignLockerUseCase`), invocar el mismo caso de uso: si hay sanción activa con `is_total_suspension === true`, abortar con `403 Forbidden` y mensaje claro citando la sanción.

## Observaciones Adicionales

- Este TDD cubre el "foco" que indica el PDF de Actividad 1 para Discipline (filtros con `now()` entre `start_date` y `end_date`).
- Validar con `zod` los query params permite mensajes de error consistentes y rechazar valores fuera del enum sin escribir el `if/else` a mano.
- Conviene cubrir con tests unitarios los tres bordes temporales: sanción vigente, vencida hace 1 segundo y que inicia en 1 segundo, para garantizar que las comparaciones son inclusivas/exclusivas como se documentan.
- Si en el futuro un socio puede tener múltiples sanciones simultáneas, el contrato no cambia (sigue siendo un array); sólo se ajustarán los consumidores para decidir cuál priorizar (ej. la de mayor `end_date`).
