import { test, expect } from '@playwright/test';

const API_URL = 'http://localhost:3001';

test.describe.configure({ mode: 'serial' });

test.describe('Sports Full-Stack E2E — Create', () => {
  const suffix = Math.floor(Math.random() * 100000).toString();
  const testNombre = `Deporte E2E ${suffix}`;

  test('debe crear un deporte y verlo en la tabla', async ({ page }) => {
    await page.goto('/sports');

    await page.getByRole('button', { name: /Agregar Deporte/i }).click();
    await expect(page.getByText('Agregar Nuevo Deporte')).toBeVisible();

    await page.getByPlaceholder('Ej. Basquet').fill(testNombre);
    await page.getByPlaceholder('Breve descripción').fill('Deporte creado en test E2E');
    await page.getByPlaceholder('Ej. 15').fill('10');

    await page.getByRole('button', { name: 'Crear' }).click();

    await expect(page.getByText('Agregar Nuevo Deporte')).toBeHidden({ timeout: 10000 });
    await expect(page.getByRole('cell', { name: testNombre })).toBeVisible({ timeout: 10000 });
  });
});