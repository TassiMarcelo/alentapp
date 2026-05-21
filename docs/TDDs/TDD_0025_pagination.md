---
id: 0025
estado: Propuesto
autor: Mateo Lafalce
fecha: 2026-05-20
titulo: Paginación de Listados (Members, Lockers, Sports, Disciplines, Medical Certificates, Payments)
---

# TDD-0025: Paginación de Listados

## Contexto de Negocio (PRD)

### Objetivo

Las vistas de listado actuales (`Members`, `Lockers`, `Sports`, `Disciplines`, `MedicalCertificates`, `payments`) devuelven el universo completo de registros en una sola respuesta. A medida que el club crece, esto degrada el tiempo de carga, satura el render del frontend y dificulta la lectura para los administrativos. Este TDD define un **patrón único de paginación** aplicable a las seis entidades, evitando duplicar lógica y manteniendo un contrato consistente.

La decisión es paginar a **20 ítems por bloque** por default, con navegación adelante/atrás y salto a página específica. Se elige paginación por **offset/limit** (no cursor) porque los listados son administrativos, no de alta concurrencia ni feed-style, y porque permite mostrar el total y "ir a página N" — algo que los usuarios del staff esperan en una herramienta interna.

### User Persona

- **Nombre**: Alberto (Tesorero/Administrativo), Marisol (Secretaría), Hugo (Gerente).
- **Necesidad**: Revisar listados de socios, lockers, deportes, sanciones, certificados y pagos sin esperar varios segundos a que cargue todo, y poder navegar entre páginas para auditar o buscar registros específicos.

### Criterios de Aceptación

- Todos los endpoints de listado (`GET /members`, `GET /lockers`, `GET /sports`, `GET /disciplines`, `GET /medical-certificates`, `GET /payments`) aceptan los query params `page` y `page_size`.
- `page_size` por default es **20**. Valor mínimo `1`, máximo `100` (techo defensivo para evitar abuso, no es un control de UI).
- `page` por default es **1**, base 1 (el usuario piensa en "página 1", no en "offset 0").
- La respuesta tiene forma `{ data: T[], pagination: { page, page_size, total, total_pages } }` para todas las entidades.
- Si `page` excede `total_pages`, la respuesta es `200 OK` con `data: []` y la metadata correcta (no `404`). Esto evita un error cuando se borra un registro y el frontend queda apuntando a una página vacía.
- El **orden** debe ser estable entre páginas (si dos requests piden `page=1` y `page=2` con los mismos filtros, no debe haber solapamientos ni huecos). Se logra agregando un `ORDER BY` determinista en cada repositorio (idealmente `created_at DESC, id ASC` como tiebreaker).
- La paginación es **combinable con los filtros existentes** de cada entidad (ej. `status` en sanciones, `member_id` en pagos, `estado` en lockers). El `total` refleja el universo **post-filtro**.
- El frontend muestra controles de paginación (anterior, siguiente, número de página actual, total de páginas) debajo de cada tabla.
- Los borrados lógicos (`deleted_at != null`) se siguen excluyendo del `count` y del `data`, manteniendo la semántica de cada listado.

## Diseño Técnico (RFC)

### Contrato compartido (@alentapp/shared)

Se agrega un tipo genérico reutilizado por todas las entidades:

```ts
export interface PaginationParams {
  page?: number;       // base 1, default 1
  page_size?: number;  // default 20, min 1, max 100
}

export interface PaginationMeta {
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

export interface Paginated<T> {
  data: T[];
  pagination: PaginationMeta;
}
```

Los tipos de filtros existentes (ej. `GetLockersFilters`) extienden `PaginationParams`:

```ts
export interface GetLockersFilters extends PaginationParams {
  estado?: LockerEstado;
  // ...
}
```

### Contrato de API

| Endpoint                          | Query params nuevos        | Response                                |
| --------------------------------- | -------------------------- | --------------------------------------- |
| `GET /api/v1/members`             | `page`, `page_size`        | `Paginated<MemberDTO>`                  |
| `GET /api/v1/lockers`             | `page`, `page_size` (+ filtros existentes) | `Paginated<LockerDTO>`  |
| `GET /api/v1/sports`              | `page`, `page_size`        | `Paginated<SportDTO>`                   |
| `GET /api/v1/disciplines`         | `page`, `page_size` (+ filtros TDD-0010)   | `Paginated<DisciplineDTO>` |
| `GET /api/v1/medical-certificates`| `page`, `page_size`        | `Paginated<MedicalCertificateDTO>`      |
| `GET /api/v1/payments`            | `page`, `page_size`        | `Paginated<PaymentDTO>`                 |

