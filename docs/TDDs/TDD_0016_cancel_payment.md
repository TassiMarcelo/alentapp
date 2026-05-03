---
id: 0016
estado: Propuesto
autor: Abel Di Bella
fecha: 2026-05-02
titulo: Cancelación de Pagos
---

# TDD-0016: Cancelación de Pagos

## 1. Contexto de Negocio (PRD)

### Objetivo

Permitir anular un pago sin eliminarlo del sistema, garantizando la trazabilidad de la información y cumpliendo con reglas de auditoría financiera.

### User Persona

* **Nombre**: Alberto (Tesorero)
* **Descripción**: Responsable de la gestión financiera del club. Necesita anular pagos registrados por error sin perder el historial, asegurando que la información siga siendo consistente y auditable.

### Criterios de Aceptación

* No se permite eliminar pagos del sistema
* El sistema debe cambiar el estado del pago a **Cancelado**
* No se puede cancelar un pago que ya esté cancelado
* No se puede cancelar un pago en estado **Pagado**
* El pago debe existir
* El socio asociado debe existir

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

**Endpoint:** `PATCH /api/v1/payments/:id/cancel`

**Request:** (No requiere body)

```json
{}
```

**Response:**

```json
{
  "id": "uuid",
  "estado": "Cancelado"
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

### 3.1 Repository (Puerto)

```ts
export interface PaymentRepository {
  findById(id: string): Promise<Payment | null>;
  update(payment: Payment): Promise<Payment>;
}
```

---

### 3.2 Lógica del Caso de Uso

1. Validar ID de entrada
2. Buscar el pago por ID
3. Si no existe, retornar error
4. Verificar que el socio asociado exista
5. Validar que el estado no sea **Pagado**
6. Validar que el estado no sea **Cancelado**
7. Cambiar estado a **Cancelado**
8. Persistir en base de datos

---

## 4. Casos de Borde y Manejo de Errores

| Escenario              | Resultado | Código |
| ---------------------- | --------- | ------ |
| Pago inexistente       | Error     | 404    |
| Socio inexistente      | Error     | 404    |
| Pago ya cancelado      | Error     | 400    |
| Pago ya realizado      | Error     | 400    |
| Error de base de datos | Error     | 500    |

---

## 5. Plan de Implementación

1. Definir/actualizar el puerto en el dominio:
   * `PaymentRepository` con métodos `findById` y `update`
2. Implementar el repositorio en infraestructura:
   * Acceso a base de datos mediante Prisma
   * Implementación de los métodos `findById` y `update`
3. Implementar el caso de uso `CancelPaymentUseCase`:
   * Validar ID de entrada
   * Buscar el pago por ID
   * Verificar que el pago exista
   * Verificar que el socio asociado exista
   * Validar que el estado no sea `Pagado`
   * Validar que el estado no sea `Cancelado`
   * Cambiar el estado a `Cancelado`
4. Persistir el cambio en la base de datos mediante el repositorio
5. Exponer el endpoint en `PaymentController`:
   * `PATCH /api/v1/payments/:id/cancel`
   * Manejo de errores y códigos HTTP
6. Validar reglas de negocio:
   * No se permite eliminar pagos (solo cancelarlos)
   * No se puede cancelar un pago ya pagado
   * No se puede cancelar un pago ya cancelado
7. Probar el flujo completo:
   * Cancelación exitosa
   * Error por pago inexistente
   * Error por estado inválido (Pagado o Cancelado)
   * Error por socio inexistente
   * Error de infraestructura (DB)

---

## 6. Observaciones

* No se permite la eliminación física de pagos (principio de trazabilidad)
* La cancelación es una operación lógica mediante cambio de estado
* El estado **Vencido** no se persiste, se calcula dinámicamente según la fecha de vencimiento
* Se mantiene coherencia con reglas de negocio financieras reales
