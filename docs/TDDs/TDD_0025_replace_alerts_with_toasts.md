---
id: 0025
estado: Propuesto
autor: Mateo Lafalce
fecha: 2026-05-20
titulo: Reemplazar alert() del navegador por sistema de toasts (Chakra UI)
---

# TDD-0025: Reemplazar `alert()` del navegador por sistema de toasts

## 1. Contexto de Negocio (PRD)

### Objetivo

Reemplazar los diálogos `window.alert()` usados actualmente para reportar errores y validaciones en las vistas del paquete `web` por un sistema de notificaciones (toasts) consistente, no bloqueante y alineado al sistema de diseño de la aplicación (Chakra UI v3).

Los `alert()` interrumpen el flujo del usuario, bloquean el hilo principal del navegador, no son testeables de manera ergonómica y rompen visualmente con el resto de la interfaz.

### User Persona

* **Nombre**: Cualquier usuario interno de la aplicación (Tesorero, Administrador, Recepción).
* **Necesidad**: Recibir retroalimentación clara sobre el resultado de sus acciones (éxito o error) sin que la interacción se vea interrumpida por un diálogo modal del navegador.

### Criterios de Aceptación

* No quedan llamadas a `window.alert(` ni `alert(` en `packages/web/src/views/`.
* Toda notificación de error de operación CRUD se muestra como toast con tipo `error`.
* Las validaciones de formulario en cliente (ej. monto ≤ 0) se muestran como toast con tipo `warning`.
* Las operaciones exitosas (crear/actualizar/eliminar) muestran un toast `success` con mensaje descriptivo.
* El sistema de toasts es accesible desde cualquier vista vía un único helper compartido.
* El toaster se monta una sola vez a nivel raíz de la aplicación.
* Los toasts desaparecen automáticamente después de un timeout (default 4s para success/info, 6s para error/warning) y permiten cierre manual.

---

## 2. Diseño Técnico (RFC)

### 2.1 Librería

Se utiliza el sistema de toaster nativo de **Chakra UI v3** (`createToaster` + componente `<Toaster />`), ya disponible en el proyecto. No se introducen nuevas dependencias.

### 2.2 Estructura de archivos

```
packages/web/src/
├── components/
│   └── ui/
│       └── toaster.tsx          # NUEVO — toaster global + helper notify
├── Layout.tsx                   # MODIFICADO — monta <Toaster />
└── views/
    ├── Sports.tsx               # MODIFICADO — reemplaza alert por notify
    ├── payments.tsx             # MODIFICADO
    ├── Lockers.tsx              # MODIFICADO
    ├── Members.tsx              # MODIFICADO
    ├── MedicalCertificates.tsx  # MODIFICADO
    └── Disciplines.tsx          # MODIFICADO
```

### 2.3 API del helper

```ts
// packages/web/src/components/ui/toaster.tsx
import { createToaster } from '@chakra-ui/react';

export const toaster = createToaster({
  placement: 'top-end',
  pauseOnPageIdle: true,
});

export const notify = {
  success: (description: string, title = 'Éxito') =>
    toaster.create({ title, description, type: 'success', duration: 4000 }),
  error: (description: string, title = 'Error') =>
    toaster.create({ title, description, type: 'error', duration: 6000 }),
  warning: (description: string, title = 'Atención') =>
    toaster.create({ title, description, type: 'warning', duration: 6000 }),
  info: (description: string, title?: string) =>
    toaster.create({ title, description, type: 'info', duration: 4000 }),
};
```

### 2.4 Montaje del Toaster

`Layout.tsx` renderiza `<Toaster />` una sola vez al final del árbol, de modo que cualquier vista puede invocar `notify.*` sin más wiring.

### 2.5 Mapeo de reemplazos

| Origen actual                                            | Reemplazo                                       |
| -------------------------------------------------------- | ----------------------------------------------- |
| `alert(err.message \|\| 'Error al X')` dentro de `catch` | `notify.error(err.message \|\| 'Error al X')`   |
| Validación cliente (ej. `'El monto debe ser mayor a 0'`) | `notify.warning(...)`                           |
| Placeholder `'Funcionalidad ... en desarrollo'`          | `notify.info(...)`                              |
| Éxito implícito (no había alert)                         | `notify.success(...)` opcional (no obligatorio) |

---

## 3. Casos de Borde

| Escenario                                              | Resultado esperado                                                              |
| ------------------------------------------------------ | ------------------------------------------------------------------------------- |
| `err.message` indefinido                               | Toast con mensaje por defecto (igual que la lógica `\|\|` existente)            |
| Múltiples errores en rápida sucesión                   | Chakra encola y muestra los toasts uno tras otro                                |
| Vista desmontada antes del timeout                     | El toaster vive en el árbol raíz, sigue funcionando sin warnings de React      |
| Usuario en pestaña inactiva                            | `pauseOnPageIdle: true` evita que los toasts se descarten en background        |

---

## 4. Plan de Implementación

1. Crear `packages/web/src/components/ui/toaster.tsx` con el toaster y helper `notify`.
2. Modificar `Layout.tsx` para renderizar `<Toaster />`.
3. Reemplazar cada `alert(...)` por `notify.error/warning/info(...)` en las 6 vistas listadas.
4. Verificar que no quedan llamadas `alert(` con `grep -r "alert(" packages/web/src/`.
5. Ejecutar `npm run build` y pruebas existentes para confirmar que no hay regresiones.
6. Validación manual: provocar un error CRUD en cada vista y confirmar que aparece el toast esperado.

---

## 5. Observaciones

* El alcance se limita al paquete `web`. El backend no se modifica.
* No se reemplazan los `confirm()` (si los hubiera) — quedan fuera de este TDD.
* La adición de toasts de éxito en cada operación queda como mejora opcional y no es bloqueante para cerrar el TDD.
