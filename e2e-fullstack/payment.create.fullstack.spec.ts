import { test, expect, request } from '@playwright/test';

const API_URL = 'http://localhost:3001';

test.describe.configure({ mode: 'serial' });

test.describe('Payments FullStack E2E', () => {

    test(
        'debe crear un pago desde la interfaz',
        async ({ page }) => {

            const api = await request.newContext();

            const random = Math.floor(Math.random() * 100000);

            // Crear socio
            const response = await api.post(
                `${API_URL}/api/v1/socios`,
                {
                    data: {
                        name: `Abel ${random}`,
                        dni: `${random}`,
                        email: `abel${random}@test.com`,
                        birthdate: '2000-01-01',
                        category: 'Pleno'
                    }
                }
            );

            expect(response.ok()).toBeTruthy();

            await api.dispose();

            // Abrir pantalla
            await page.goto('/payments');

            // Abrir modal
            await page.getByRole(
                'button',
                { name: 'Nuevo Pago' }
            ).click();

            // Verificar modal
            await expect(
                page.getByText('Crear Pago')
            ).toBeVisible();

            // Abrir select
            await page.locator('[role="combobox"]').click();

            // Esperar opciones
            await page.waitForTimeout(1000);

            // Seleccionar primer socio con teclado
            await page.keyboard.press('ArrowDown');

            await page.keyboard.press('Enter');

            // Completar formulario
            await page.locator('input[type="number"]').nth(0).fill('1000');

            await page.locator('input[type="number"]').nth(1).fill('6');

            await page.locator('input[type="number"]').nth(2).fill('2026');

            await page.locator('input[type="date"]').fill('2026-12-31');

            // Crear pago
            await page.getByRole(
                'button',
                { name: 'Crear' }
            ).click();

            // Verificar pago creado
            await expect(
                page.locator('text=Pendiente').first()
            ).toBeVisible();

        }
    );

});