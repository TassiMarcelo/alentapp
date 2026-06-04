import { test, expect } from '@playwright/test';
import { cleanDatabase } from './db-utils.js';

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
    wait cleanDatabase();
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
});