---
id: 0015
estado: Propuesto
autor: Abel Di Bella
fecha: 2026-05-02
titulo: Actualización de Pagos
---

# TDD-0015: Actualización de Pagos

## 1. Contexto de Negocio (PRD)

### Objetivo

Permitir corregir datos de pagos pendientes sin afectar pagos cerrados.

### User Persona

* **Nombre**: Alberto (Tesorero)
* **Descripción**: Responsable de la gestión financiera del club. Necesita corregir errores en los registros de pagos de manera rápida y segura, sin comprometer la integridad de la información ni modificar pagos ya procesados.

### Criterios de Aceptación

* Solo estado **Pendiente**
* No modificar Pagado/Cancelado
* Validar monto
* Validar socio existente

---

## 2. Diseño Técnico (RFC)

### 2.1 Modelo de Dominio (TypeScript)

```ts
export interface Payment {
  id: string;
  memberId: string;
  monto: number;
  mesReferencia: number;
  anioReferencia: number;
  fechaVencimiento: Date;
  estado: 'Pendiente' | 'Pagado' | 'Cancelado';
  fechaPago?: Date;
  created_at: string;
}
```

---

### 2.2 Contrato de API

**PUT /api/v1/payments/:id**

**Request**

```json
{
  "monto": 1500
}
```

**Response**

```json
{
  "id": "uuid",
  "estado": "Pendiente"
}
```

---

### 2.3 Esquema de Persistencia (Prisma)

```prisma
model Payment {
  id               String    @id @default(uuid())
  memberId         String
  monto            Float
  mesReferencia    Int
  anioReferencia   Int
  fechaVencimiento DateTime
  estado           String
  fechaPago        DateTime?
  created_at       DateTime  @default(now())

  @@unique([memberId, mesReferencia, anioReferencia])
}
```

---

## 3. Arquitectura y Flujo

1. Validar datos
2. Buscar pago
3. Verificar socio
4. Validar estado Pendiente
5. Aplicar cambios
6. Persistir

---

## 4. Casos de Borde y Manejo de Errores

| Escenario         | Código |
| ----------------- | ------ |
| No existe         | 404    |
| Estado inválido   | 400    |
| Socio inexistente | 404    |
| Error DB          | 500    |

---

## 5. Plan de Implementación

1. Definir el tipo `UpdatePaymentRequest` en `@alentapp/shared`:
   * Campos opcionales (`monto`, `fechaVencimiento`)
2. Definir/actualizar el puerto en el dominio:
   * `PaymentRepository` con métodos `findById` y `update`
3. Implementar el repositorio en infraestructura:
   * Acceso a base de datos con Prisma
   * Implementación de `findById` y `update`
4. Implementar el caso de uso `UpdatePaymentUseCase`:
   * Validar datos de entrada
   * Buscar el pago por ID
   * Verificar que el pago exista
   * Verificar que el socio asociado exista
   * Validar que el estado sea `Pendiente`
   * Validar monto > 0 (si se envía)
   * Validar fecha de vencimiento (si se envía)
   * Aplicar cambios
5. Persistir los cambios en base de datos mediante el repositorio
6. Exponer el endpoint en `PaymentController`:
   * `PUT /api/v1/payments/:id`
   * Manejo de errores y códigos HTTP
7. Validar reglas de negocio:
   * No modificar pagos en estado `Pagado`
   * No modificar pagos en estado `Cancelado`
8. Probar el flujo completo:
   * Actualización exitosa
   * Error por pago inexistente
   * Error por estado inválido
   * Error por socio inexistente
   * Error por datos inválidos

---

## 6. Observaciones

* No se modifican pagos cerrados
* Estado vencido es calculado dinámicamente
