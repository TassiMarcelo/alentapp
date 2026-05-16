# Team Charter — Alentapp

Este documento formaliza los acuerdos del equipo para el desarrollo del TP Integrador de
Ingeniería y Calidad de Software 2026. Su objetivo es que todos trabajemos de la misma
manera, reduzcamos fricciones y tengamos claras las expectativas desde el primer día.

---

## Integrantes y roles

| Nombre completo   | Legajo | Rol            | Entidad asignada     | GitHub           |
|-------------------|--------|----------------|----------------------|------------------|
| Marcelo Tassi     | 26980  | Coordinador/a  | Locker               | [@TassiMarcelo]  |
| Mateo Lafalce     | 33217  | Integrante     | Discipline           | [@mateolafalce]  |
| Alejandro Llontop | 31890  | Integrante     | Sport                | [@AleLlontop]    |
| Matias Delozano   | 27978  | Integrante     | MedicalCertificate   | [@MatiDelozano]  |
| Abel Di Bella     | 25619  | Integrante     | Payment              | [@abelrdb]       |

---

## Objetivo del equipo

Completar las actividades del TP Integrador 2026 cumpliendo con todos los criterios de
aprobación, aplicando buenas prácticas de ingeniería de software (feature branch workflow,
commits atómicos, revisión de código entre pares) y entregando en término.

---

## Canal de comunicación principal

- **Canal:** WhatsApp
- **Tiempo de respuesta esperado:** dentro de las 24 horas en días hábiles

---

## Acuerdos de trabajo

### Git y GitHub

- Nadie hace push directo a `main`. Todo entra por Pull Request.
- Nadie mergea su propio PR. El coordinador hace el merge final.
- No se hacen commits desde la interfaz web de GitHub.
- Los commits siguen la convención definida en [`CONTRIBUTING.md`](../docs/CONTRIBUTING.md).
- Las ramas se nombran con el formato `type/description` (ej: `feature/locker-assignment`).

### Reviews de código

- Cada PR requiere al menos **1 aprobación** antes del merge.
- Si el reviewer no puede revisar en 24 horas, avisa en el canal del grupo para que otro
  integrante tome el review.
- Los comentarios de review son técnicos y constructivos.

### Calidad del trabajo

- Ningún commit se mergea sin haber sido revisado y comentado por al menos un compañero.
- Los PRs deben ser pequeños y enfocados en un único cambio lógico.
- Antes de commitear: el proyecto compila, los tests pasan y no hay archivos innecesarios.

---

## Responsabilidades del coordinador

- Crear y mantener el repositorio (fork, colaboradores, branch protection).
- Coordinar el orden de merges para evitar conflictos.
- Resolver conflictos de integración cuando ocurran.
- Publicar la entrega en GitHub Discussions (Show and Tell).
- Ser el punto de contacto ante dudas de organización del equipo.

---

## Toma de decisiones

Las decisiones técnicas y de proceso se toman de la siguiente manera:

1. Se plantea la propuesta en el canal del grupo con argumentos concretos.
2. Se da un plazo de **24 horas** para que todos opinen.
3. Se decide por **mayoría simple** (3 de 5).
4. Si hay empate, el coordinador tiene voto de desempate.
5. Una vez tomada la decisión, todos la respetan y siguen adelante.

---

## Resolución de conflictos

Si hay un conflicto interpersonal o de proceso:

1. Las partes involucradas lo hablan directamente en privado.
2. Si no se resuelve, se lleva al canal del grupo.
3. El coordinador media y propone una solución.
4. Si persiste, se escala al docente de la materia.

---

## Estándares técnicos

Los estándares de commits, ramas y Pull Requests están definidos en
[`CONTRIBUTING.md`](../docs/CONTRIBUTING.md). Todos los integrantes se comprometen a seguirlos
sin excepciones.

Resumen de convenciones clave:

| Tipo       | Uso                                  |
|------------|--------------------------------------|
| `feat`     | Nueva funcionalidad                  |
| `fix`      | Corrección de errores                |
| `docs`     | Cambios en documentación             |
| `chore`    | Tareas de mantenimiento              |
| `refactor` | Refactor sin cambiar comportamiento  |

Formato obligatorio de commit:

```
type(scope): description
```

---

## Responsabilidades transversales

| Responsabilidad              | Responsable         |
|------------------------------|---------------------|
| Coordinación general y merge | [@TassiMarcelo]     |
| Entidad Discipline           | [@mateolafalce]     |
| Entidad Sport                | [@AleLlontop]       |
| Entidad MedicalCertificate   | [@MatiDelozano]     |
| Entidad Payment              | [@abelrdb]          |

---

## Definición de "terminado" (Definition of Done)

Un entregable se considera terminado cuando:

- [ ] El PR fue abierto con el template completo
- [ ] Al menos un compañero lo revisó y dejó comentarios
- [ ] El PR fue aprobado formalmente en GitHub
- [ ] El linter de commits (Commitlint + Husky) pasa sin errores
- [ ] El coordinador lo mergeó a `main`
- [ ] El `CHANGELOG.md` fue actualizado con la entrada correspondiente

---

**Fecha de creación:** 16/05/2026 — Revisado y acordado por todos los integrantes del grupo.
