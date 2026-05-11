---
id: 0020
estado: Aprobado
autor: Delozano Matias
fecha: 2026-05-10
titulos: Eliminación de Certificado Médico
---

# TDD-0020: Eliminación de Certificado Médico

## Contexto de Negocio (PRD)

### Objetivo

Permitir que el personal administrativo pueda eliminar un certificado médico cargado por error o que haya sido anulado por la institución, asegurando que el registro no se pierda físicamente de la base de datos para fines de auditoría, pero que deje de tener efecto sobre la aptitud física del socio.

### User Persona

- **Nombre**: Alberto (Tesorero/Administrativo).
- **Necesidad**: Borrar un certificado que fue subido al socio equivocado o que contiene información falsa. Necesita que el sistema le pida una confirmación para evitar errores accidentales y que, una vez borrado, el socio deje de estar "Apto" si no tiene otro certificado vigente.

### Criterios de Aceptación

- El sistema debe solicitar una confirmación explícita mediante un cartel de confirmación que diga "¿Está seguro que desea eliminar este certificado?".
- Una vez confirmada la acción, el certificado debe desaparecer de la lista de "Aptos Médicos" del socio.
- Si el certificado que se borra era el único que tenía el socio, este debe figurar automáticamente como "No Apto" para realizar actividades.
- El sistema debe realizar un borrado lógico (soft delete) en la base de datos.
- El sistema debe validar que el certificado exista antes de intentar eliminarlo.


## Diseño Técnico (RFC)

### Modelo de Datos (Prisma)
Se utiliza el campo existente en el esquema para borrado lógico:
* `deleted_at`: `DateTime?` (Nulo por defecto, se completa al eliminar).

### Contrato de API (@alentapp/shared)

* **Endpoint**: `DELETE /api/v1/medical-certificates/:id`
* **Respuesta de éxito**: `204 No Content`

### Componentes de Arquitectura Hexagonal

* **Domain**: 
    - El `MedicalCertificateRepository` debe incluir el método `delete(id: string): Promise<void>`.
* **Application**: 
    - `DeleteMedicalCertificateUseCase`: Se encarga de coordinar la búsqueda del certificado y ejecutar el borrado lógico a través del repositorio.
* **Infrastructure**: 
    - **Controlador**: `MedicalCertificateController.delete` captura el ID de los parámetros de la ruta.
    - **Adaptador de Persistencia**: `PostgresMedicalCertificateRepository` ejecuta un `prisma.medicalCertificate.update` seteando la fecha actual en `deleted_at`.

## Casos de Borde y Errores

| Escenario                   | Resultado Esperado                            | Código HTTP               |
| ----------------------------| --------------------------------------------- | ------------------------- |
| Certificado no encontrado   | "El certificado médico no existe"             | 404 Not Found             |
| Certificado ya eliminado    | "El recurso ya ha sido eliminado previamente" | 410 Gone                  |
| Error de base de datos      | "Error interno, reintente más tarde"          | 500 Internal Server Error |

## Plan de Implementación

1. Definir el método `delete` en la interfaz `MedicalCertificateRepository` (capa `domain`).
2. Implementar `DeleteMedicalCertificateUseCase` en la capa `application`.
3. Implementar el método `delete` en `PostgresMedicalCertificateRepository` realizando el update del campo `deleted_at`.
4. Crear el método `delete` en `MedicalCertificateController` y registrar la ruta `DELETE /api/v1/medical-certificates/:id` en el router.
5. En el frontend, añadir la función `delete` al servicio de certificados médicos.
6. Integrar el botón de eliminación en la interfaz de usuario, vinculándolo a un componente `Dialog`para la confirmación.

## Observaciones Adicionales

- **Consistencia de Aptitud**: Al realizar el borrado lógico, cualquier lógica que verifique si un socio está apto (como en el módulo de inscripciones) debe filtrar los certificados donde `deleted_at` sea distinto de `null`.