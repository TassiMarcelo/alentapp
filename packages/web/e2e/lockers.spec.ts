import { test, expect } from '@playwright/test';

test.describe('Lockers E2E (UI Integration)', () => {
  let mockDb: any[];

  test.beforeEach(async ({ page }) => {
    page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));

    mockDb = [
      {
        id: 'uuid-1',
        numero: 5,
        ubicacion: 'VESTUARIO_MASCULINO',
        estado: 'DISPONIBLE',
        fechaFinContrato: null,
        socio: null,
      }
    ];

    await page.route(/\/api\/v1\/lockers/, async (route) => {
      const method = route.request().method();

      if (method === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockDb)
        });
      } else if (method === 'POST') {
        const payload = route.request().postDataJSON();
        const existe = mockDb.find(l => l.numero === payload.numero);
        if (existe) {
          await route.fulfill({
            status: 409,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Ya existe un locker con ese número' })
          });
        } else {
          const newLocker = {
            id: `uuid-${mockDb.length + 1}`,
            estado: 'DISPONIBLE',
            fechaFinContrato: null,
            socio: null,
            ...payload,
          };
          mockDb.push(newLocker);
          await route.fulfill({
            status: 201,
            contentType: 'application/json',
            body: JSON.stringify(newLocker),
          });
        }
      } else if (method === 'DELETE') {
        const url = new URL(route.request().url());
        const id = url.pathname.split('/').filter(Boolean).pop();
        const index = mockDb.findIndex(l => l.id === id);
        if (index > -1) mockDb.splice(index, 1);
        await route.fulfill({ status: 204 });
      } else if (method === 'OPTIONS') {
        await route.fulfill({
          status: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          }
        });
      } else {
        await route.continue();
      }
    });

    await page.route(/\/api\/v1\/socios/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [
          { id: 'member-1', name: 'Juan Perez', dni: '12345678' }
        ]})
      });
    });

    await page.goto('/lockers');
  });

  test('debe mostrar la lista de lockers cargada desde el network interceptado', async ({ page }) => {
    await expect(page.getByText('#5')).toBeVisible();
    await expect(page.locator('.chakra-badge', { hasText: 'DISPONIBLE' })).toBeVisible();
    await expect(page.getByText('Vest. Masculino')).toBeVisible();
    await page.waitForTimeout(3000);
  });

  test('debe abrir el modal de creación y agregar un locker nuevo', async ({ page }) => {
    await page.locator('button:has-text("Agregar Locker")').click();
    await expect(page.getByText('Agregar Locker')).toBeVisible();
    await page.getByPlaceholder('Ej. 1').fill('202');
    await page.getByRole('button', { name: 'Crear' }).click();
    await expect(page.getByRole('button', { name: 'Crear' })).toBeHidden();
    await expect(page.getByText('#202')).toBeVisible();
  });

  test('debe mostrar error al intentar crear un locker con número duplicado', async ({ page }) => {
    let alertMessage = '';
    page.on('dialog', async (dialog) => {
      alertMessage = dialog.message();
      await dialog.accept();
    });
    await page.locator('button:has-text("Agregar Locker")').click();
    await page.getByPlaceholder('Ej. 1').fill('5');
    await page.getByRole('button', { name: 'Crear' }).click();
    await expect.poll(() => alertMessage).toBe('Ya existe un locker con ese número');
  });

  test('debe asignar un miembro a un locker disponible', async ({ page }) => {
    await page.route(/\/api\/v1\/lockers\/.*\/estado/, async (route) => {
      mockDb[0] = {
        ...mockDb[0],
        estado: 'OCUPADO',
        fechaFinContrato: '2027-01-01',
        socio: { nombre: 'Juan Perez', dni: '12345678' }
      };
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockDb[0])
      });
    });

    await page.getByRole('button', { name: 'Asignar' }).click();
    await expect(page.getByText('Asignar Locker #5')).toBeVisible();
    await page.getByText('Seleccione un socio').click();
    await page.getByText('Juan Perez (DNI: 12345678)').click();
    await page.getByLabel(/Fecha de fin/i).fill('2027-01-01');
    await page.getByRole('button', { name: 'Asignar' }).last().click();
    await expect(page.locator('.chakra-badge', { hasText: 'OCUPADO' })).toBeVisible();
  });

});