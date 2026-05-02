---
id: 0013
estado: Propuesto
autor: Alejandro Llontop
fecha: 2026-05-01
titulo: Eliminación de Catálogos Existentes
---

# TDD-0003: Eliminacion de Catálogo de Deportes

## Contexto de Negocio (PRD)

### Objetivo

Desactivar actividades del catálogo mediante un cambio de estado a "Inactivo", garantizando que la operación solo proceda si no existen socios con inscripciones vigentes en la entidad intermedia Enrollment.

### User Persona
*   **Nombre**: Administrativo
*   **Necesidad**: Retirar un deporte de la oferta actual del club asegurando que no se interrumpan actividades en curso de forma imprevista.

### Criterios de Aceptación
- El sistema debe validar que el sport_id existe y su estado actual es "ACTIVO".
- El sistema debe consultar la entidad Enrollment y contar cuántos registros vinculados poseen el estado "ACTIVO".
- Escenario de Bloqueo: Si el conteo de inscripciones activas es mayor a cero, el sistema debe impedir la baja y mostrar un error informativo.
- Escenario de Éxito: Si no hay inscripciones activas, el sistema debe actualizar el estado del deporte a "INACTIVO".

## Diseño Técnico (RFC)

### Modelo de Datos
[Descripción de cambios en Prisma]

*   **Entidad `Sport`**:
    *   `id`: Identificador único (UUID).
    *   `estado`: Enumeración (`ACTIVO` | `INACTIVO`).<br>*Por defecto `ACTIVO`.*

*   **Entidad `Enrollment`**:
    *   `estado`: Enumeración (`ACTIVO` | `INACTIVO`).<br>*Solo se considera "Activa" para el bloqueo.*

### Contrato de API (@alentapp/shared)
[Definición de endpoints y tipos compartidos.]
*   **Endpoint**: `DELETE /api/v1/sports/:id`
*   **Request Body**: NONE
*   **Response **: 204 No Content en caso de éxito.

### Componentes de Arquitectura Hexagonal

1. Puerto: SportRepository (Método delete(id)).
2. Caso de Uso: DeleteSportUseCase (Comprueba existencia previa vía findById y delega la eliminación).
3. Adaptador de Salida: SportRepository (Ejecuta el delete en Prisma).
4. Adaptador de Entrada: SportController (Ruta HTTP que extrae el id de la URL y devuelve un status 204).

## Casos de Borde y Errores

| Escenario                  | Resultado Esperado                            | Código HTTP               |
| -------------------------- | --------------------------------------------- | ------------------------- |
| Socios cursando actualmente      | Mensaje: "No se puede desactivar; hay [X] socios con inscripciones activas"   | 400 Bad Request              |
| ID no encontrado  | Mensaje: "El deporte solicitado no existe"   | 404 Not Found           |
| Deporte ya inactivo      | El sistema informa que la actividad ya se encuentra desactivada  | 200 OK |


## Plan de Implementación
1. Ampliar el SportRepository y PostgresSportRepository con el método softDelete para actualizar el estado del registro a "INACTIVO".
2. Crear la lógica de negocio en DeleteSportUseCase utilizando el SportValidator para verificar que no existan registros en Enrollment con estado "ACTIVO".
3. Crear el endpoint DELETE /api/v1/sports/:id en el SportController y registrarlo en app.ts.
4. Añadir el método delete al servicio Frontend (sports.ts) para gestionar la petición hacia el backend.
5. Enlazar el botón de eliminación en SportsView.tsx agregando la confirmación del navegador (window.confirm) antes de hacer la llamada para prevenir bajas accidentales.
