---
id: 0007
estado: Pendiente
autor: Mateo Lafalce
fecha: 2026-05-01
titulo: Registro de Nuevas Sanciones Disciplinarias
---

# TDD-0007: Registro de Nuevas Sanciones Disciplinarias

## Contexto de Negocio (PRD)

### Objetivo

Permitir a los administrativos registrar sanciones disciplinarias sobre socios, indicando el motivo, el período de vigencia y si se trata de una suspensión total, garantizando que las fechas ingresadas sean coherentes antes de persistir el registro.

### User Persona

- **Nombre**: Alberto (Tesorero/Administrativo).
- **Necesidad**: Registrar una sanción de forma rápida cuando un socio incurre en una falta. Necesita que el sistema le impida cargar fechas inconsistentes (por ejemplo, una fecha de fin anterior a la de inicio) para evitar registros inválidos.

### Criterios de Aceptación

- El sistema debe validar que `end_date` sea estrictamente posterior a `start_date`.
- El sistema debe validar que el socio referenciado por `member_id` exista en la base de datos.
- Al finalizar exitosamente, el sistema debe retornar la sanción creada con su `id` generado.
- El campo `is_total_suspension` debe aceptar únicamente valores booleanos y ser requerido.

## Diseño Técnico (RFC)

### Modelo de Dominio (Entidad)

Interfaz TypeScript pura que representa la entidad en la capa de **Domain**. No contiene tipos de Prisma ni decoradores de persistencia; los casos de uso y servicios del dominio operan sobre este contrato. Los TDD-0008, 0009 y 0010 reutilizan esta misma definición.

```ts
export interface Discipline {
  id: string;
  reason: string;
  start_date: Date;
  end_date: Date;
  is_total_suspension: boolean;
  member_id: string;
  deleted_at: Date | null;
}
```

Notas:
- `start_date` y `end_date` se modelan como `Date` nativo (no `string`); el parseo desde ISO ocurre en la capa de infraestructura/controlador antes de cruzar al dominio.
- `deleted_at` es `Date | null` y representa el borrado lógico (ver TDD-0009). Siempre `null` para sanciones vigentes.
- El DTO `DisciplineDTO` (sección siguiente) es la representación serializable de esta entidad y usa `string` ISO para las fechas.

### Modelo de Datos

Se define la entidad `Discipline` como nueva tabla en Prisma:

- `id`: UUID, clave primaria autogenerada.
- `reason`: `String`, descripción de la falta cometida.
- `start_date`: `DateTime`, fecha de inicio de la sanción.
- `end_date`: `DateTime`, fecha de fin de la sanción. Debe ser posterior a `start_date`.
- `is_total_suspension`: `Boolean`, indica si el socio queda completamente suspendido.
- `member_id`: `String`, FK hacia `Member`.
- `deleted_at`: `DateTime?`, nullable. Marca de borrado lógico: si está en `null`, la sanción está vigente; si tiene timestamp, fue eliminada (ver TDD-0009). Las queries de listado y consulta filtran por `deleted_at: null` por defecto.

```prisma
model Discipline {
  id                  String    @id @default(uuid())
  reason              String
  start_date          DateTime
  end_date            DateTime
  is_total_suspension Boolean   @default(false)
  member_id           String
  member              Member    @relation(fields: [member_id], references: [id])
  deleted_at          DateTime?

  @@map("disciplines")
}
```

### Contrato de API (@alentapp/shared)

- **Endpoint**: `POST /api/v1/disciplines`
- **Request Body** (`CreateDisciplineRequest`):

```ts
{
  reason: string;
  start_date: string; // ISO DateTime (YYYY-MM-DDTHH:mm:ssZ)
  end_date: string;
  is_total_suspension: boolean;
  member_id: string;
}
```

- **Response** (`DisciplineDTO`), `201 Created`:

```ts
{
  id: string;
  reason: string;
  start_date: string;
  end_date: string;
  is_total_suspension: boolean;
  member_id: string;
}
```

### Componentes de Arquitectura Hexagonal

- **Domain**: Interfaz `DisciplineRepository` (puerto de salida) con método `create`. Servicio `DisciplineValidator` con método `validateDates(start: Date, end: Date)` que lanza excepción si `end <= start`.
- **Application**: `CreateDisciplineUseCase` — invoca `DisciplineValidator.validateDates`, verifica existencia del socio vía `MemberRepository.findById`, y delega la persistencia a `DisciplineRepository.create`.
- **Infrastructure**: `PostgresDisciplineRepository` implementa `DisciplineRepository` usando Prisma. `DisciplineController` expone el endpoint y mapea excepciones a códigos HTTP.

## Casos de Borde y Errores

| Escenario                        | Resultado Esperado                                              | Código HTTP               |
| -------------------------------- | --------------------------------------------------------------- | ------------------------- |
| `end_date <= start_date`         | "La fecha de fin debe ser posterior a la de inicio"             | 400 Bad Request           |
| `end_date === start_date`        | "La fecha de fin debe ser posterior a la de inicio"             | 400 Bad Request           |
| `member_id` inexistente          | "El socio indicado no existe"                                   | 404 Not Found             |
| `reason` vacío o ausente         | Error de validación de campos requeridos                        | 400 Bad Request           |
| Error de conexión a DB           | "Error interno, reintente más tarde"                            | 500 Internal Server Error |

## Plan de Implementación

1. Agregar el modelo `Discipline` en `prisma/schema.prisma` y ejecutar la migración (`prisma migrate dev --name add-discipline`).
2. Definir `CreateDisciplineRequest` y `DisciplineDTO` en `packages/shared/index.ts`.
3. Crear la interfaz `DisciplineRepository` y el servicio `DisciplineValidator` en la capa `domain`.
4. Implementar `CreateDisciplineUseCase` en la capa `application`.
5. Implementar `PostgresDisciplineRepository` en la capa `infrastructure`.
6. Crear `DisciplineController` con el método `create` y registrar la ruta en `app.ts`.
7. Añadir el servicio HTTP `disciplines.ts` en el frontend y conectarlo al formulario de alta.

## Observaciones Adicionales

- **`is_total_suspension` en lugar de `severidad`**: el PDF de Actividad 1 menciona `severidad` como atributo orientativo, pero el DER del TP Integrador define `is_total_suspension` (booleano) como contrato vinculante. Se adopta el booleano por alinearse con el DER y porque el negocio actual sólo distingue dos casos (suspensión total vs. parcial); si más adelante se requieren niveles graduales, se podrá migrar a un enum de severidad sin romper el endpoint.
- **Sanciones retroactivas permitidas**: `start_date` puede ser anterior a `now()`. El sistema no valida que la fecha de inicio esté en el futuro porque el negocio necesita registrar sanciones que ya ocurrieron (por ejemplo, cuando el Tribunal de Disciplina resuelve una falta días después del incidente y la vigencia debe contar desde la fecha del hecho). La única restricción temporal es `end_date > start_date`.
- Validación de fechas con `date-fns` para evitar comparaciones directas de `Date` y manejar correctamente zonas horarias al parsear ISO.
