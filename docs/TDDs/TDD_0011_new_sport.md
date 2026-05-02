---
id: 0011
estado: Propuesto
autor: Alejandro Llontop
fecha: 2026-05-01
titulo: Registro de Catálogo de Deportes
---

# TDD-0001: Registro de Catálogo de Deportes

## Contexto de Negocio (PRD)

### Objetivo

Digitalizar la oferta de actividades del club, permitiendo que un administrativo dé de alta un deporte con sus reglas específicas y cupos limitados, asegurando que ninguna actividad supere su capacidad máxima operativa.

### User Persona
*   **Nombre**: Administrativo
*   **Necesidad**: Necesita dar de alta deportes, y controlar que el cupo máximo sea coherente con las inscripciones existentes.

### Criterios de Aceptación
- El sistema debe validar que el nombre del deporte sea    único y no esté vacío.
- El sistema debe validar que el atributo cupoMaximo sea mayor a cero.
- Una vez creado el registro, el atributo nombre debe ser inmutable (no se permite su edición).
- Al finalizar el alta, el sistema debe mostrar un mensaje de éxito y limpiar el formulario.

## Diseño Técnico (RFC)

### Modelo de Datos
Se definirá la entidad `Sport` con las siguientes propiedades y restricciones:

- `id`: Identificador único universal (UUID).
- `nombre`: Cadena de texto, único e inmutable tras su creación.
- `descripcion`: Cadena de texto .
- `cupoMaximo`: Número entero > 0.
- `precioAdicional`: Valor numérico decimal (float) para cargos extra por el deporte.
- `esFederado`: Valor booleano que indica si el deporte requiere afiliación federativa.
- `requires_medical_certificate`: Valor booleano que indica si el deporte requiere certificado médico.
- `estado`: Enumeración (`ACTIVO` | `INACTIVO`).
 

### Contrato de API (@alentapp/shared)
[Definición de endpoints y tipos compartidos.]
*   **Endpoint**: `POST /api/v1/sports`
*   **Request Body**:
```ts
{
    nombre: string;
    descripcion: string;
    cupoMaximo: number;
    precioAdicional: number;
    esFederado: boolean;
    requires_medical_certificate: boolean;
    estado: 'ACTIVO' | 'INACTIVO';
    
}
```
*   **Response Body**:
```ts
{
    id: string;
    nombre: string;
    descripcion: string;
    cupoMaximo: number;
    precioAdicional: number;
    esFederado: boolean;
    requires_medical_certificate: boolean;
    estado: 'ACTIVO';

    enrollments: [];
}
```

### Componentes de Arquitectura Hexagonal

1. Puerto: SportRepository (Interface en el Dominio).
2. Caso de Uso: CreateSport (Lógica que verifica que el nombre sea único y que cupoMaximo sea válido antes de guardar).
3. Adaptador de Salida: SportRepository (Implementación real en BD).
4. Adaptador de Entrada: SportController (Ruta HTTP).

## Casos de Borde y Errores

| Escenario                  | Resultado Esperado                            | Código HTTP               |
| -------------------------- | --------------------------------------------- | ------------------------- |
| Nombre ya registrado         | Mensaje: "Ya existe un deporte con ese nombre"   | 409 Conflict              |
| Cupo maximo requerido      | Mensaje: "El cupo máximo debe ser mayor a cero"   | 400 Bad Request           |
| Faltan campos obligatorios   | Mensaje: "El nombre y la capacidad máxima son requeridos"   | 400 Bad Request           |
| Error de conexión a DB       | Mensaje: "Error interno, reintente más tarde"   | 500 Internal Server Error |

## Plan de Implementación
1. Definir el modelo Sport en el esquema de Prisma y correr la migración.
2. Crear los tipos/DTOs en el paquete shared y la interfaz del repositorio en el Dominio.
3. Implementar la lógica del caso de uso CreateSport.
4. Crear el formulario de carga en React y conectar con el controlador del backend.