import { test, expect, request } from '@playwright/test';

/**
 * E2E Full-Stack para la actualización de Sanciones Disciplinarias (TDD-0008).
 * Se siembra un socio + una sanción vía API y luego se edita el motivo desde la UI.
 */

const API_URL = 'http://localhost:3001';

test.describe.configure({ mode: 'serial' });

test.describe('Disciplines Full-Stack E2E — Update', () => {
  const originalReason = `Falta original ${Math.floor(Math.random() * 100000)}`;
  const updatedReason = `Falta actualizada ${Math.floor(Math.random() * 100000)}`;

  test.beforeAll(async () => {
    const api = await request.newContext();
    const suffix = Math.floor(Math.random() * 100000).toString();

    const memberRes = await api.post(`${API_URL}/api/v1/socios`, {
      data: {
        name: `Socio Edit ${suffix}`,
        dni: `U${suffix}`,
        email: `edit${suffix}@e2e.com`,
        birthdate: '1990-01-01',
        category: 'Pleno',
      },
    });
    if (!memberRes.ok()) {
      throw new Error(`No se pudo sembrar socio: ${memberRes.status()} ${await memberRes.text()}`);
    }
    const memberBody = await memberRes.json();
    const memberId = memberBody.data?.id ?? memberBody.id;

    const disciplineRes = await api.post(`${API_URL}/api/v1/disciplines`, {
      data: {
        reason: originalReason,
        start_date: '2026-06-01T00:00:00Z',
        end_date: '2026-06-30T00:00:00Z',
        is_total_suspension: false,
        member_id: memberId,
      },
    });
    if (!disciplineRes.ok()) {
      throw new Error(`No se pudo sembrar sanción: ${disciplineRes.status()} ${await disciplineRes.text()}`);
    }

    await api.dispose();
  });

  test('debe editar el motivo de una sanción y reflejarlo en la tabla', async ({ page }) => {
    await page.goto('/disciplines');

    await expect(page.getByRole('cell', { name: originalReason })).toBeVisible({ timeout: 10000 });

    await page.getByRole('button', { name: 'Editar sanción' }).click();
    await expect(page.getByRole('heading', { name: 'Editar Sanción Disciplinaria' })).toBeVisible();

    const reasonInput = page.getByRole('textbox').filter({ hasNot: page.locator('[type="datetime-local"]') }).first();
    await reasonInput.fill(updatedReason);

    await page.getByRole('button', { name: 'Guardar' }).click();

    await expect(page.getByRole('cell', { name: updatedReason })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('cell', { name: originalReason })).toHaveCount(0);
  });
});
