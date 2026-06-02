/**
 * global-setup.ts para Playwright Full-Stack E2E con Docker Compose.
 *
 * Docker Compose (docker-compose.e2e.yml) se encarga de levantar:
 *   - db-test    → PostgreSQL en localhost:5433
 *   - api-test   → Fastify en localhost:3001
 *   - web-test   → Vite en localhost:5174
 *
 * Este script solo:
 *   1. Espera a que la API esté respondiendo (poll)
 *   2. Limpia la tabla de members para empezar desde un estado limpio
 */
import type { FullConfig } from '@playwright/test';
import { cleanDatabase } from './db-utils';

const API_URL = 'http://localhost:3001';
const MAX_WAIT_MS = 60_000;
const POLL_INTERVAL_MS = 2_000;

async function waitForApi(): Promise<void> {
    const start = Date.now();
    process.stdout.write('[E2E Setup] Esperando API...');

    while (Date.now() - start < MAX_WAIT_MS) {
        try {
            const res = await fetch(`${API_URL}/`);
            if (res.ok || res.status < 500) {
                console.log(' ✓ lista.');
                return;
            }
        } catch {
            // API todavía no levantó
        }
        process.stdout.write('.');
        await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
    }

    throw new Error(`[E2E Setup] La API no respondió después de ${MAX_WAIT_MS / 1000}s. ¿Está corriendo docker-compose.e2e.yml?`);
}

export default async function globalSetup(_config: FullConfig) {
    await waitForApi();
    await cleanDatabase();
    console.log('[E2E Setup] Listo. Corriendo tests...');
}
