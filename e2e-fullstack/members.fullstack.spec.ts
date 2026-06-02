import { test, expect } from '@playwright/test';
import { cleanDatabase } from './db-utils';

/**
 * Tests E2E Full-Stack para la vista de Miembros.
 * NO hay ningún mock de red. Playwright interactúa con:
 *   - El Frontend React servido en el baseURL (localhost:5174)
 *   - La API Fastify real en http://localhost:3001
 *   - La base de datos PostgreSQL de test (alentapp_test_db)
 *
 * La DB es compartida por toda la suite y otros specs siembran socios, por lo
 * que el global-setup (que limpia una sola vez al arrancar) no alcanza para
 * que la tabla esté vacía cuando llega este archivo. Por eso limpiamos la DB
 * en el beforeAll y usamos datos únicos: así el flujo crear → editar → eliminar
 * trabaja sobre un único miembro conocido y los asserts de "estado vacío" son
 * válidos. El modo serial encadena los tests y aborta la cadena si uno falla.
 */

test.describe.configure({ mode: 'serial' });

test.describe('Members Full-Stack E2E', () => {
  const suffix = Math.floor(Math.random() * 100000).toString();
  const memberName = `Socio E2E ${suffix}`;
  const memberNameEdited = `Socio E2E Editado ${suffix}`;
  const memberDni = `55${suffix.padStart(6, '0')}`;
  const memberEmail = `socio.e2e.${suffix}@test.com`;

  test.beforeAll(async () => {
    await cleanDatabase();
  });

  test('debe mostrar el estado vacío cuando no hay miembros en la DB', async ({ page }) => {
    await page.goto('/members');
    await expect(page.getByText('No se encontraron miembros.')).toBeVisible({ timeout: 10000 });
  });

  test('debe crear un miembro real y mostrarlo en la tabla', async ({ page }) => {
    await page.goto('/members');

    // Abrir modal de creación
    await page.locator('button:has-text("Agregar Miembro")').click();
    await expect(page.getByText('Agregar Nuevo Miembro')).toBeVisible();

    // Llenar formulario con datos únicos
    await page.getByPlaceholder('Ej. Juan Pérez').fill(memberName);
    await page.getByPlaceholder('Ej. 12345678').fill(memberDni);
    await page.getByPlaceholder('ejemplo@correo.com').fill(memberEmail);
    await page.getByLabel(/Fecha de Nacimiento/i).fill('1995-06-15');

    // Guardar
    await page.getByRole('button', { name: 'Crear Miembro' }).click();

    // El modal se cierra (create OK) y el miembro aparece en la tabla real
    await expect(page.getByRole('button', { name: 'Crear Miembro' })).toBeHidden();
    await expect(page.getByRole('cell', { name: memberName, exact: true })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('cell', { name: memberDni, exact: true })).toBeVisible();
  });

  test('debe editar el miembro creado y ver el cambio en la tabla', async ({ page }) => {
    await page.goto('/members');

    // El miembro del test anterior está en la tabla
    await expect(page.getByRole('cell', { name: memberName, exact: true })).toBeVisible({ timeout: 10000 });

    // Editar desde el botón de su fila (evita ambigüedad si hubiera más filas)
    await page.getByRole('row', { name: memberName }).getByRole('button', { name: 'Editar miembro' }).click();
    await expect(page.getByText('Editar Miembro')).toBeVisible();

    // Cambiar el nombre
    await page.getByPlaceholder('Ej. Juan Pérez').fill(memberNameEdited);

    // Guardar
    await page.getByRole('button', { name: 'Guardar Cambios' }).click();
    await expect(page.getByRole('button', { name: 'Guardar Cambios' })).toBeHidden();

    // La tabla muestra el nuevo nombre y ya no el anterior
    await expect(page.getByRole('cell', { name: memberNameEdited, exact: true })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('cell', { name: memberName, exact: true })).toHaveCount(0);
  });

  test('debe eliminar el miembro y mostrar el estado vacío', async ({ page }) => {
    await page.goto('/members');

    // El miembro editado sigue ahí tras el test anterior
    await expect(page.getByRole('cell', { name: memberNameEdited, exact: true })).toBeVisible({ timeout: 10000 });

    // Aceptar el confirm del navegador automáticamente
    page.on('dialog', (dialog) => dialog.accept());

    // Borrar desde el botón de su fila
    await page.getByRole('row', { name: memberNameEdited }).getByRole('button', { name: 'Eliminar miembro' }).click();

    // Al borrar el único miembro, la tabla queda vacía
    await expect(page.getByText('No se encontraron miembros.')).toBeVisible({ timeout: 10000 });
  });
});
