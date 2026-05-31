import { test, expect, request } from '@playwright/test';

const API_URL = 'http://localhost:3001';

test.describe.configure({ mode: 'serial' });

test.describe('Cancel Payment FullStack E2E', () => {

    test(
        'debe cancelar un pago desde la interfaz',
        async ({ page }) => {

            const api = await request.newContext();

            const random = Math.floor(Math.random() * 100000);

            // Crear socio
            const memberResponse = await api.post(
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

            expect(memberResponse.ok()).toBeTruthy();

            const memberBody = await memberResponse.json();

            // Crear pago pendiente
            const paymentResponse = await api.post(
                `${API_URL}/api/v1/payments`,
                {
                    data: {
                        memberId: memberBody.data.id,
                        monto: 1000,
                        mesReferencia: 6,
                        anioReferencia: 2026,
                        fechaVencimiento: '2026-12-31'
                    }
                }
            );

            expect(paymentResponse.ok()).toBeTruthy();

            await api.dispose();

            // Abrir pantalla
            await page.goto('http://localhost:5173/payments');

            // Click en el primer botón Cancelar
            await page.getByRole(
                'button',
                { name: 'Cancelar' }
            ).first().click();

            // Esperar refresco de la tabla
            await page.waitForTimeout(1000);

            // Verificar estado cancelado
            await expect(
                page.locator('text=Cancelado').first()
            ).toBeVisible();

        }
    );

});