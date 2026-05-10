---
id: 0012
estado: Aprobado
autor: Alejandro Llontop
fecha: 2026-05-01
titulo: Actualización de Catálogo de Deportes
---

# TDD-0002: Actualización de Catálogo de Deportes

## Contexto de Negocio (PRD)

### Objetivo

Permitir que un administrativo corrija o modifique la información de los deportes existentes, garantizando que el nombre permanezca inalterado y que cualquier cambio en el cupo no afecte la integridad de los socios ya inscriptos.

### User Persona
*   **Nombre**: Administrativo
*   **Necesidad**: Ajustar la disponibilidad y los detalles de los deportes activos, garantizando que el cupo máximo nunca sea inferior a la cantidad de socios ya inscriptos

### Criterios de Aceptación
- El sistema debe permitir únicamente la edición de los campos descripción y cupo.
- El sistema debe bloquear cualquier intento de modificar el atributo nombre, ya que es inmutable tras la creación.
- El sistema debe validar que el nuevo cupo sea un número entero mayor a cero.
- El sistema debe impedir la actualización si el nuevo cupo es inferior a la cantidad de socios vinculados actualmente a ese deporte.

## Diseño Técnico (RFC)

### Contrato de API (@alentapp/shared)
[Definición de endpoints y tipos compartidos.]
*   **Endpoint**: `PUT /api/v1/sports/:id`
*   **Request Body (UpdateSportRequest)**:
```ts
{
    descripcion?: string;
    cupoMaximo?: number;

}
```

### Componentes de Arquitectura Hexagonal

1. Puerto: SportRepository (Método update(id, data)).

2. Servicio de Dominio: SportValidator (Encargado de reutilizar validaciones de cupoMaximo).
3. Caso de Uso: UpdateSportUseCase (Coordina la operación y llama al validador antes de confirmar los cambios).
4. Adaptador de Salida: SportRepository (Ejecuta el update en Prisma).
5. Adaptador de Entrada: SportController (Ruta HTTP que extrae el id de la URL y mapea excepciones a códigos HTTP).

## Casos de Borde y Errores

| Escenario                  | Resultado Esperado                            | Código HTTP               |
| -------------------------- | --------------------------------------------- | ------------------------- |
| Cupo menor a inscriptos       | Mensaje: "No se puede reducir el cupo por debajo de los [X] socios ya inscriptos"   | 400 Bad Request              |
| Intento de cambiar nombre     | Mensaje: "El nombre del deporte no es modificable"   | 400 Bad Request           |
| Recurso inexistente   | Mensaje: "El deporte solicitado no existe"   | 404 Not Found           |
| Capacidad igual a cero      | Mensaje: "El cupo debe ser mayor a cero"   | 400 Bad Request |

## Plan de Implementación
1. Actualizar las interfaces en el paquete @alentapp/shared (UpdateSportRequest) incluyendo solo descripcion y cupoMaximo.
2. Ampliar el SportRepository con el método update para persistir los cambios en la base de datos.
3. Implementar la lógica en UpdateSportUseCase utilizando el SportValidator para asegurar que el nuevo cupo sea válido y coherente.
4. Crear la ruta PUT en el controlador y enlazarla a la aplicación de la infraestructura.
5. Consumir el endpoint desde el Frontend, reutilizando el formulario de alta pero manteniendo el campo nombre como solo lectura.
