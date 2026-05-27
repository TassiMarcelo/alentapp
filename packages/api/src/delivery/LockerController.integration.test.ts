import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../app.js';

vi.mock('../infrastructure/PostgresLockerRepository.js', () => {
    return {
        PostgresLockerRepository: class {
            async findAll() {
                return [
                    {
                        id: 'uuid-1',
                        numero: 1,
                        ubicacion: 'VESTUARIO_MASCULINO',
                        estado: 'DISPONIBLE',
                        fechaFinContrato: null,
                        socio: null,
                    }
                ];
            }
            async findByNumero(numero: number) {
                return numero === 1
                    ? { id: 'uuid-1', numero: 1, ubicacion: 'VESTUARIO_MASCULINO', estado: 'DISPONIBLE', fechaFinContrato: null, socio: null }
                    : null;
            }
            async count() { return 1; }
            async create(data: any) {
                return { id: 'uuid-2', ...data, estado: 'DISPONIBLE', fechaFinContrato: null, socio: null };
            }
            async findById(id: string) { return null; }
            async findByMemberId(memberId: string) { return null; }
            async assign() { return null; }
            async release(id: string) { return null; }
            async update(id: string, data: any) { return null; }
            async delete(id: string) { return; }
            async updateEstado() { return null; }
        }
    };
});

describe('Locker API Integration Tests', () => {
    let app: FastifyInstance;

    beforeAll(async () => {
        app = buildApp();
        await app.ready();
    });

    afterAll(async () => {
        await app.close();
    });

    describe('GET /api/v1/lockers', () => {
    it('debe retornar 200 y el listado de lockers', async () => {
        const response = await app.inject({
            method: 'GET',
            url: '/api/v1/lockers'
        });

        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.payload);
        expect(body).toBeInstanceOf(Array);
        expect(body[0].id).toBe('uuid-1');
        expect(body[0].numero).toBe(1);
    });
    });

    describe('GET /api/v1/lockers con filtro inválido', () => {
    it('debe retornar 400 si el filtro de estado es inválido', async () => {
        const response = await app.inject({
            method: 'GET',
            url: '/api/v1/lockers?estado=INVALIDO'
        });

        expect(response.statusCode).toBe(400);
        const body = JSON.parse(response.payload);
        expect(body.error).toBe('Filtro inválido');
    });
});

});