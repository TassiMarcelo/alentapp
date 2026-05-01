---
id: 0005
estado: Propuesto
autor: Tassi Marcelo
fecha: 2026-04-30
titulo: Asignación de Lokers
---
# TDD-0005: Asignación de Lokers

## Contexto de Negocio (PRD)

### Objetivo

Permitir que un administrativo asigne un locker disponible a un socio activo del club, garantizando que no se produzcan dobles asignaciones sobre un recurso físico limitado. El sistema debe ser el único árbitro en caso de que dos personas intenten asignar el mismo locker al mismo tiempo.

### User Persona

- **Nombre**: Alberto (Administrativo).
- **Necesidad**: Asignar un locker a un socio de forma rápida desde el panel. Necesita que el sistema le avise de inmediato si el locker ya fue tomado por otro administrativo en el mismo momento, y que nunca se den dos asignaciones sobre el mismo locker.

### Criterios de Aceptación

- El sistema debe validar que el locker exista y tenga estado `DISPONIBLE` antes de asignarlo.
- El sistema debe validar que el socio exista.
- El sistema debe validar que el socio no tenga ya un locker asignado.
- La `fechaFinContrato` debe ser una fecha futura.
- Al finalizar, el locker debe quedar con estado `OCUPADO` y vinculado al socio.
- Si dos administrativos intentan asignar el mismo locker simultáneamente, solo el primero debe tener éxito; el segundo debe recibir un error.

## Diseño Técnico (RFC)

### Contrato de API (@alentapp/shared)

- **Endpoint**: `POST /api/v1/lockers/assign`
- **Request Body**:

```ts
{
  lockerId: string;         // UUID del locker a asignar
  memberId: string;         // UUID del socio
  fechaFinContrato: string; // ISO 8601: "YYYY-MM-DD"
}
```

- **Response**: `201 Created` con el locker actualizado.

```ts
{
  id: string;
  numero: number;
  ubicacion: string;
  estado: 'OCUPADO';
  fechaFinContrato: string;
  socio: {
    nombre: string;
    dni: string;
  };
}
```

### Componentes de Arquitectura Hexagonal

- **Puerto**: `LockerRepository` (Métodos `findById`, `findByMemberId`, `assign`).
- **Caso de Uso**: `AssignLockerUseCase` (Verifica disponibilidad del locker, unicidad de asignación por socio y delega la persistencia al repositorio).
- **Adaptador de Salida**: `PostgresLockerRepository` (Usa una transacción de Prisma para garantizar que la verificación de estado y la escritura sean atómicas, evitando race conditions).
- **Adaptador de Entrada**: `LockerController` (Ruta HTTP `POST /assign` que valida el body y mapea excepciones a códigos HTTP).

## Casos de Borde y Errores

| Escenario | Resultado Esperado | Código HTTP |
| --- | --- | --- |
| Campos faltantes en el body | Mensaje: "Faltan campos requeridos" | 400 Bad Request |
| `fechaFinContrato` en el pasado | Mensaje: "La fecha de fin debe ser futura" | 400 Bad Request |
| `lockerId` no existe | Mensaje: "El locker no existe" | 404 Not Found |
| `memberId` no existe | Mensaje: "El socio no existe" | 404 Not Found |
| Locker en estado `OCUPADO` o `MANTENIMIENTO` | Mensaje: "El locker no está disponible" | 409 Conflict |
| Socio ya tiene un locker asignado | Mensaje: "El socio ya tiene un locker asignado" | 409 Conflict |
| Doble asignación simultánea (race condition) | El segundo intento recibe: "El locker no está disponible" | 409 Conflict |
| Error de conexión a DB | Mensaje: "Error interno, reintente más tarde" | 500 Internal Server Error |

## Plan de Implementación

1. Crear los tipos `AssignLockerRequest` y `AssignLockerResponse` en `@alentapp/shared`.
2. Definir los métodos `findById`, `findByMemberId` y `assign` en la interfaz `LockerRepository` del Dominio.
3. Implementar `PostgresLockerRepository` usando una transacción de Prisma (`prisma.$transaction`) para que la verificación de estado y la asignación sean atómicas.
4. Implementar `AssignLockerUseCase` con toda la lógica de validación.
5. Crear la ruta `POST /api/v1/lockers/assign` en `LockerController` y registrarla en `app.ts`.
6. Agregar el botón "Asignar" en `LockersView.tsx` que abra un modal solicitando el socio y la fecha de fin de contrato.

## Observaciones Adicionales

- La atomicidad de la transacción de Prisma (`prisma.$transaction`) es la clave para evitar race conditions: la lectura del estado y la escritura del nuevo estado ocurren en la misma operación de base de datos, haciendo imposible que dos asignaciones simultáneas tengan éxito.
- A futuro, si se implementan roles, este endpoint debería estar restringido al rol `ADMIN`, o bien tener una variante para que el propio socio pueda autoasignarse un locker disponible.