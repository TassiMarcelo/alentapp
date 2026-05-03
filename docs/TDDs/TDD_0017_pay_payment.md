---
id: 0017
estado: Propuesto
autor: Abel Di Bella
fecha: 2026-05-02
titulo: Registro de Pago (Marcar como Pagado)
---

# TDD-0017: Registro de Pago

## 1. Contexto de Negocio (PRD)

### Objetivo

Permitir registrar el pago de una cuota pendiente, actualizando su estado y almacenando la fecha en que se realizó el pago.

### User Persona

* **Nombre**: Alberto (Tesorero)
* **Descripción**: Responsable de registrar los pagos realizados por los socios. Necesita actualizar el estado de las cuotas de manera precisa para reflejar correctamente la situación financiera.

### Criterios de Aceptación

* Solo se pueden registrar pagos sobre cuotas en estado **Pendiente**
* El sistema debe cambiar el estado a **Pagado**
* Se debe registrar la **fecha de pago**
* No se puede pagar una cuota ya pagada
* No se puede pagar una cuota cancelada
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

**Endpoint:** `PATCH /api/v1/payments/:id/pay`

**Request:**

```json
{
  "fechaPago": "2026-05-03"
}
```

**Response:**

```json
{
  "id": "uuid",
  "estado": "Pagado",
  "fechaPago": "2026-05-03"
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
5. Validar que el estado sea **Pendiente**
6. Validar que no esté en estado **Pagado**
7. Validar que no esté en estado **Cancelado**
8. Registrar la fecha de pago
9. Cambiar estado a **Pagado**
10. Persistir en base de datos

---

## 4. Casos de Borde y Manejo de Errores

| Escenario              | Resultado | Código |
| ---------------------- | --------- | ------ |
| Pago inexistente       | Error     | 404    |
| Socio inexistente      | Error     | 404    |
| Pago ya realizado      | Error     | 400    |
| Pago cancelado         | Error     | 400    |
| Fecha inválida         | Error     | 400    |
| Error de base de datos | Error     | 500    |

---

## 5. Plan de Implementación

1. Definir el tipo `PayPaymentRequest` en `@alentapp/shared`:
   * Campo `fechaPago` (obligatorio)
2. Definir/actualizar el puerto en el dominio:
   * `PaymentRepository` con métodos `findById` y `update`
3. Implementar el repositorio en infraestructura:
   * Acceso a base de datos mediante Prisma
   * Implementación de los métodos `findById` y `update`
4. Implementar el caso de uso `PayPaymentUseCase`:
   * Validar ID de entrada
   * Validar datos de entrada (`fechaPago`)
   * Buscar el pago por ID
   * Verificar que el pago exista
   * Verificar que el socio asociado exista
   * Validar que el estado sea `Pendiente`
   * Validar que no esté en estado `Pagado`
   * Validar que no esté en estado `Cancelado`
   * Registrar la fecha de pago
   * Cambiar el estado a `Pagado`
5. Persistir el cambio en la base de datos mediante el repositorio
6. Exponer el endpoint en `PaymentController`:
   * `PATCH /api/v1/payments/:id/pay`
   * Manejo de errores y códigos HTTP
7. Validar reglas de negocio:
   * Solo se pueden pagar cuotas en estado `Pendiente`
   * No se puede pagar una cuota ya pagada
   * No se puede pagar una cuota cancelada
   * Se debe registrar la fecha efectiva del pago
8. Probar el flujo completo:
   * Pago exitoso
   * Error por pago inexistente
   * Error por estado inválido (Pagado o Cancelado)
   * Error por fecha inválida
   * Error por socio inexistente
   * Error de infraestructura (DB)

---

## 6. Observaciones

* El pago es una operación irreversible desde el punto de vista del estado
* Se registra la fecha efectiva del pago para auditoría
* El estado **Vencido** no se persiste, se calcula dinámicamente según la fecha de vencimiento
* Se mantiene coherencia con reglas de negocio financieras reales
