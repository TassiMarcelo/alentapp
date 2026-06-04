import { test, expect, request } from '@playwright/test';

/**
 * E2E Full-Stack para el alta de Sanciones Disciplinarias (TDD-0007).
 * El global-setup ya dejó la DB limpia. Sembramos un socio vía API directamente
 * para no acoplar este test a la UI de Members.
 */

const API_URL = 'http://localhost:3001';

test.describe.configure({ mode: 'serial' });

test.describe('Disciplines Full-Stack E2E — Create', () => {
  let seededMemberName: string;

  test.beforeAll(async () => {
    const api = await request.newContext();
    const suffix = Math.floor(Math.random() * 100000).toString();
    seededMemberName = `Socio Sanción ${suffix}`;
    const res = await api.post(`${API_URL}/api/v1/socios`, {
      data: {
        name: seededMemberName,
        dni: `S${suffix}`,
        email: `sancion${suffix}@e2e.com`,
        birthdate: '1990-01-01',
        category: 'Pleno',
      },
    });
    if (!res.ok()) {
      throw new Error(`No se pudo sembrar socio: ${res.status()} ${await res.text()}`);
    }
    await api.dispose();
  });

  test('debe crear una sanción y verla en la tabla', async ({ page }) => {
    await page.goto('/disciplines');

    await page.getByRole('button', { name: 'Nueva Sanción', exact: true }).click();
    await expect(page.getByText('Registrar Sanción Disciplinaria')).toBeVisible();

    await page.getByRole('combobox').first().click();
    await page.getByRole('option', { name: new RegExp(seededMemberName) }).click();

    await page.getByPlaceholder('Descripción de la falta cometida').fill('Conducta antideportiva');

    await page.locator('input[type="datetime-local"]').nth(0).fill('2026-06-01T10:00');
    await page.locator('input[type="datetime-local"]').nth(1).fill('2026-06-15T10:00');

    await page.locator('#is_total_suspension').check();

    await page.getByRole('button', { name: 'Registrar' }).click();

    await expect(page.getByText('Registrar Sanción Disciplinaria')).toBeHidden({ timeout: 10000 });
    await expect(page.getByRole('cell', { name: 'Conducta antideportiva' })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('cell', { name: seededMemberName, exact: true })).toBeVisible();
  });
});
