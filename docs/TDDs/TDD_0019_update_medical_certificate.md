---
id: 0019
estado: Aprobado
autor: Delozano Matias
fecha: 2026-05-10
titulo: Actualización de Certificado Médico
---

# TDD-0019: Actualización de Certificado Médico

## Contexto de Negocio (PRD)

### Objetivo

Permitir que el personal administrativo pueda corregir errores en la carga o actualizar la información de un certificado médico ya registrado (como errores de carga en la matrícula o ajustes en las fechas), garantizando que cualquier cambio mantenga la historia clínica del socio en el sistema.

### User Persona

- **Nombre**: Alberto (Tesorero/Administrativo).
- **Necesidad**: Corregir datos mal ingresados sin necesidad de eliminar y volver a crear el registro. Necesita que el sistema valide que, tras la modificación, el certificado siga siendo consistente (por ejemplo, que la fecha de vencimiento no quede anterior a la de emisión).


### Criterios de Aceptación

- El sistema debe permitir la edición parcial de los campos: `issue_date`, `expiry_date`, `doctor_license` e `is_validated`.
- Si se modifican las fechas, se debe re-validar que `expiry_date` sea posterior a `issue_date`.
- No se permite cambiar el `member_id` de un certificado ya creado para mantener la trazabilidad del historial del socio.
- Si un certificado se marca como no válido manualmente (`is_validated: false`), el sistema debe permitirlo, pero no debe activar automáticamente otros certificados históricos.

## Diseño Técnico (RFC)

### Contrato de API (@alentapp/shared)

- **Endpoint**: `PATCH /api/v1/medical-certificates/:id`
- **Request Body**:
```ts
export interface UpdateMedicalCertificateRequest {
  issueDate?: string;     
  expiryDate?: string;    
  doctorLicense?: string; 
  isValidated?: boolean;  
}
```
### Componentes de Arquitectura Hexagonal

- **Domain**: Método `update(id, data)` en la Interfaz `MedicalCertificateRepository`. Reutilización de `MedicalCertificateValidator.validateDates` para la validación de fechas combinadas.

- **Application**: `UpdateMedicalCertificateUseCase` busca el certificado existente con `findById`, usiona los campos nuevos sobre los existentes, invoca `MedicalCertificateValidator.validateDates` con los valores finales y delega en el repositorio. Si `isValidated` cambia a `true`, dispara la lógica de invalidación de registros previos del socio.


- **Infrastructure**: `PostgresMedicalCertificateRepository` implementa `update` usando `prisma.medicalCertificate.update`. `MedicalCertificateController` expone el endpoint y extrae el `id` de los parámetros de ruta.


## Casos de Borde y Errores

| Escenario                        | Resultado Esperado                                              | Código HTTP               |
| -------------------------------- | --------------------------------------------------------------- | ------------------------- |
| `Certificado inexistente`        | Mensaje: "El certificado médico indicado no existe"             | 404 Not Found             |
| `Inconsistencia de fechas`       | Msj:"La fecha de vencimiento debe ser posterior a la de emisión"| 400 Bad Request           |
| `Intento de modificar member_id` | Mensaje: "El campo member_id no puede modificarse"              | 400 Bad Request           |
| `Cuerpo de petición vacío`       | Error: "Debe proporcionar al menos un campo para actualizar"    | 400 Bad Request           |
| Error de conexión a DB           | "Error interno, reintente más tarde"                            | 500 Internal Server Error |


## Plan de Implementación

1. Definir la interfaz `UpdateMedicalCertificateRequest` en `@alentapp/shared` para permitir actualizaciones parciales.
2. Ampliar la interfaz `MedicalCertificateRepository` en la capa `domain` agregando el método `update(id, data)`.
3. Implementar `UpdateMedicalCertificateUseCase` en la capa `application` realizando el merge de los datos existentes con los nuevos.
4. Integrar en el caso de uso la validación mediante `MedicalCertificateValidator` para asegurar que el estado final del certificado sea consistente.
5. Implementar el método `update` en `PostgresMedicalCertificateRepository` utilizando `prisma.medicalCertificate.update`.
6. Crear el método `update` en MedicalCertificateController para manejar el verbo PATCH y registrar la ruta en el router de la aplicación.
7. Añadir el método `update` al servicio de certificados en el frontend y conectar la acción al modal de edición en la interfaz de usuario.


## Observaciones Adicionales

- Merge de Datos: El Use Case debe recuperar el objeto original para comparar fechas si solo se envía una de ellas en el PATCH, evitando así que la validación falle por datos incompletos.

- Inmutabilidad: Se ha decidido que el member_id sea inmutable tras la creación para prevenir errores de auditoría; si un certificado se asignó al socio equivocado, debe eliminarse (baja lógica) y crearse uno nuevo.