import { test, expect } from '@playwright/test';

/**
 * Tests E2E Full-Stack para la vista de Lockers.
 * NO hay ningún mock de red. Playwright interactúa con:
 *   - El Frontend React en http://localhost:5174
 *   - La API Fastify real en http://localhost:3001
 *   - La base de datos PostgreSQL de test (alentapp_test_db)
 *
 * El global-setup se encarga de limpiar la DB antes de correr la suite,
 * por lo que cada test empieza desde un estado conocido y limpio.
 */

test.describe('Lockers Full-Stack E2E', () => {

  test('debe crear un locker real y mostrarlo en la tabla', async ({ page }) => {
    await page.goto('/lockers');

    // Abrir modal de creación
    await page.locator('button:has-text("Agregar Locker")').click();
    await expect(page.getByText('Agregar Locker')).toBeVisible();

    // Llenar formulario con datos reales
    await page.getByPlaceholder('Ej. 1').fill('99');

    // Guardar
    await page.getByRole('button', { name: 'Crear' }).click();

    // Esperar que el modal se cierre y el locker aparezca en la tabla real
    await expect(page.getByRole('button', { name: 'Crear' })).toBeHidden();
    await expect(page.getByText('#99')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.chakra-badge', { hasText: 'DISPONIBLE' })).toBeVisible();
  });





  test('debe asignar un locker a un miembro real', async ({ page }) => {
  // Primero creamos un miembro real
  await page.goto('/members');
  await page.locator('button:has-text("Agregar Miembro")').click();
  await expect(page.getByText('Agregar Nuevo Miembro')).toBeVisible();
  await page.getByPlaceholder('Ej. Juan Pérez').fill('Test E2E Fullstack');
  await page.getByPlaceholder('Ej. 12345678').fill('55566677');
  await page.getByPlaceholder('ejemplo@correo.com').fill('fullstack@e2e.com');
  await page.getByLabel(/Fecha de Nacimiento/i).fill('1995-06-15');
  await page.getByRole('button', { name: 'Crear Miembro' }).click();
  await expect(page.getByRole('button', { name: 'Crear Miembro' })).toBeHidden();

  // Creamos un locker
  await page.goto('/lockers');
  await page.locator('button:has-text("Agregar Locker")').click();
  await page.getByPlaceholder('Ej. 1').fill('98');
  await page.getByRole('button', { name: 'Crear' }).click();
  await expect(page.getByRole('button', { name: 'Crear' })).toBeHidden();

  // Asignamos el locker al miembro
  await page.getByRole('button', { name: 'Asignar' }).first().click();
  await expect(page.getByText('Asignar Locker #98')).toBeVisible();
  await page.getByText('Seleccione un socio').click();
  await page.getByText('Test E2E Fullstack (DNI: 55566677)').click();
  await page.getByLabel(/Fecha de fin/i).fill('2027-01-01');
  await page.getByRole('button', { name: 'Asignar' }).last().click();

  // El locker debe aparecer como OCUPADO
  await expect(page.locator('.chakra-badge', { hasText: 'OCUPADO' })).toBeVisible({ timeout: 10000 });
});



test('debe liberar un locker ocupado y mostrarlo como disponible', async ({ page }) => {
  await page.goto('/lockers');

  // El locker #98 ya está OCUPADO del test anterior
  await expect(page.locator('.chakra-badge', { hasText: 'OCUPADO' })).toBeVisible({ timeout: 10000 });

  // Aceptamos el confirm
  page.on('dialog', (dialog) => dialog.accept());

  // Clic en Liberar
  await page.getByRole('button', { name: 'Liberar' }).click();

  // El locker #98 debe aparecer como DISPONIBLE
  await expect(
    page.getByRole('row', { name: /#98/ }).locator('.chakra-badge', { hasText: 'DISPONIBLE' })
  ).toBeVisible({ timeout: 10000 });
});


});