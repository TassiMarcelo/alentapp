import 'dotenv/config';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../app.js';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/client/client.js';

describe('Locker API End-to-End Tests', () => {
    let app: FastifyInstance;
    let prisma: PrismaClient;
    let createdLockerId: string;

    const randomSuffix = Math.floor(Math.random() * 100000).toString();
    const testNumero = parseInt(`9${randomSuffix.slice(0, 4)}`);

    beforeAll(async () => {
    app = buildApp();
    await app.ready();

    prisma = new PrismaClient({
        adapter: new PrismaPg(process.env.DATABASE_URL as any),
    });
    await prisma.$connect();

    // Limpiamos lockers de tests anteriores
    await prisma.locker.deleteMany({
        where: { numero: { in: [testNumero, testNumero + 1] } }
    });
});

    afterAll(async () => {
        if (createdLockerId) {
            await prisma.locker.deleteMany({
                where: { id: createdLockerId }
            });
        }
        await prisma.$disconnect();
        await app.close();
    });

    it('1. GET: Debe retornar la lista de lockers existente', async () => {
    const response = await app.inject({
        method: 'GET',
        url: '/api/v1/lockers'
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload);
    expect(Array.isArray(body)).toBe(true);
    
    // Verificación directa en la DB real
    const dbLockers = await prisma.locker.findMany();
    expect(body.length).toBe(dbLockers.length);
    });



    it('2. POST: Debe crear un locker en la base de datos real', async () => {
    const payload = {
        numero: testNumero,
        ubicacion: 'VESTUARIO_MASCULINO'
    };

    const response = await app.inject({
        method: 'POST',
        url: '/api/v1/lockers',
        payload
    });

    expect(response.statusCode).toBe(201);
    const body = JSON.parse(response.payload);
    expect(body.numero).toBe(testNumero);
    expect(body.estado).toBe('DISPONIBLE');

    createdLockerId = body.id;

    const dbLocker = await prisma.locker.findUnique({ where: { id: createdLockerId } });
    expect(dbLocker).not.toBeNull();
    expect(dbLocker?.numero).toBe(testNumero);
    });


it('3. DELETE: Debe eliminar físicamente el locker de la base de datos', async () => {
    // Primero creamos un locker para después eliminarlo
    const createResponse = await app.inject({
        method: 'POST',
        url: '/api/v1/lockers',
        payload: {
            numero: testNumero + 1,
            ubicacion: 'NINOS'
        }
    });

    const created = JSON.parse(createResponse.payload);
    const idToDelete = created.id;

    // Eliminamos el locker
    const deleteResponse = await app.inject({
        method: 'DELETE',
        url: `/api/v1/lockers/${idToDelete}`
    });

    expect(deleteResponse.statusCode).toBe(204);

    // Verificación directa en la DB real
    const dbLocker = await prisma.locker.findUnique({ where: { id: idToDelete } });
    expect(dbLocker).toBeNull();
    });

});