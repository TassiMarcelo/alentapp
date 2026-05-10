---
id: 0013
estado: Aprobado
autor: Alejandro Llontop
fecha: 2026-05-01
titulo: Eliminación de Catálogos Existentes
---

# TDD-0003: Eliminacion de Catálogo de Deportes

## Contexto de Negocio (PRD)

### Objetivo

Eliminar de forma permanente (Hard Delete) un deporte del sistema, asegurando la rotura previa de todos los vínculos con los miembros para mantener la integridad referencial de la base de datos.

### User Persona
*   **Nombre**: Administrativo
*   **Necesidad**: Borrar definitivamente una actividad del catálogo que ya no es relevante.

### Criterios de Aceptación
- El sistema debe pedir una confirmación explícita (advertencia visual) antes de proceder con el borrado, notificando que se perderán los vínculos con los socios.
- El sistema debe validar que el deporte exista antes de intentar borrarlo.
- El sistema debe desvincular automáticamente a todos los socios asociados (setear sport_id en null) antes de la supresión
- El sistema debe realizar un borrado físico de la base de datos (hard delete) del registro del deporte.
- El sistema debe asegurar que la desvinculación y el borrado ocurran dentro de una transacción atómica.Si falla el borrado, se debe revertir la desvinculación.
- Si el borrado es exitoso, la lista en el Frontend debe actualizarse automáticamente para reflejar la eliminación.

## Diseño Técnico (RFC)

### Contrato de API (@alentapp/shared)
[Definición de endpoints y tipos compartidos.]
*   **Endpoint**: `DELETE /api/v1/sports/:id`
*   **Request Body**: NONE
*   **Response **: 204 No Content en caso de éxito.

### Componentes de Arquitectura Hexagonal

1. Puerto: SportRepository (Método delete(id)).
2. Caso de Uso: DeleteSportUseCase (Comprueba existencia previa vía findById y delega la eliminación).
3. Adaptador de Salida: SportRepository (Implementa el delete ejecutando una transacción atómica que primero setea en null el vínculo de los socios y luego elimina el registro en Prisma).
4. Adaptador de Entrada: SportController (Ruta HTTP que extrae el id de la URL y devuelve un status 204).

## Casos de Borde y Errores

| Escenario                  | Resultado Esperado                            | Código HTTP               |
| -------------------------- | --------------------------------------------- | ------------------------- |
| ID no encontrado      | Mensaje: "El deporte ya ha sido eliminado o no existe".  | 400 Bad Request              |
| Éxito   | Deporte borrado y socios actualizados.   |  200 OK          |
| Error en la base de datos     | Se hace rollback de la desvinculación y se informa el fallo.  | 500 Internal Error |


## Plan de Implementación
1. Ampliar el SportRepository y SportRepository con el método delete que ejecute la transacción de limpieza y borrado físico. 
2. Crear la lógica de negocio en DeleteSportUseCase utilizando el SportValidator llamando directamente a la operación atómica del repositorio.
3. Crear el endpoint DELETE /api/v1/sports/:id en el SportController y registrarlo en app.ts.
4. Añadir el método delete al servicio Frontend (sports.ts) para gestionar la petición hacia el backend.
5. Enlazar el botón de eliminación en SportsView.tsx agregando la confirmación del navegador (window.confirm) que advierta sobre la pérdida de vínculos con los socios .
