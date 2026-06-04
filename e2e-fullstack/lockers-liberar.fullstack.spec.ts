import { test, expect } from '@playwright/test';
import { cleanDatabase } from './db-utils.js';
import pg from 'pg';

/**
 * Tests E2E Full-Stack para liberar un locker.
 * NO hay ningún mock de red. Playwright interactúa con:
 *   - El Frontend React en http://localhost:5174
 *   - La API Fastify real en http://localhost:3001
 *   - La base de datos PostgreSQL de test (alentapp_test_db)
 *
 * Cada test es independiente y crea sus propios datos directo en la DB.
 */

const DB_URL = 'postgresql://admin:password123@localhost:5433/alentapp_test_db';

test.describe('Lockers Full-Stack E2E - Liberar', () => {

  test('debe liberar un locker ocupado y mostrarlo como disponible', async ({ page }) => {
    // Limpieza previa
    await cleanDatabase();

    // Setup: insertamos miembro y locker OCUPADO directo en la DB
    const client = new pg.Client({ connectionString: DB_URL });
    await client.connect();
    await client.query(`INSERT INTO members (id, name, dni, email, birthdate, category, status) 
      VALUES ('member-test-uuid', 'Test Liberar', '33333333', 'liberar@e2e.com', '1995-06-15', 'Pleno', 'Activo')`);
    await client.query(`INSERT INTO lockers (id, numero, ubicacion, estado, member_id, "fechaFinContrato") 
      VALUES ('locker-test-uuid', 96, 'VESTUARIO_MASCULINO', 'OCUPADO', 'member-test-uuid', '2027-01-01')`);
    await client.end();

    // Probamos la liberación desde la UI
    await page.goto('/lockers');
    await expect(page.locator('.chakra-badge', { hasText: 'OCUPADO' })).toBeVisible({ timeout: 10000 });

    page.on('dialog', (dialog) => dialog.accept());

    await page.getByRole('button', { name: 'Liberar' }).click();

    await expect(page.locator('.chakra-badge', { hasText: 'DISPONIBLE' })).toBeVisible({ timeout: 10000 });
  });

});