**Breaking change**: la forma de respuesta cambia de `T[]` a `Paginated<T>`. Todos los servicios frontend deben actualizarse en el mismo PR para evitar romper las vistas.

### Componentes de Arquitectura Hexagonal

- **Domain**: cada `XxxRepository` modifica su `findAll(filters)` para devolver `{ data: XxxDTO[]; total: number }`. El cálculo de `total_pages` y la normalización (`page`, `page_size`) **no viven en el dominio**, viven en application (es lógica de presentación de la paginación, no regla de negocio).
- **Application**: cada `GetXxxUseCase` (o equivalente) recibe los filtros + paginación, llama al repositorio una sola vez y arma `Paginated<XxxDTO>`. Centralizar el cómputo de `total_pages = Math.ceil(total / page_size)` y los defaults evita inconsistencias entre entidades. Se sugiere un helper `paginate({ page, page_size, total, data })` en `application/shared/` para no repetir el armado.
- **Infrastructure**: cada `PostgresXxxRepository.findAll` ejecuta dos queries dentro de una **misma transacción de lectura** (o usa `prisma.$transaction([findMany, count])`): una para `data` con `skip`, `take` y `orderBy` determinista, y otra para `count` con los mismos `where`. Esto garantiza consistencia entre el `total` y los registros devueltos. El `XxxController` valida `page` y `page_size` con `zod` (`z.coerce.number().int().positive()`, con `.max(100)` para `page_size`), aplica defaults y los pasa al use case.

### Frontend

- Se agrega un componente reutilizable `PaginationControls` en `packages/web/src/components/ui/` que recibe `pagination: PaginationMeta` y un callback `onPageChange(page)`. No conoce la entidad; sólo dispara eventos.
- Cada `services/<entity>.ts` actualiza su función `list(...)` para aceptar `{ page, page_size, ...filters }` y devolver `Paginated<XxxDTO>`.
- Cada vista (`Members.tsx`, `Lockers.tsx`, etc.) guarda `page` en estado local (React `useState`), refetchea al cambiar página o filtros (resetea a `page=1` cuando cambia un filtro), y renderiza `<PaginationControls>` debajo de la tabla.

## Casos de Borde y Errores

| Escenario                                            | Resultado Esperado                                                         | Código HTTP               |
| ---------------------------------------------------- | -------------------------------------------------------------------------- | ------------------------- |
| Sin `page` ni `page_size`                            | Aplica defaults `page=1`, `page_size=20`                                   | 200 OK                    |
| `page=0` o `page=-1`                                 | "El parámetro `page` debe ser un entero positivo"                          | 400 Bad Request           |
| `page_size=0` o negativo                             | "El parámetro `page_size` debe ser un entero positivo"                     | 400 Bad Request           |
| `page_size=500`                                      | "El parámetro `page_size` no puede superar 100"                            | 400 Bad Request           |
| `page=999` cuando `total_pages=3`                    | `{ data: [], pagination: { page: 999, page_size: 20, total: 40, total_pages: 3 } }` | 200 OK            |
| `page` o `page_size` no numéricos (`page=abc`)       | "Parámetro de paginación inválido"                                         | 400 Bad Request           |
| Tabla vacía (sin registros)                          | `{ data: [], pagination: { page: 1, page_size: 20, total: 0, total_pages: 0 } }` | 200 OK              |
| Paginación combinada con filtro que no matchea nada  | `{ data: [], pagination: { ..., total: 0, total_pages: 0 } }`              | 200 OK                    |
| Borrado de un registro entre request de `page=1` y `page=2` | Posible "salto" de un ítem entre páginas (aceptado; trade-off del offset-based) | 200 OK            |
| Error de DB en `count()` o `findMany()`              | "Error interno, reintente más tarde"                                       | 500 Internal Server Error |

## Plan de Implementación

