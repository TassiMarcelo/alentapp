---
id: 0008
estado: Aprobado
autor: Mateo Lafalce
fecha: 2026-05-01
titulo: Actualización de Sanciones Disciplinarias
---

# TDD-0008: Actualización de Sanciones Disciplinarias

## Contexto de Negocio (PRD)

### Objetivo

Permitir a los administrativos modificar los datos de una sanción disciplinaria existente, como el motivo, las fechas de vigencia o el tipo de suspensión, garantizando que la consistencia de fechas se valide contra los valores finales resultantes tras la edición parcial.

### User Persona

- **Nombre**: Alberto (Tesorero/Administrativo).
- **Necesidad**: Corregir una sanción cargada con fechas erróneas o actualizar su descripción sin necesidad de eliminarla y volver a crearla.

### Criterios de Aceptación

- El sistema debe permitir actualizar uno o más campos de la sanción de forma parcial.
- Si la petición no incluye ningún campo a actualizar, el sistema debe rechazarla con `400 Bad Request`, ya que no hay nada que modificar.
- Si se modifica `start_date` o `end_date` (o ambos), el sistema debe re-validar que el `end_date` resultante sea estrictamente posterior al `start_date` resultante, tomando los valores ya persistidos para los campos no enviados.
- El campo `member_id` no puede modificarse una vez creada la sanción. Si el cliente lo incluye en la petición, el sistema debe rechazar la operación con `400 Bad Request` en lugar de ignorarlo silenciosamente, para evitar que bugs del cliente queden enmascarados.
- Si la actualización es exitosa, el sistema debe retornar la sanción con todos sus datos actualizados.
- El sistema debe validar que la sanción exista antes de intentar modificarla.

## Diseño Técnico (RFC)

### Contrato de API (@alentapp/shared)

Todos los campos son opcionales. `member_id` es excluido explícitamente para impedir su reasignación.

- **Endpoint**: `PATCH /api/v1/disciplines/:id` (se elige `PATCH` en lugar de `PUT` porque la operación es una actualización parcial: el cliente envía únicamente los campos que quiere modificar, no la representación completa del recurso).
- **Request Body** (`UpdateDisciplineRequest`):

```ts
{
  reason?: string;
  start_date?: string; // ISO DateTime
  end_date?: string;
  is_total_suspension?: boolean;
}
```

- **Response** (`DisciplineDTO`), `200 OK`:

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

- **Domain**: `DisciplineRepository` (método `update(id, data)`). `DisciplineValidator.validateDates` reutilizado para la validación de fechas combinadas.
- **Application**: `UpdateDisciplineUseCase` — busca la sanción existente con `findById`, fusiona los campos nuevos sobre los existentes, invoca `DisciplineValidator.validateDates` con los valores finales y delega en `DisciplineRepository.update`.
- **Infrastructure**: `PostgresDisciplineRepository` amplía su implementación con el método `update` usando `prisma.discipline.update`. `DisciplineController` expone el endpoint y extrae el `id` de los parámetros de ruta.

## Casos de Borde y Errores

| Escenario                            | Resultado Esperado                                              | Código HTTP               |
| ------------------------------------ | --------------------------------------------------------------- | ------------------------- |
| Sanción inexistente                  | "La sanción indicada no existe"                                 | 404 Not Found             |
| `end_date` resultante `<= start_date`| "La fecha de fin debe ser posterior a la de inicio"             | 400 Bad Request           |
| Intento de modificar `member_id`     | "El campo `member_id` no puede modificarse"                     | 400 Bad Request           |
| Cuerpo de petición vacío             | "Debe enviarse al menos un campo a actualizar"                  | 400 Bad Request           |
| Error de conexión a DB               | "Error interno, reintente más tarde"                            | 500 Internal Server Error |

## Plan de Implementación

1. Definir `UpdateDisciplineRequest` en `packages/shared/index.ts`.
2. Ampliar la interfaz `DisciplineRepository` con el método `update(id, data)`.
3. Implementar `UpdateDisciplineUseCase`: leer registro existente → fusionar campos → validar fechas → persistir.
4. Implementar el método `update` en `PostgresDisciplineRepository`.
5. Agregar el método `update` en `DisciplineController` y registrar la ruta `PATCH /api/v1/disciplines/:id` en `app.ts`.
6. Conectar la acción de edición en el componente de tabla del frontend reutilizando el formulario de alta.
