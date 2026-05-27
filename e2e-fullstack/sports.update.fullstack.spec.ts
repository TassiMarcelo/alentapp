import { test, expect, request } from '@playwright/test';

/**
 * E2E Full-Stack para GET y PUT de Deportes.
 * El global-setup ya dejó la DB limpia. Sembramos un deporte vía API
 * para no acoplar este test al spec de creación.
 */

const API_URL = 'http://localhost:3001';

test.describe.configure({ mode: 'serial' });

test.describe('Sports Full-Stack E2E — Get & Update', () => {
  let seededSportNombre: string;

  test.beforeAll(async () => {
    const api = await request.newContext();
    const suffix = Math.floor(Math.random() * 100000).toString();
    seededSportNombre = `Deporte E2E ${suffix}`;

    const res = await api.post(`${API_URL}/api/v1/sports`, {
      data: {
        nombre: seededSportNombre,
        descripcion: 'Descripción original',
        cupoMaximo: 20,
        precioAdicional: 500,
        esFederado: false,
        requires_medical_certificate: false,
      },
    });

    if (!res.ok()) {
      throw new Error(`No se pudo sembrar deporte: ${res.status()} ${await res.text()}`);
    }
    await api.dispose();
  });

  test('GET: debe mostrar el deporte sembrado en la tabla', async ({ page }) => {
    await page.goto('/sports');

    await expect(page.getByRole('cell', { name: seededSportNombre })).toBeVisible({ timeout: 10000 });
  });

  test('PUT: debe editar el deporte y ver el cambio en la tabla', async ({ page }) => {
    await page.goto('/sports');

    await expect(page.getByRole('cell', { name: seededSportNombre })).toBeVisible({ timeout: 10000 });

    await page.getByRole('row', { name: new RegExp(seededSportNombre) })
      .getByTitle('Editar')
      .click();

    await expect(page.getByText(`Editar Deporte: ${seededSportNombre}`)).toBeVisible();

    await page.getByPlaceholder('Breve descripción').fill('Descripción actualizada E2E');
    await page.getByPlaceholder('Ej. 15').fill('30');

    await page.getByRole('button', { name: 'Guardar Cambios' }).click();

    await expect(page.getByText(`Editar Deporte: ${seededSportNombre}`)).toBeHidden({ timeout: 10000 });
    await expect(page.getByRole('cell', { name: 'Descripción actualizada E2E' })).toBeVisible({ timeout: 10000 });
  });
});