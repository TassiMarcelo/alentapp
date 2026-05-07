---
id: 0005
estado: Propuesto
autor: Tassi Marcelo
fecha: 2026-04-30
titulo: Actualización de Estado de Lockers
---
# TDD-0005: Actualización de Estado de Lockers

## Contexto de Negocio (PRD)

### Objetivo

Permitir que un administrativo modifique el estado de un locker existente, cubriendo los casos de asignación a un socio, liberación y envío a mantenimiento. El sistema debe garantizar que solo se permitan transiciones de estado coherentes.

### User Persona

- **Nombre**: Alberto (Administrativo).
- **Necesidad**: Desde la tabla de lockers, poder asignar un locker disponible a un socio, liberar uno ocupado cuando el contrato vence, o mandar uno disponible a mantenimiento cuando tiene un desperfecto. Necesita que el sistema le impida hacer transiciones que no tienen sentido, como mandar a mantenimiento un locker que está ocupado.

### Criterios de Aceptación

- El sistema debe validar que el locker exista.
- El sistema debe validar que el nuevo estado sea distinto al estado actual.
- Si el nuevo estado es `OCUPADO`: el `memberId` y la `fechaFinContrato` son requeridos y la fecha debe ser futura.
- Si el nuevo estado es `DISPONIBLE`: el sistema debe limpiar automáticamente `memberId` y `fechaFinContrato`.
- Si el nuevo estado es `MANTENIMIENTO`: no se requieren datos extra.
- Las siguientes transiciones están permitidas:
  - `DISPONIBLE → OCUPADO`
  - `DISPONIBLE → MANTENIMIENTO`
  - `OCUPADO → DISPONIBLE`
  - `MANTENIMIENTO → DISPONIBLE`
- Las siguientes transiciones están prohibidas:
  - `OCUPADO → MANTENIMIENTO`: el locker debe liberarse antes.
  - `MANTENIMIENTO → OCUPADO`: el locker debe volver a `DISPONIBLE` antes.
- Si dos administrativos intentan asignar el mismo locker simultáneamente, solo el primero debe tener éxito.

## Diseño Técnico (RFC)

### Contrato de API (@alentapp/shared)

- **Endpoint**: `PUT /api/v1/lockers/:id/estado`
- **Request Body**:

```ts
{
  estado: 'DISPONIBLE' | 'OCUPADO' | 'MANTENIMIENTO';
  memberId?: string;          // requerido solo si estado = OCUPADO
  fechaFinContrato?: string;  // requerido solo si estado = OCUPADO, ISO 8601: "YYYY-MM-DD"
}
```

- **Response**: `200 OK` con el locker actualizado.

```ts
{
  id: string;
  numero: number;
  ubicacion: string;
  estado: string;
  fechaFinContrato: string | null;
  socio: {
    nombre: string;
    dni: string;
  } | null;
}
```

### Componentes de Arquitectura Hexagonal

- **Puerto**: `LockerRepository` (Métodos `findById`, `updateEstado`).
- **Servicio de Dominio**: `LockerEstadoValidator` (Encargado de verificar si la transición de estado es permitida, centraliza las reglas de negocio de transición).
- **Caso de Uso**: `UpdateLockerEstadoUseCase` (Verifica existencia del locker, valida la transición con `LockerEstadoValidator`, aplica los cambios y delega la persistencia al repositorio).
- **Adaptador de Salida**: `PostgresLockerRepository` (Usa `prisma.$transaction` para la transición `DISPONIBLE → OCUPADO` y `prisma.locker.update` para el resto).
- **Adaptador de Entrada**: `LockerController` (Ruta HTTP `PUT /api/v1/lockers/:id/estado` que extrae el `id` y el body, y mapea excepciones a códigos HTTP).

## Casos de Borde y Errores

| Escenario | Resultado Esperado | Código HTTP |
| --- | --- | --- |
| `id` con formato inválido | Mensaje: "El id ingresado no es válido" | 400 Bad Request |
| `estado` con valor desconocido | Mensaje: "Estado inválido" | 400 Bad Request |
| Nuevo estado igual al estado actual | Mensaje: "El locker ya se encuentra en ese estado" | 400 Bad Request |
| `memberId` o `fechaFinContrato` faltante cuando `estado = OCUPADO` | Mensaje: "Para asignar un locker se requiere memberId y fechaFinContrato" | 400 Bad Request |
| `fechaFinContrato` en el pasado | Mensaje: "La fecha de fin debe ser futura" | 400 Bad Request |
| Locker inexistente | Mensaje: "El locker no existe" | 404 Not Found |
| `memberId` no corresponde a ningún socio | Mensaje: "El socio no existe" | 404 Not Found |
| Transición `OCUPADO → MANTENIMIENTO` | Mensaje: "No se puede enviar a mantenimiento un locker ocupado, debe liberarse primero" | 409 Conflict |
| Transición `MANTENIMIENTO → OCUPADO` | Mensaje: "No se puede asignar un locker en mantenimiento, debe estar disponible primero" | 409 Conflict |
| Doble asignación simultánea (race condition) | El segundo intento recibe: "El locker no está disponible" | 409 Conflict |
| Error de conexión a DB | Mensaje: "Error interno, reintente más tarde" | 500 Internal Server Error |

## Plan de Implementación

1. Crear los tipos `UpdateLockerEstadoRequest` y `LockerResponse` en `@alentapp/shared`.
2. Definir los métodos `findById` y `updateEstado` en la interfaz `LockerRepository` del Dominio.
3. Implementar `LockerEstadoValidator` con la tabla de transiciones permitidas y prohibidas.
4. Implementar `UpdateLockerEstadoUseCase` que orquesta la validación y llama al repositorio.
5. Implementar `PostgresLockerRepository` usando `prisma.$transaction` para la asignación y `prisma.locker.update` para el resto.
6. Crear la ruta `PUT /api/v1/lockers/:id/estado` en `LockerController` y registrarla en `app.ts`.
7. Actualizar `LockersView.tsx` con las acciones correspondientes por estado: botón "Asignar" para `DISPONIBLE`, botón "Liberar" con `window.confirm` para `OCUPADO`, y botón "Mantenimiento" para `DISPONIBLE`.

## Observaciones Adicionales

- `prisma.$transaction` se usa únicamente en la transición `DISPONIBLE → OCUPADO` para evitar race conditions: la lectura del estado y la escritura ocurren en la misma operación atómica, haciendo imposible que dos asignaciones simultáneas tengan éxito.
- `LockerEstadoValidator` es una función pura del dominio, lo que facilita el testing unitario sin necesidad de base de datos.
- A futuro, si se implementan roles, este endpoint debería estar restringido al rol `ADMIN`.