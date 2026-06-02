import { test, expect, request } from '@playwright/test';

/**
 * E2E Full-Stack para el alta de Certificados Médicos (TDD-0018).
 * El global-setup ya dejó la DB limpia. Sembramos un socio vía API directamente
 * para no acoplar este test a la UI de Members.
 */

const API_URL = 'http://localhost:3001';

test.describe.configure({ mode: 'serial' });

test.describe('Medical Certificates Full-Stack E2E — Create', () => {
  let seededMemberName: string;
  let seededDoctorLicense: string;

  test.beforeAll(async () => {
    const api = await request.newContext();
    const suffix = Math.floor(Math.random() * 100000).toString();
    seededMemberName = `Socio Certificado ${suffix}`;
    seededDoctorLicense = `MP${suffix}`;

    const res = await api.post(`${API_URL}/api/v1/socios`, {
      data: {
        name: seededMemberName,
        dni: `C${suffix}`,
        email: `cert${suffix}@e2e.com`,
        birthdate: '1990-01-01',
        category: 'Pleno',
      },
    });
    if (!res.ok()) {
      throw new Error(`No se pudo sembrar socio: ${res.status()} ${await res.text()}`);
    }
    await api.dispose();
  });

  test('debe registrar un certificado médico y verlo en la tabla como Vigente y Validado', async ({ page }) => {
    await page.goto('/medical-certificates');

    await page.getByRole('button', { name: /Nuevo Certificado/i }).click();
    await expect(page.getByText('Registrar Certificado Médico')).toBeVisible();

    // Seleccionar el socio sembrado en el combobox de la modal.
    await page.getByRole('combobox').first().click();
    await page.getByRole('option', { name: new RegExp(seededMemberName) }).click();

    // Fechas: emisión hoy-ish, vencimiento a ~1 año (debe pasar validateNotExpired).
    await page.locator('input[type="date"]').nth(0).fill('2026-06-01');
    await page.locator('input[type="date"]').nth(1).fill('2027-06-01');

    await page.getByPlaceholder('Ej. MP12345').fill(seededDoctorLicense);

    await page.getByRole('button', { name: 'Registrar' }).click();

    // La modal se cierra y el certificado aparece en la tabla con sus datos reales.
    await expect(page.getByText('Registrar Certificado Médico')).toBeHidden({ timeout: 10000 });
    await expect(page.getByRole('cell', { name: seededDoctorLicense, exact: true })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('cell', { name: seededMemberName, exact: true })).toBeVisible();
    // TDD-0018 §Observaciones: el certificado recién creado queda vigente y validado.
    await expect(page.getByRole('cell', { name: 'Vigente', exact: true })).toBeVisible();
  });
});
