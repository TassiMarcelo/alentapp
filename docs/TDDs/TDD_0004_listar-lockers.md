---
id: 0004
estado: Propuesto
autor: Tassi Marcelo
fecha: 2026-04-30
titulo: Listado de lokers
---
# TDD-0004: Listado de Lokers

## Contexto de Negocio (PRD)

### Objetivo

Permitir que un administrativo visualice el estado actualizado de todos loe Lokers del club, incluyendo quién tiene asignado cada uno y hasta cuando dura su contrato, para poder tomar decisiones de asignación y liberación con información completa.

### User Persona

- **Nombre**: Alberto (Administrativo).
- **Necesidad**: Ver que Lokers están disponibles, cuáles están ocupados y por quién, y cuáles están en mantenimiento. Si un casillero está ocupado, necesita saber el nombre y DNI del socio y la fecha en que vence el contrato.

### Criterios de Aceptación

- El sistema debe devolver todos loe Lokers con su número, ubicación y estado.
- Si el casillero tiene estado `OCUPADO`, debe incluir el nombre y DNI del socio asignado y la `fechaFinContrato`.
- Si el casillero tiene estado `DISPONIBLE` o `MANTENIMIENTO`, los campos del socio deben aparecer como `null`.
- El sistema debe permitir filtrar por estado (`DISPONIBLE`, `OCUPADO`, `MANTENIMIENTO`).
- El sistema debe permitir filtrar por ubicación (`VESTUARIO_MASCULINO`, `VESTUARIO_FEMENINO`, `NINOS`).

## Diseño Técnico (RFC)

### Contrato de API (@alentapp/shared)

- **Endpoint**: `GET /api/v1/lockers`
- **Query Params (opcionales)**:

```ts
{
  estado?: 'DISPONIBLE' | 'OCUPADO' | 'MANTENIMIENTO';
  ubicacion?: 'VESTUARIO_MASCULINO' | 'VESTUARIO_FEMENINO' | 'NINOS';
}
```

- **Response**: `200 OK` con el listado de Lokers.

```ts
[
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
]
```

### Componentes de Arquitectura Hexagonal

- **Puerto**: `LockerRepository` (Método `findAll(filters)`).
- **Caso de Uso**: `GetLockersUseCase` (Recibe los filtros opcionales y delega al repositorio).
- **Adaptador de Salida**: `PostgresLockerRepository` (Consulta con Prisma usando `include: { member: true }` para traer los datos del socio en el mismo query).
- **Adaptador de Entrada**: `LockerController` (Ruta HTTP `GET /api/v1/lockers` que extrae los query params y los pasa al caso de uso).

## Casos de Borde y Errores

| Escenario | Resultado Esperado | Código HTTP |
| --- | --- | --- |
| Sin filtros | Devuelve todos loe Lokers | 200 OK |
| Filtro por estado válido | Devuelve solo loe Lokers con ese estado | 200 OK |
| Filtro por ubicación válida | Devuelve solo loe Lokers de esa ubicación | 200 OK |
| Filtro con valor desconocido | Mensaje: "Filtro inválido" | 400 Bad Request |
| No hae Lokers que coincidan con el filtro | Devuelve array vacío `[]` | 200 OK |
| Error de conexión a DB | Mensaje: "Error interno, reintente más tarde" | 500 Internal Server Error |

## Plan de Implementación

1. Crear el tipo `LockerListResponse` en `@alentapp/shared`.
2. Definir el método `findAll(filters)` en la interfaz `LockerRepository` del Dominio.
3. Implementar `PostgresLockerRepository` con el query de Prisma usando `include: { member: true }`.
4. Implementar `GetLockersUseCase` que mapea el resultado al `LockerListResponse`.
5. Crear la ruta `GET /api/v1/lockers` en `LockerController` y registrarla en `app.ts`.
6. Construir la vista `LockersView.tsx` en el Frontend que consuma el endpoint y muestre la tabla con el estado y los datos del socio cuando corresponda.

## Observaciones Adicionales

- Los lockers del sistema pueden ser cargados inicialmente mediante un proceso de inicialización (seed) que precargue los 100 lockers del club en la base de datos, con estado inicial DISPONIBLE.

- Esto garantiza que el sistema tenga desde el inicio la totalidad de los lockers disponibles para su gestión y visualización en el módulo de listado.