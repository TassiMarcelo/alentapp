---
id: 0026
estado: Aprobado
autor: Abel Di Bella
fecha: 2026-07-08
titulo: Corrección de validaciones en la entidad Payment
---

# TDD-0026: Corrección de validaciones en la entidad Payment

## 1. Contexto de Negocio (PRD)

### Objetivo

Incorporar las validaciones de las reglas de negocio en PaymentValidator, siguiendo la arquitectura hexagonal del proyecto.


### User Persona

* **Nombre**: Alberto (Tesorero)
* **Descripción**: Responsable de registrar cuotas y obligaciones de pago de los socios. Necesita que se validen las reglas de negocio de la entidad Payment.


### Criterios de Aceptación

* Las validaciones se realizan en la capa de dominio.

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

Las validaciones se realizaban en la capa de aplicacion, ahora se realizan en la capa de dominio. 

---

## 3. Casos de Borde y Manejo de Errores

| Escenario                          | Código |
| ---------------------------------- | ------ |
| Duplicado                          | 409    |
| Socio inexistente                  | 404    |
| Monto inválido                     | 400    |
| Mes de referencia inválido         | 400    |
| Año de referencia inválido         | 400    |
| Error DB                           | 500    |

---

## 4. Plan de Implementación

1. Crear el PaymentValidator.
2. Agregar las validaciones de las reglas de negocio.
3. Eliminar las validaciones que se realizan en los casos de uso.

