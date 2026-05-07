---
id: 0022
estado: Propuesto
autor: Tassi Marcelo
fecha: 2026-04-30
titulo: Actualización de Datos de Lockers
---
# TDD-0022: Actualización de Datos de Lockers

## Contexto de Negocio (PRD)

### Objetivo

Permitir que un administrativo corrija los datos físicos de un locker existente, como su número o su ubicación, en caso de que hayan sido cargados incorrectamente o que el casillero haya sido movido físicamente a otro vestuario. Solo se permite modificar lockers que no estén actualmente asignados a un socio.

### User Persona

- **Nombre**: Alberto (Administrativo).
- **Necesidad**: Corregir el número o la ubicación de un locker .
### Criterios de Aceptación

- El sistema debe permitir actualizar el `numero`, la `ubicacion`, o ambos a la vez.
- El sistema debe validar que al menos un campo esté presente en el body.
- El sistema debe validar que el locker tenga estado `DISPONIBLE` o `MANTENIMIENTO` para poder modificarlo.
- El sistema debe validar que si se cambia el `numero`, este no esté ya registrado en otro locker.
- El sistema no debe modificar el estado, el socio asignado ni la fecha de contrato del locker.
- Si la operación es exitosa, el sistema debe devolver el locker con los datos actualizados.

## Diseño Técnico (RFC)

### Contrato de API (@alentapp/shared)

- **Endpoint**: `PUT /api/v1/lockers/:id`
- **Request Body**:

```ts
{
  numero?: number;      // nuevo número físico del casillero
  ubicacion?: 'VESTUARIO_MASCULINO' | 'VESTUARIO_FEMENINO' | 'NINOS';
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

- **Puerto**: `LockerRepository` (Métodos `findById`, `findByNumero`, `update`).
- **Caso de Uso**: `UpdateLockerUseCase` (Verifica que el locker existe, que no está `OCUPADO`, que el nuevo número no esté en uso y delega la actualización al repositorio).
- **Adaptador de Salida**: `PostgresLockerRepository` (Actualiza el registro usando `prisma.locker.update`).
- **Adaptador de Entrada**: `LockerController` (Ruta HTTP `PUT /api/v1/lockers/:id` que extrae el `id` y el body, y mapea excepciones a códigos HTTP).

## Casos de Borde y Errores

| Escenario | Resultado Esperado | Código HTTP |
| --- | --- | --- |
| Body vacío (sin campos) | Mensaje: "Debe enviar al menos un campo a modificar" | 400 Bad Request |
| `ubicacion` con valor desconocido | Mensaje: "Ubicación inválida" | 400 Bad Request |
| Locker inexistente | Mensaje: "El locker no existe" | 404 Not Found |
| Locker en estado `OCUPADO` | Mensaje: "No se puede modificar un locker que está ocupado" | 409 Conflict |
| `numero` ya registrado en otro locker | Mensaje: "Ya existe un locker con ese número" | 409 Conflict |
| Actualización exitosa | Locker con los datos actualizados | 200 OK |
| Error de conexión a DB | Mensaje: "Error interno, reintente más tarde" | 500 Internal Server Error |

## Plan de Implementación

1. Crear el tipo `UpdateLockerRequest` en `@alentapp/shared`.
2. Definir el método `update` en la interfaz `LockerRepository` del Dominio.
3. Implementar `UpdateLockerUseCase` que verifica existencia, estado no `OCUPADO` y unicidad del número antes de persistir.
4. Implementar el método `update` en `PostgresLockerRepository` usando `prisma.locker.update`.
5. Crear la ruta `PUT /api/v1/lockers/:id` en `LockerController` y registrarla en `app.ts`.
6. Agregar el botón "Editar" en `LockersView.tsx` que solo sea visible cuando el locker tiene estado `DISPONIBLE` o `MANTENIMIENTO`, y que abra un modal con los campos `numero` y `ubicacion` precargados con los valores actuales.