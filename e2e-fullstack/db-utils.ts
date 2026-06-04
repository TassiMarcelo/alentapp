/**
 * Utilidades de base de datos para los tests E2E Full-Stack.
 *
 * Se conecta a la DB de test expuesta por docker-compose.e2e.yml en
 * localhost:5433 y permite limpiar el estado. Lo usan tanto el global-setup
 * (limpieza inicial de toda la suite) como los specs que necesitan aislar su
 * estado del resto (la DB es compartida entre archivos y el global-setup solo
 * limpia una vez al arrancar la corrida completa).
 */
import pg from 'pg';

const DB_URL = 'postgresql://admin:password123@localhost:5433/alentapp_test_db';

/**
 * Trunca todas las tablas del esquema public (salvo las migraciones de Prisma),
 * reiniciando las secuencias y respetando las FKs con CASCADE.
 */
export async function cleanDatabase(): Promise<void> {
    const client = new pg.Client({ connectionString: DB_URL });
    await client.connect();

    try {
        // Todas las tablas del esquema public que no sean de prisma.
        const res = await client.query(`
            SELECT tablename
            FROM pg_tables
            WHERE schemaname = 'public'
            AND tablename != '_prisma_migrations';
        `);

        const tables = res.rows.map((row) => `"${row.tablename}"`).join(', ');

        if (tables) {
            await client.query(`TRUNCATE TABLE ${tables} RESTART IDENTITY CASCADE`);
            console.log(`[E2E] Tablas limpiadas: ${tables}`);
        }
    } catch (error) {
        console.error('[E2E] Error al limpiar la base de datos:', error);
        throw error;
    } finally {
        await client.end();
    }
}
