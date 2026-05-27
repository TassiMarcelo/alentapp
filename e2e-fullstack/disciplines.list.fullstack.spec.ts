import { test, expect, request } from '@playwright/test';

/**
 * E2E Full-Stack para el listado/filtrado de Sanciones Disciplinarias (TDD-0010).
 * Se siembran 2 sanciones vía API (una vigente, una vencida) y se verifica que el
 * filtro por estado "Vigentes" deja sólo la vigente en la tabla.
 */

const API_URL = 'http://localhost:3001';

test.describe.configure({ mode: 'serial' });

test.describe('Disciplines Full-Stack E2E — List', () => {
  let seededMemberName: string;
  const activeReason = `Falta activa ${Math.floor(Math.random() * 100000)}`;
  const expiredReason = `Falta vencida ${Math.floor(Math.random() * 100000)}`;

  test.beforeAll(async () => {
    const api = await request.newContext();
    const suffix = Math.floor(Math.random() * 100000).toString();
    seededMemberName = `Socio Listado ${suffix}`;

    const memberRes = await api.post(`${API_URL}/api/v1/socios`, {
      data: {
        name: seededMemberName,
        dni: `L${suffix}`,
        email: `listado${suffix}@e2e.com`,
        birthdate: '1990-01-01',
        category: 'Pleno',
      },
    });
    if (!memberRes.ok()) {
      throw new Error(`No se pudo sembrar socio: ${memberRes.status()} ${await memberRes.text()}`);
    }
    const memberBody = await memberRes.json();
    const memberId = memberBody.data?.id ?? memberBody.id;

    const activeRes = await api.post(`${API_URL}/api/v1/disciplines`, {
      data: {
        reason: activeReason,
        start_date: '2026-01-01T00:00:00Z',
        end_date: '2027-12-31T00:00:00Z',
        is_total_suspension: true,
        member_id: memberId,
      },
    });
    if (!activeRes.ok()) {
      throw new Error(`No se pudo sembrar sanción vigente: ${activeRes.status()} ${await activeRes.text()}`);
    }

    const expiredRes = await api.post(`${API_URL}/api/v1/disciplines`, {
      data: {
        reason: expiredReason,
        start_date: '2024-01-01T00:00:00Z',
        end_date: '2025-01-01T00:00:00Z',
        is_total_suspension: false,
        member_id: memberId,
      },
    });
    if (!expiredRes.ok()) {
      throw new Error(`No se pudo sembrar sanción vencida: ${expiredRes.status()} ${await expiredRes.text()}`);
    }

    await api.dispose();
  });

  test('debe filtrar por estado y mostrar sólo la sanción vigente', async ({ page }) => {
    await page.goto('/disciplines');

    // Sin filtro, ambas sanciones aparecen en la tabla.
    await expect(page.getByRole('cell', { name: activeReason })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('cell', { name: expiredReason })).toBeVisible();

    // Aplicar filtro "Vigentes" desde el dropdown "Estado de vigencia".
    // Es el segundo combobox de la vista (el primero es "Filtrar por socio").
    await page.getByRole('combobox').nth(1).click();
    await page.getByRole('option', { name: 'Vigentes' }).click();

    // Sólo debería verse la vigente; la vencida desaparece.
    await expect(page.getByRole('cell', { name: activeReason })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('cell', { name: expiredReason })).toHaveCount(0);
  });
});
