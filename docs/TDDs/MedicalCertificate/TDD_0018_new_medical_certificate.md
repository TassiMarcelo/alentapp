---
id: 0018
estado: Pendiente
autor: Delozano Matias
fecha: 2026-05-03
titulo: Alta de Certificado Médico
---

# TDD-0018: Alta de Certificado Médico

## Contexto de Negocio (PRD)

### Objetivo

Permitir el registro digital de los aptos físicos (certificados médicos) de los socios, para asegurar que el club cuente con registros vigentes y centralizados, garantizando que el sistema mantenga un historial clínico del socio, pero asegurando que solo el certificado más reciente sea considerado como válido para las actividades del club.

### User Persona

- **Nombre**: Alberto (Tesorero/Administrativo).
- **Necesidad**: Cargar los certificados físicos que traen los socios de forma rápida y segura, garantizando que nunca queden dos certificados vigentes para el mismo socio. El sistema debe gestionar automáticamente la vigencia para que cuando un socio renueva su apto médico anual, el certificado anterior quede invalido automáticamente.

### Criterios de Aceptación

- El sistema debe permitir registrar la fecha de emisión, la fecha de vencimiento y la matrícula del médico.
- Solo puede haber un certificado activo (`is_validated: true`) por socio.
- Al finalizar la carga de un nuevo certificado, el sistema debe buscar certificados previos del mismo socio e invalidarlos (setear `is_validated: false`) de forma automática.
- El sistema debe validar que `expiry_date` sea estrictamente posterior a `issue_date`.
- El sistema debe validar que el socio referenciado por `member_id` exista en la base de datos.

## Diseño Técnico (RFC)

### Modelo de Dominio (Entidad)

Interfaz TypeScript pura que representa la entidad en la capa de **Domain**:

* `id`: UUID — Identificador único universal.
* `issue_date`: Date — Fecha de emisión del certificado.
* `expiry_date`: Date — Fecha de vencimiento.
* `doctor_license`: String — Matrícula del profesional médico.
* `is_validated`: Boolean — Estado de vigencia del apto.
* `member_id`: String — Relación con el socio.

### Contrato de API (@alentapp/shared)

Definición de tipos compartidos para asegurar la consistencia entre Frontend y Backend:

* **Endpoint**: `POST /api/v1/medical-certificates`
* **Request Body**:
```ts
export interface CreateMedicalCertificateRequest {
  issueDate: string;
  expiryDate: string;     
  doctorLicense: string;
  memberId: string;
}
```

### Componentes de Arquitectura Hexagonal

- **Domain**: Interfaz `MedicalCertificateRepository` (puerto de salida) con método `invalidateAllByMemberId`. Servicio `MedicalCertificateValidator` con método `validateDates(issue: Date, expiry: Date)` que lanza excepción si `expiry <= issue`.

- **Application**: `CreateMedicalCertificateUseCase` — invoca `MedicalCertificateValidator.validateDates`, verifica existencia del socio vía `MemberRepository.findById`, ejecuta la invalidación de registros previos y delega la persistencia del nuevo a `MedicalCertificateRepository.save`.

- **Infrastructure**: `PostgresMedicalCertificateRepository` implementa `MedicalCertificateRepository` usando Prisma. `MedicalCertificateController` expone el endpoint y mapea excepciones a códigos HTTP.



## Casos de Borde y Errores

| Escenario                        | Resultado Esperado                                              | Código HTTP               |
| -------------------------------- | --------------------------------------------------------------- | ------------------------- |
| `Datos faltantes`    |"Los campos issueDate, expiryDate, doctorLicense y memberId son obligatorios"| 400 Bad Request           |
| `Vencimiento inválido`           |"La expiryDate debe ser estrictamente posterior a issueDate"     | 400 Bad Request           |
| `Certificado caduco` |"No se puede registrar un certificado cuya fecha sea anterior a la fecha actual."| 400 Bad Request |
| `Socio inexistente`              | Error de validación: "Socio no encontrado"                      | 404 Not Found             |
| Error de conexión a DB           | "Error interno, reintente más tarde"                            | 500 Internal Server Error |


## Plan de Implementación

1. Definir el modelo `MedicalCertificate` en `schema.prisma` y generar la migración de base de datos.
2. Definir la interfaz `CreateMedicalCertificateRequest en `@alentapp/shared`.
3. Crear la interfaz `MedicalCertificateRepository` y el servicio `MedicalCertificateValidator` en la capa `domain`.
4. Implementar `CreateMedicalCertificateUseCase` en la capa `application` incluyendo la lógica de invalidación automática.
5. Implementar `PostgresMedicalCertificateRepository` en la capa `infrastructure` usando transacciones de Prisma.
6. Crear `MedicalCertificateController` con el método `create` y registrar la ruta en la aplicación.
7. Añadir el servicio HTTP en el frontend y conectar el formulario de alta de certificados.


## Observaciones Adicionales

- Invalidación Automática: Se prefiere el uso de transacciones de base de datos ($transaction en Prisma) para asegurar que un socio nunca quede con dos certificados válidos si el proceso falla a la mitad.

- Validación de fechas: Se utilizará date-fns para manejar correctamente las comparaciones y evitar problemas de zonas horarias al recibir los strings ISO desde el frontend.
