import { test, expect, request } from '@playwright/test';

/**
 * E2E Full-Stack para DELETE de Deportes.
 * Siembra un deporte vía API en el beforeAll para no acoplar este test
 * a otros specs.
 */

const API_URL = 'http://localhost:3001';

test.describe.configure({ mode: 'serial' });

test.describe('Sports Full-Stack E2E — Delete', () => {
  let seededSportNombre: string;

  test.beforeAll(async () => {
    const api = await request.newContext();
    const suffix = Math.floor(Math.random() * 100000).toString();
    seededSportNombre = `Deporte E2E Delete ${suffix}`;

    const res = await api.post(`${API_URL}/api/v1/sports`, {
      data: {
        nombre: seededSportNombre,
        descripcion: 'Deporte para eliminar en E2E',
        cupoMaximo: 10,
        precioAdicional: 200,
        esFederado: false,
        requires_medical_certificate: false,
      },
    });

    if (!res.ok()) {
      throw new Error(`No se pudo sembrar deporte: ${res.status()} ${await res.text()}`);
    }
    await api.dispose();
  });

  test('DELETE: debe eliminar el deporte y verificar que ya no existe en la tabla', async ({ page }) => {
    await page.goto('/sports');

    await expect(page.getByRole('cell', { name: seededSportNombre })).toBeVisible({ timeout: 10000 });

    page.on('dialog', (dialog) => dialog.accept());

    await page.getByRole('row', { name: new RegExp(seededSportNombre) })
      .getByTitle('Eliminar')
      .click();

    await expect(page.getByRole('cell', { name: seededSportNombre })).toBeHidden({ timeout: 10000 });

    const api = await request.newContext();
    const res = await api.get(`${API_URL}/api/v1/sports`);
    const sports = await res.json();
    const deleted = sports.find((s: any) => s.nombre === seededSportNombre);
    expect(deleted).toBeUndefined();
    await api.dispose();
  });
});