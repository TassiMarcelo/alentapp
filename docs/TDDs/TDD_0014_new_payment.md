---
id: 0014
estado: Aprobado
autor: Abel Di Bella
fecha: 2026-05-13
titulo: Registro de Nuevos Pagos
---

# TDD-0014: Registro de Nuevos Pagos

## 1. Contexto de Negocio (PRD)

### Objetivo

Registrar una nueva obligación de pago para un socio, garantizando integridad y evitando duplicaciones.

### User Persona

* **Nombre**: Alberto (Tesorero)
* **Descripción**: Responsable de registrar los pagos realizados por los socios. Necesita registrar cuotas sin errores.


### Criterios de Aceptación

* No debe existir más de un pago por socio/mes/año
* El estado inicial debe ser **Pendiente**
* El monto debe ser mayor a 0
* El socio debe existir

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
  created_at: Date;
}
```

---

### 2.2 Contrato de API

**POST /api/v1/payments**

**Request**

```json
{
  "memberId": "string",
  "monto": 1000,
  "mesReferencia": 4,
  "anioReferencia": 2026,
  "fechaVencimiento": "2026-05-03"
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

### 3.1 Repository

```ts
export interface PaymentRepository {
  create(payment: Payment): Promise<Payment>;
  findByMemberAndPeriod(memberId: string, mes: number, anio: number): Promise<Payment | null>;
}
```

---

### 3.2 Lógica del Caso de Uso

1. Validar datos
2. Verificar que el socio exista
3. Verificar duplicados
4. Validar monto > 0
5. Crear con estado Pendiente
6. Persistir

---

## 4. Casos de Borde y Manejo de Errores

| Escenario         | Código |
| ----------------- | ------ |
| Duplicado         | 409    |
| Socio inexistente | 404    |
| Monto inválido    | 400    |
| Error DB          | 500    |

---

## 5. Plan de Implementación

1. Definir el esquema de persistencia para `Payment` en Prisma y ejecutar la migración.
2. Crear los tipos en `@alentapp/shared`:
   * `PaymentDTO`
   * `CreatePaymentRequest`
3. Definir el puerto en el dominio:
   * `PaymentRepository` con métodos `create` y `findByMemberAndPeriod`
4. Implementar el repositorio en infraestructura:
   * Conexión a base de datos mediante Prisma
   * Implementación de los métodos definidos en el puerto
5. Implementar el caso de uso `CreatePaymentUseCase`:
   * Validar datos de entrada
   * Verificar que el socio exista
   * Validar que no exista un pago duplicado (idempotencia)
   * Validar monto mayor a 0
   * Crear el pago con estado `Pendiente`
6. Exponer el endpoint en `PaymentController`:
   * `POST /api/v1/payments`
   * Manejo de errores y códigos HTTP
7. Validar reglas de negocio:
   * Unicidad por `memberId + mes + año`
   * Integridad referencial (el socio debe existir)
8. Probar el flujo completo:
   * Creación exitosa
   * Error por duplicado
   * Error por socio inexistente
   * Error por datos inválidos

---

## 6. Observaciones

* Se garantiza idempotencia mediante restricción única.
* El pago se crea con estado **Pendiente**.
* El atributo memberId es una foreign key.