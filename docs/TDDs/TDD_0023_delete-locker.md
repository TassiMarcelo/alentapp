---
id: 0023
estado: Aprobado
autor: Tassi Marcelo
fecha: 2026-04-30
titulo: Eliminación de Lockers
---
# TDD-0007: Eliminación de Lockers

## Contexto de Negocio (PRD)

### Objetivo

Permitir que un administrativo elimine un locker del sistema cuando el casillero físico deja de existir en el club. La eliminación es permanente y libera el número de casillero para que pueda ser reutilizado en una futura creación.

### User Persona

- **Nombre**: Alberto (Administrativo).
- **Necesidad**: Dar de baja un locker, que el sistema no le permita eliminar un locker que tiene un socio asignado.

### Criterios de Aceptación

- El sistema debe pedir una confirmación explícita (advertencia visual) antes de proceder con la eliminación.
- El sistema debe validar que el locker exista.
- El sistema debe validar que el locker tenga estado `DISPONIBLE` o `MANTENIMIENTO`; no se puede eliminar un locker que está actualmente asignado a un socio.
- Si la operación es exitosa, el registro del locker debe eliminarse físicamente de la base de datos.
- El número del locker eliminado queda disponible para ser reutilizado en una nueva creación.

## Diseño Técnico (RFC)

### Contrato de API (@alentapp/shared)

- **Endpoint**: `DELETE /api/v1/lockers/:id`
- **Request Body**: `None`
- **Response**: `204 No Content` en caso de éxito.

### Componentes de Arquitectura Hexagonal

- **Puerto**: `LockerRepository` (Métodos `findById`, `delete`).
- **Caso de Uso**: `DeleteLockerUseCase` (Verifica que el locker existe y que no está `OCUPADO`, luego delega la eliminación al repositorio).
- **Adaptador de Salida**: `PostgresLockerRepository` (Elimina el registro usando `prisma.locker.delete`).
- **Adaptador de Entrada**: `LockerController` (Ruta HTTP `DELETE /api/v1/lockers/:id` que extrae el `id` y devuelve `204 No Content`).

## Casos de Borde y Errores

| Escenario | Resultado Esperado | Código HTTP |
| --- | --- | --- |
| `id` con formato inválido | Mensaje: "El id ingresado no es válido" | 400 Bad Request |
| Locker inexistente | Mensaje: "El locker no existe" | 404 Not Found |
| Locker en estado `OCUPADO` | Mensaje: "No se puede eliminar un locker que está ocupado" | 409 Conflict |
| Eliminación exitosa | Respuesta vacía | 204 No Content |
| Error de conexión a DB | Mensaje: "Error interno, reintente más tarde" | 500 Internal Server Error |

## Plan de Implementación

1. Definir el método `delete` en la interfaz `LockerRepository` del Dominio.
2. Implementar `DeleteLockerUseCase` con la validación de existencia y estado no `OCUPADO`.
3. Implementar el método `delete` en `PostgresLockerRepository` usando `prisma.locker.delete`.
4. Crear la ruta `DELETE /api/v1/lockers/:id` en `LockerController` y registrarla en `app.ts`.
5. Enlazar el botón de eliminación en `LockersView.tsx` agregando `window.confirm` antes de hacer la llamada, y ocultando el botón cuando el locker tiene estado `OCUPADO`.