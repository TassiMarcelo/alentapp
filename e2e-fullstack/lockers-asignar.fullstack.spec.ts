import { test, expect } from '@playwright/test';
import { cleanDatabase } from '../e2e-fullstack/db-utils.js';
import pg from 'pg';

const DB_URL = 'postgresql://admin:password123@localhost:5433/alentapp_test_db';

test('debe asignar un locker a un miembro real', async ({ page }) => {
  // Limpieza previa
  await cleanDatabase();

  // Setup: insertamos datos directo en la DB
  const client = new pg.Client({ connectionString: DB_URL });
  await client.connect();
  await client.query(`INSERT INTO members (id, name, dni, email, birthdate, category, status) 
    VALUES ('member-test-uuid', 'Test Asignar', '11111111', 'asignar@e2e.com', '1995-06-15', 'Pleno', 'Activo')`);
  await client.query(`INSERT INTO lockers (id, numero, ubicacion, estado) 
    VALUES ('locker-test-uuid', 97, 'VESTUARIO_MASCULINO', 'DISPONIBLE')`);
  await client.end();

  // Probamos la asignación desde la UI
  await page.goto('/lockers');
  await page.getByRole('button', { name: 'Asignar' }).first().click();
  await expect(page.getByText('Asignar Locker #97')).toBeVisible();
  await page.getByText('Seleccione un socio').click();
  await page.getByText('Test Asignar (DNI: 11111111)').click();
  await page.getByLabel(/Fecha de fin/i).fill('2027-01-01');
  await page.getByRole('button', { name: 'Asignar' }).last().click();
  await expect(page.locator('.chakra-badge', { hasText: 'OCUPADO' })).toBeVisible({ timeout: 10000 });


});