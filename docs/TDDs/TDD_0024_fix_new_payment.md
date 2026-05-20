---
id: 0024
estado: Aprobado
autor: Abel Di Bella
fecha: 2026-05-19
titulo: Corrección de Validaciones en Registro de Nuevos Pagos
---

# TDD-0024: Corrección de Validaciones en Registro de Nuevos Pagos

## 1. Contexto de Negocio (PRD)

### Objetivo

Incorporar validaciones adicionales al registro de pagos para garantizar integridad temporal y consistencia de los datos ingresados.

### User Persona

* **Nombre**: Alberto (Tesorero)
* **Descripción**: Responsable de registrar cuotas y obligaciones de pago de los socios. Necesita asegurar que los períodos de referencia ingresados sean válidos.


### Criterios de Aceptación

* El mes de referencia debe estar entre 1 y 12
* El año de referencia debe estar entre 2026 y 2036
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
  "fechaVencimiento": "2026-05-20"
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

### 2.3 Validaciones Incorporadas


#### Validación de Mes de Referencia

El mes de referencia debe ser un entero positivo entre 1 y 12.

```ts
if (
    !Number.isInteger(data.mesReferencia) ||
    data.mesReferencia < 1 ||
    data.mesReferencia > 12
) {
    throw new Error('400: Mes de referencia inválido');
}
```

---

#### Validación de Año de Referencia

El año de referencia debe ser un entero positivo entre 2026 y 2036.

```ts
if (
    !Number.isInteger(data.anioReferencia) ||
    data.anioReferencia < 2026 ||
    data.anioReferencia > 2036
) {
    throw new Error('400: Año de referencia inválido');
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

1. Validar datos de entrada
2. Validar mes de referencia
3. Validar año de referencia
4. Verificar que el socio exista
5. Verificar duplicados
6. Validar monto > 0
7. Crear con estado Pendiente
8. Persistir

---

## 4. Casos de Borde y Manejo de Errores

| Escenario                          | Código |
| ---------------------------------- | ------ |
| Duplicado                          | 409    |
| Socio inexistente                  | 404    |
| Monto inválido                     | 400    |
| Mes de referencia inválido         | 400    |
| Año de referencia inválido         | 400    |
| Error DB                           | 500    |

---

## 5. Plan de Implementación

1. Incorporar validación de rango para `mesReferencia`.
2. Incorporar validación de rango para `anioReferencia`.
3. Mantener las validaciones existentes:
   * Unicidad por socio/período
   * Existencia del socio
   * Monto mayor a 0
4. Mantener la creación inicial con estado `Pendiente`.
5. Actualizar manejo de errores HTTP en `PaymentController`.
6. Probar escenarios válidos e inválidos.

---

## 6. Observaciones

* Se restringen los períodos válidos para evitar inconsistencias futuras.