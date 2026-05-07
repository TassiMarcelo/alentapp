---
id: 0021
estado: Propuesto
autor: Tassi Marcelo
fecha: 2026-04-30
titulo: Creación de Lockers
---
# TDD-0021: Creación de Lockers

## Contexto de Negocio (PRD)

### Objetivo

Permitir que un administrativo registre un nuevo locker en el sistema, asignándole un número físico único y una ubicación. Esta operación es necesaria para incorporar nuevos casilleros al club o para volver a registrar uno que fue eliminado previamente, garantizando que el número físico del casillero se mantenga como identificador del mundo real.

### User Persona

- **Nombre**: Alberto (Administrativo).
- **Necesidad**: Registrar un locker nuevo en el sistema indicando su número físico y su ubicación. Necesita que el sistema rechace números de casillero ya existentes para evitar duplicados, y que le avise si el club ya alcanzó su capacidad máxima de casilleros.

### Criterios de Aceptación

- El sistema debe validar que todos los campos requeridos estén presentes (`numero`, `ubicacion`).
- El sistema debe validar que el `numero` de locker no esté ya registrado en la base de datos.
- El sistema no debe permitir crear un locker si ya existen 100 lockers registrados.
- El locker debe crearse con estado `DISPONIBLE` por defecto.
- El locker debe crearse sin socio asignado (`memberId = null`) y sin fecha de contrato (`fechaFinContrato = null`).
- Si la operación es exitosa, el sistema debe devolver el locker creado.

## Diseño Técnico (RFC)

### Modelo de Datos

Se definirá la entidad `Locker` con las siguientes propiedades y restricciones:

- `id`: Identificador único universal (UUID), autogenerado.
- `numero`: Entero, único e indexado. Representa el número físico pintado en el casillero.
- `ubicacion`: Enumeración (`VESTUARIO_MASCULINO`, `VESTUARIO_FEMENINO`, `NINOS`).
- `estado`: Enumeración con valor por defecto `DISPONIBLE` (`DISPONIBLE`, `OCUPADO`, `MANTENIMIENTO`).
- `fechaFinContrato`: Fecha nullable, vacía al momento de la creación.
- `memberId`: UUID nullable, vacío al momento de la creación.

### Contrato de API (@alentapp/shared)

- **Endpoint**: `POST /api/v1/lockers`
- **Request Body**:

```ts
{
  numero: number;       // número físico del casillero, debe ser único
  ubicacion: 'VESTUARIO_MASCULINO' | 'VESTUARIO_FEMENINO' | 'NINOS';
}
```

- **Response**: `201 Created` con el locker creado.

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

### Componentes de Arquitectura Hexagonal

- **Puerto**: `LockerRepository` (Métodos `findByNumero`, `count`, `save`).
- **Caso de Uso**: `CreateLockerUseCase` (Verifica que no se superó el límite de 100 lockers, verifica que el número no esté registrado y delega la creación al repositorio).
- **Adaptador de Salida**: `PostgresLockerRepository` (Implementa `findByNumero` con `prisma.locker.findUnique`, `count` con `prisma.locker.count` y `save` con `prisma.locker.create`).
- **Adaptador de Entrada**: `LockerController` (Ruta HTTP `POST /api/v1/lockers` que valida el body y mapea excepciones a códigos HTTP).

## Casos de Borde y Errores

| Escenario | Resultado Esperado | Código HTTP |
| --- | --- | --- |
| Campos faltantes en el body | Mensaje: "Faltan campos requeridos" | 400 Bad Request |
| `ubicacion` con valor desconocido | Mensaje: "Ubicación inválida" | 400 Bad Request |
| `numero` ya registrado en la DB | Mensaje: "Ya existe un locker con ese número" | 409 Conflict |
| Ya existen 100 lockers registrados | Mensaje: "Se alcanzó el límite máximo de lockers" | 409 Conflict |
| Creación exitosa | Locker con estado `DISPONIBLE`, sin socio ni fecha de contrato | 201 Created |
| Error de conexión a DB | Mensaje: "Error interno, reintente más tarde" | 500 Internal Server Error |

## Plan de Implementación

1. Definir el esquema `Locker` en Prisma con `numero @unique` y correr la migración.
2. Crear los tipos `CreateLockerRequest` y `CreateLockerResponse` en `@alentapp/shared`.
3. Definir los métodos `findByNumero`, `count` y `save` en la interfaz `LockerRepository` del Dominio.
4. Implementar `PostgresLockerRepository` con `prisma.locker.findUnique`, `prisma.locker.count` y `prisma.locker.create`.
5. Implementar `CreateLockerUseCase` que primero verifica el límite de 100, luego la unicidad del número y finalmente persiste.
6. Crear la ruta `POST /api/v1/lockers` en `LockerController` y registrarla en `app.ts`.
7. Agregar el formulario de creación en `LockersView.tsx` con los campos `numero` y `ubicacion`.

