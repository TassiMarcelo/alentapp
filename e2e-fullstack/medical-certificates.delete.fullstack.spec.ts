import { test, expect, request } from '@playwright/test';

/**
 * E2E Full-Stack para la eliminación de Certificados Médicos (TDD-0020).
 * Se siembra un socio + un certificado vía API y luego se elimina desde la UI
 * pasando por el cartel de confirmación, verificando que la fila desaparezca.
 */

const API_URL = 'http://localhost:3001';

test.describe.configure({ mode: 'serial' });

test.describe('Medical Certificates Full-Stack E2E — Delete', () => {
  let seededMemberName: string;
  let seededDoctorLicense: string;

  test.beforeAll(async () => {
    const api = await request.newContext();
    const suffix = Math.floor(Math.random() * 100000).toString();
    seededMemberName = `Socio Delete Cert ${suffix}`;
    seededDoctorLicense = `MPD${suffix}`;

    const memberRes = await api.post(`${API_URL}/api/v1/socios`, {
      data: {
        name: seededMemberName,
        dni: `D${suffix}`,
        email: `deletecert${suffix}@e2e.com`,
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
        doctorLicense: seededDoctorLicense,
      },
    });
    if (!certRes.ok()) {
      throw new Error(`No se pudo sembrar certificado: ${certRes.status()} ${await certRes.text()}`);
    }

    await api.dispose();
  });

  test('debe eliminar un certificado tras confirmar y removerlo de la tabla', async ({ page }) => {
    await page.goto('/medical-certificates');

    // El certificado sembrado aparece en la tabla antes del borrado.
    await expect(page.getByRole('cell', { name: seededDoctorLicense, exact: true })).toBeVisible({ timeout: 10000 });

    // Abrir el cartel de confirmación desde el botón de la fila (TDD-0020 §Criterios).
    await page.getByRole('row', { name: seededDoctorLicense }).getByRole('button', { name: 'Eliminar certificado' }).click();
    await expect(page.getByText('¿Está seguro que desea eliminar este certificado?')).toBeVisible();

    // Confirmar el borrado lógico.
    await page.getByRole('button', { name: 'Eliminar', exact: true }).click();

    // El cartel se cierra y la fila del certificado desaparece de la tabla.
    await expect(page.getByText('¿Está seguro que desea eliminar este certificado?')).toBeHidden({ timeout: 10000 });
    await expect(page.getByRole('cell', { name: seededDoctorLicense, exact: true })).toHaveCount(0);
  });
});
