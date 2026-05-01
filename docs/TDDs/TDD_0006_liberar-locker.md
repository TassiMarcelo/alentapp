---
id: 0006
estado: Propuesto
autor: Tassi Marcelo
fecha: 2026-04-30
titulo: Liberación de Lockers
---
# TDD-0006: Liberación de Lockers

## Contexto de Negocio (PRD)

### Objetivo

Permitir que un administrativo libere un locker actualmente asignado a un socio, dejándolo disponible para que otro socio pueda utilizarlo. Esta operación no elimina el registro del locker de la base de datos ya que los lockers son activos físicos permanentes del club; simplemente cambia su estado y desvincula al socio.

### User Persona

- **Nombre**: Alberto (Administrativo).
- **Necesidad**: Liberar un locker cuando el contrato de un socio vence o cuando el socio lo devuelve. Necesita una confirmación antes de proceder para no cometer errores, y que el locker quede disponible de inmediato para una nueva asignación.

### Criterios de Aceptación

- El sistema debe pedir una confirmación explícita (advertencia visual) antes de proceder con la liberación.
- El sistema debe validar que el locker exista.
- El sistema debe validar que el locker tenga estado `OCUPADO`; no tiene sentido liberar un locker que ya está disponible o en mantenimiento.
- Si la operación es exitosa, el locker debe quedar con estado `DISPONIBLE`, `memberId` en `null` y `fechaFinContrato` en `null`.
- La tabla de lockers debe actualizarse automáticamente tras la operación.

## Diseño Técnico (RFC)

### Contrato de API (@alentapp/shared)

Al tratarse de una operación que solo requiere el identificador del locker, no se envía cuerpo en la petición.

- **Endpoint**: `DELETE /api/v1/lockers/:id`
- **Request Body**: `None`
- **Response**: `200 OK` con el locker liberado.

```ts
{
  id: string;
  numero: number;
  ubicacion: string;
  estado: 'DISPONIBLE';
  fechaFinContrato: null;
  socio: null;
}
```

> **Decisión de diseño**: Se devuelve `200 OK` con el objeto actualizado en lugar de `204 No Content` para que el Frontend pueda reflejar el nuevo estado del locker sin necesidad de un refetch adicional.

### Componentes de Arquitectura Hexagonal

- **Puerto**: `LockerRepository` (Métodos `findById`, `release`).
- **Caso de Uso**: `ReleaseLockerUseCase` (Verifica que el locker existe y tiene estado `OCUPADO`, luego delega la liberación al repositorio).
- **Adaptador de Salida**: `PostgresLockerRepository` (Ejecuta un `UPDATE` con Prisma seteando `estado = DISPONIBLE`, `memberId = null` y `fechaFinContrato = null`).
- **Adaptador de Entrada**: `LockerController` (Ruta HTTP `DELETE /api/v1/lockers/:id` que extrae el `id` y devuelve el locker liberado).

## Casos de Borde y Errores

| Escenario | Resultado Esperado | Código HTTP |
| --- | --- | --- |
| `id` con formato inválido | Mensaje: "El id ingresado no es válido" | 400 Bad Request |
| Locker inexistente | Mensaje: "El locker no existe" | 404 Not Found |
| Locker en estado `DISPONIBLE` | Mensaje: "El locker ya está disponible" | 409 Conflict |
| Locker en estado `MANTENIMIENTO` | Mensaje: "El locker no tiene un socio asignado" | 409 Conflict |
| Liberación exitosa | Locker con estado `DISPONIBLE`, sin socio ni fecha de contrato | 200 OK |
| Error de conexión a DB | Mensaje: "Error interno, reintente más tarde" | 500 Internal Server Error |

## Plan de Implementación

1. Crear el tipo `ReleaseLockerResponse` en `@alentapp/shared`.
2. Definir el método `release(id)` en la interfaz `LockerRepository` del Dominio.
3. Implementar `ReleaseLockerUseCase` con la validación de existencia y estado previo.
4. Implementar el método `release` en `PostgresLockerRepository` usando `prisma.locker.update`.
5. Crear la ruta `DELETE /api/v1/lockers/:id` en `LockerController` y registrarla en `app.ts`.
6. Enlazar el botón de liberación en `LockersView.tsx` agregando la confirmación del navegador (`window.confirm`) antes de hacer la llamada al endpoint.

## Observaciones Adicionales

- A futuro, si se implementan roles, este endpoint debería estar restringido al rol `ADMIN`.
- Se podría considerar registrar en una tabla de auditoría (`LockerHistory`) quién liberó el locker y cuándo, para tener trazabilidad histórica de las asignaciones. Esto queda fuera del alcance actual.
- Si se implementa vencimiento automático de contratos, un job/cron podría llamar a esta misma lógica de liberación para los lockers cuya `fechaFinContrato` haya pasado, reutilizando el `ReleaseLockerUseCase` sin cambios.