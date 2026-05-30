import { test, expect, request } from '@playwright/test';

/**
 * E2E Full-Stack para la edición de Certificados Médicos (TDD-0019).
 * Se siembra un socio + un certificado vía API y luego se edita la matrícula
 * desde la UI, verificando que la tabla refleje el nuevo valor.
 */

const API_URL = 'http://localhost:3001';

test.describe.configure({ mode: 'serial' });

test.describe('Medical Certificates Full-Stack E2E — Update', () => {
  let seededMemberName: string;
  let originalLicense: string;
  let updatedLicense: string;

  test.beforeAll(async () => {
    const api = await request.newContext();
    const suffix = Math.floor(Math.random() * 100000).toString();
    seededMemberName = `Socio Edit Cert ${suffix}`;
    originalLicense = `MPE${suffix}`;
    updatedLicense = `MPU${suffix}`;

    const memberRes = await api.post(`${API_URL}/api/v1/socios`, {
      data: {
        name: seededMemberName,
        dni: `E${suffix}`,
        email: `editcert${suffix}@e2e.com`,
        birthdate: '1990-01-01',
        category: 'Pleno',
      },
    });
    if (!memberRes.ok()) {
      throw new Error(`No se pudo sembrar socio: ${memberRes.status()} ${await memberRes.text()}`);
    }
    const memberBody = await memberRes.json();
    const memberId = memberBody.data?.id ?? memberBody.id;

    const certRes = await api.post(`${API_URL}/api/v1/medical-certificates`, {
      data: {
        memberId,
        issueDate: '2026-06-01',
        expiryDate: '2027-06-01',
        doctorLicense: originalLicense,
      },
    });
    if (!certRes.ok()) {
      throw new Error(`No se pudo sembrar certificado: ${certRes.status()} ${await certRes.text()}`);
    }

    await api.dispose();
  });

  test('debe editar la matrícula de un certificado y reflejarlo en la tabla', async ({ page }) => {
    await page.goto('/medical-certificates');

    // El certificado sembrado aparece con la matrícula original.
    await expect(page.getByRole('cell', { name: originalLicense, exact: true })).toBeVisible({ timeout: 10000 });

    // Abrir el modal de edición desde el botón de la fila.
    await page.getByRole('button', { name: 'Editar certificado' }).click();
    await expect(page.getByText('Editar Certificado Médico')).toBeVisible();

    // Cambiar solo la matrícula — el resto queda igual (PATCH parcial, TDD-0019).
    const licenseInput = page.getByPlaceholder('Ej. MP12345');
    await licenseInput.fill(updatedLicense);

    await page.getByRole('button', { name: 'Guardar cambios' }).click();

    // La modal se cierra y la tabla muestra la nueva matrícula, sin la anterior.
    await expect(page.getByText('Editar Certificado Médico')).toBeHidden({ timeout: 10000 });
    await expect(page.getByRole('cell', { name: updatedLicense, exact: true })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('cell', { name: originalLicense, exact: true })).toHaveCount(0);
  });
});
