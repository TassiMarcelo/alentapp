# Contributing Guide

La idea es mantener consistencia en el código, historial de cambios y proceso de revisión.

---

## Flujo de trabajo

### 1. Crear una rama

Nunca trabajar directamente sobre main.

Crear una rama descriptiva:

bash
git checkout -b feature/locker-assignment


Ejemplos:

bash
feature/member-registration
feature/payment-validation
fix/locker-release-bug
docs/github-guidelines


---

## Desarrollo

Realizá los cambios necesarios en tu rama.

Antes de commitear, asegurate de que:

- El proyecto compile correctamente.
- Los tests pasen.
- No haya archivos temporales o innecesarios.
- La documentación esté actualizada si corresponde.

---

## Convención de commits

Este proyecto utiliza *Commitlint + Husky* para validar automáticamente los mensajes de commit.

Formato obligatorio:

txt
type(scope): description


Ejemplo:

bash
feat(locker): add locker assignment validation


---

### Tipos permitidos

| Tipo | Uso |
|------|-----|
| feat | Nueva funcionalidad |
| fix | Corrección de errores |
| docs | Cambios en documentación |
| chore | Tareas de mantenimiento |
| refactor | Refactor sin cambiar comportamiento |

---

### Scopes permitidos

| Scope |
|-------|
| member |
| payment |
| medical-certificate |
| locker |
| sport |
| discipline |
| github |
| deps |
| release |
---

### Reglas

Los commits deben cumplir:

- Tener type
- Tener scope
- Descripción en minúscula
- Máximo 100 caracteres
- Seguir formato Conventional Commits

---

### Ejemplos válidos

bash
feat(locker): crear endpoint para asignación de lockers
fix(member): validar dni duplicado
docs(github): actualizar guía de contribución
chore(deps): actualizar versión de playwright
refactor(discipline): simplificar lógica del repositorio


---

### Ejemplos inválidos

bash
feat: create locker endpoint
Feat(locker): create locker endpoint
feat(auth): add login
fix(locker): Fix assignment bug
random changes


---



## Push de cambios

Subir la rama:

bash
git push origin nombre-de-tu-rama


Ejemplo:

bash
git push origin feature/locker-assignment


---

## Pull Requests

Al abrir un Pull Request:

- Explicar claramente qué se cambió
- Referenciar issue si existe
- Verificar que CI pase correctamente
- Solicitar revisión

---

## Revisión de código

Antes de aprobar un PR revisar:

- Correctitud funcional
- Legibilidad
- Convenciones del proyecto
- Posibles bugs

---

## Notas

- No hacer push directo a main
- Mantener PRs pequeños y enfocados
- Evitar commits genéricos como:

bash
changes
fix stuff
update
misc


---

Gracias por colaborar.