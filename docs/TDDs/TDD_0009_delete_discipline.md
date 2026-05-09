---
id: 0009
estado: Pendiente
autor: Mateo Lafalce
fecha: 2026-05-01
titulo: Eliminación de Sanciones Disciplinarias
---

# TDD-0009: Eliminación de Sanciones Disciplinarias

## Contexto de Negocio (PRD)

### Objetivo

Permitir a los administrativos eliminar una sanción disciplinaria cargada por error, ocultándola de las vistas de gestión y consulta sin perder el registro a nivel de base de datos. Mantener trazabilidad histórica es importante en un dominio de sanciones por motivos de auditoría y posibles reclamos posteriores.

### User Persona

- **Nombre**: Alberto (Tesorero/Administrativo).
- **Necesidad**: Borrar una sanción cargada equivocadamente sin tener que recurrir a la base de datos directamente. Necesita una advertencia previa para evitar eliminaciones accidentales y, a la vez, que el sistema preserve el registro para futuras revisiones de auditoría.

### Criterios de Aceptación

- El sistema debe pedir confirmación explícita antes de proceder con el borrado mediante un diálogo modal de Chakra UI v3 (componente `Dialog`), coherente con el resto del frontend.
- El sistema debe validar que la sanción exista antes de intentar eliminarla.
- El sistema debe realizar un **borrado lógico** (`soft delete`) seteando el campo `deleted_at` con el timestamp del borrado. El registro permanece en la tabla pero deja de aparecer en las consultas estándar ([TDD-0010](TDD_0010_list_disciplines.md) filtra por `deleted_at: null`).
- Si la sanción ya tiene `deleted_at != null`, una nueva petición de borrado debe responder `404 Not Found`, ya que para los consumidores el recurso "no existe".
- Si el borrado es exitoso, la tabla del frontend debe actualizarse automáticamente.

## Diseño Técnico (RFC)

### Contrato de API (@alentapp/shared)

La operación es destructiva y solo requiere el identificador; no se envía cuerpo en la petición.

- **Endpoint**: `DELETE /api/v1/disciplines/:id`
- **Request Body**: Ninguno.
- **Response**: `204 No Content` en caso de éxito.

### Componentes de Arquitectura Hexagonal

- **Domain**: `DisciplineRepository` (método `softDelete(id)`, interfaz definida en [TDD-0007](TDD_0007_create_discipline.md)). El método `findById` debe excluir registros con `deleted_at != null` para que la verificación de existencia previa al borrado considere "no existente" a una sanción ya borrada lógicamente.
- **Application**: `DeleteDisciplineUseCase` — verifica existencia de la sanción con `findById` (que ya filtra por `deleted_at: null`) y delega el borrado lógico a `DisciplineRepository.softDelete`.
- **Infrastructure**: `PostgresDisciplineRepository` implementa `softDelete` usando `prisma.discipline.update({ where: { id }, data: { deleted_at: new Date() } })`. `DisciplineController` expone el endpoint, extrae el `id` de los parámetros de ruta y retorna `204` ante éxito.

## Casos de Borde y Errores

| Escenario                          | Resultado Esperado                            | Código HTTP               |
| ---------------------------------- | --------------------------------------------- | ------------------------- |
| Sanción inexistente                | "La sanción indicada no existe"               | 404 Not Found             |
| Sanción ya borrada (`deleted_at`)  | "La sanción indicada no existe"               | 404 Not Found             |
| Error de conexión a DB             | "Error interno, reintente más tarde"          | 500 Internal Server Error |

## Plan de Implementación

1. Ampliar la interfaz `DisciplineRepository` con el método `softDelete(id)` y asegurar que `findById` excluya registros con `deleted_at != null`.
2. Implementar `DeleteDisciplineUseCase`.
3. Implementar el método `softDelete` en `PostgresDisciplineRepository` con `prisma.discipline.update` seteando `deleted_at = new Date()`.
4. Agregar el método `delete` en `DisciplineController` y registrar la ruta `DELETE /api/v1/disciplines/:id` en `app.ts`.
5. Añadir el método `delete` al servicio frontend `disciplines.ts`.
6. Conectar el botón de eliminación en la vista del frontend usando un diálogo modal de Chakra UI v3 (`Dialog`) con botones "Cancelar" y "Eliminar", manteniendo consistencia visual con el resto de la SPA.

## Observaciones Adicionales

- El borrado lógico preserva el registro para auditoría. Si en el futuro se requiere una purga real (por ejemplo, GDPR/derecho al olvido), se implementará un job separado, no se cambiará la semántica de este endpoint.
- **Borrado de sanciones vigentes permitido sin restricciones**: una sanción cuya ventana `[start_date, end_date]` cubre `now()` puede borrarse libremente con la misma operación. El caso de uso típico es justamente corregir una carga errónea que ya está bloqueando a un socio que no debería estar suspendido. Como consecuencia, los módulos consumidores (`EnrollmentUseCase`, `AssignLockerUseCase`) dejarán de bloquear al socio inmediatamente tras el borrado, lo cual es el comportamiento deseado. La trazabilidad queda preservada por el `deleted_at` (se sabe quién/cuándo se borró si se cruza con logs de auditoría).
- Toda query nueva sobre `Discipline` debe recordar filtrar por `deleted_at: null`. Para reducir el riesgo de olvido, los métodos del repositorio (`findById`, `findAll`, `findActiveByMember*`) aplican el filtro internamente; sólo se omite cuando un caso de uso explícito de auditoría lo requiera.