1. **Shared**: definir `PaginationParams`, `PaginationMeta`, `Paginated<T>` en `packages/shared/src/index.ts`. Extender los tipos de filtros existentes (`GetLockersFilters`, etc.).
2. **Application helper**: crear `packages/api/src/application/shared/paginate.ts` con `applyPagination(params)` (normaliza defaults, calcula `skip = (page - 1) * page_size`) y `buildPaginated({ page, page_size, total, data })`.
3. **Domain**: actualizar las 6 interfaces de repositorio: `findAll(filters): Promise<{ data: XxxDTO[]; total: number }>`.
4. **Infrastructure**: actualizar los 6 `PostgresXxxRepository.findAll` para usar `prisma.$transaction([findMany({...where, skip, take, orderBy}), count({where})])`. Definir `orderBy` determinista por entidad (sugerido: `created_at desc, id asc`; en Disciplines respetar `sort_desc` del TDD-0010).
5. **Application**: actualizar los 6 use cases (`GetMembersUseCase`, `GetLockersUseCase`, `GetSportsUseCase`, `ListDisciplinesUseCase`, listado de medical certificates, `GetPaymentsUseCase`) para recibir paginación, llamar al repo y devolver `Paginated<XxxDTO>`.
6. **Infrastructure (HTTP)**: actualizar los 6 controllers para parsear `page`/`page_size` con `zod` (`z.coerce.number().int().min(1)` y `.max(100)` para `page_size`).
7. **Shared frontend**: crear `packages/web/src/components/ui/PaginationControls.tsx` (props: `pagination: PaginationMeta`, `onPageChange: (page: number) => void`).
8. **Services frontend**: actualizar los 6 `services/*.ts` (`list(...)` devuelve `Paginated<XxxDTO>`).
9. **Vistas**: integrar `PaginationControls` en `Members.tsx`, `Lockers.tsx`, `Sports.tsx`, `Disciplines.tsx`, `MedicalCertificates.tsx`, `payments.tsx`. Manejar reset a `page=1` cuando cambien los filtros locales.
10. **Tests**:
    - **Unit (application)**: `applyPagination` y `buildPaginated` con casos límite (`page=0`, `total=0`, página fuera de rango).
    - **Unit (use case)**: que el use case pase los params normalizados al repo y arme la metadata correctamente.
    - **Integration (repositorio)**: que `findMany` y `count` se ejecuten dentro de la misma transacción y respeten el `where` filtrado.
    - **E2E (Playwright)**: en al menos una vista (`Members`) validar navegación entre páginas y que `page_size=20` corte el listado correctamente.

## Consideraciones por entidad

La mayoría de las entidades aplican el patrón tal cual. Notas específicas:

- **Disciplines**: el `orderBy` ya está parametrizado por `sort_desc` (TDD-0010). Mantener ese contrato; agregar `id ASC` como tiebreaker.
- **Payments**: el listado suele filtrarse por socio o periodo en el futuro (TDD-0014/0017). El contrato `Paginated<PaymentDTO>` ya queda preparado; los filtros adicionales se agregan sin cambiar la forma de respuesta.
- **Medical Certificates**: `findByMemberId` (no paginado) se mantiene como está — es una consulta dirigida, no un listado de gestión. Sólo `findAll` se pagina.
- **Lockers**: ya tiene `GetLockersFilters`; sólo se extiende con `PaginationParams`.
- **Members / Sports**: no tienen filtros hoy. Se introduce `GetMembersFilters` y `GetSportsFilters` mínimos (`extends PaginationParams`) para mantener la firma uniforme.

## Observaciones Adicionales

- Se descarta paginación por **cursor** porque las vistas son administrativas con bajo volumen concurrente y los usuarios esperan "ir a página N" y ver el total. Si en el futuro alguna entidad supera ~100k registros o se usa en un feed público, se puede introducir cursor en paralelo sin romper este contrato.
- El techo `page_size <= 100` es defensivo. La UI nunca lo expone; sólo bloquea clientes que intenten descargar todo en un request.
- El "salto" de un ítem entre páginas tras un borrado es inherente al offset-based y se considera aceptable para el caso de uso administrativo. Si molesta en auditoría, se documenta en la vista correspondiente, no se cambia el patrón.
- Convendría medir tiempos de respuesta antes/después en `payments` y `members` (las tablas con más registros esperados) para validar la mejora.
