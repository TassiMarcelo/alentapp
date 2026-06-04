import { test, expect, request } from '@playwright/test';

/**
 * E2E Full-Stack para el borrado lógico de Sanciones Disciplinarias (TDD-0009).
 * Se siembra un socio + una sanción vía API y luego se elimina desde la UI,
 * confirmando el diálogo de Chakra y verificando que la fila desaparece.
 */

const API_URL = 'http://localhost:3001';

test.describe.configure({ mode: 'serial' });

test.describe('Disciplines Full-Stack E2E — Delete', () => {
  const reason = `Falta a eliminar ${Math.floor(Math.random() * 100000)}`;

  test.beforeAll(async () => {
    const api = await request.newContext();
    const suffix = Math.floor(Math.random() * 100000).toString();

    const memberRes = await api.post(`${API_URL}/api/v1/socios`, {
      data: {
        name: `Socio Delete ${suffix}`,
        dni: `D${suffix}`,
        email: `delete${suffix}@e2e.com`,
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
        reason,
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

  test('debe eliminar una sanción y quitarla de la tabla', async ({ page }) => {
    await page.goto('/disciplines');

    const row = page.getByRole('row').filter({ hasText: reason });
    await expect(row).toBeVisible({ timeout: 10000 });

    await row.getByRole('button', { name: 'Eliminar sanción' }).click();
    await expect(page.getByRole('heading', { name: 'Eliminar Sanción Disciplinaria' })).toBeVisible();

    await page.getByRole('button', { name: 'Eliminar', exact: true }).click();

    await expect(page.getByRole('cell', { name: reason })).toHaveCount(0, { timeout: 10000 });
  });
});
