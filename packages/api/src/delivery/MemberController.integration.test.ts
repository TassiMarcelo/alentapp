import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../app.js';
import { CreateMemberRequest } from '@alentapp/shared';

// Mockeamos el repositorio para que la API entera funcione sin conectarse a la Base de Datos real
// Esto nos permite testear la integración del ciclo completo: Fastify -> Controller -> UseCase -> Validator
vi.mock('../infrastructure/PostgresMemberRepository.js', () => {
    return {
        PostgresMemberRepository: class {
            async findAll() { return { data: [{ id: '1', name: 'Socio Existente' }], total: 1 }; }
            async findById(id: string) { return id === '1' ? { id: '1', name: 'Socio Existente', birthdate: '1990-01-01' } : null; }
            async findByDni(dni: string) { return dni === '12345678' ? { id: '1', dni: '12345678' } : null; }
            async create(data: any) { return { id: '2', ...data, category: data.category || 'Pleno', status: 'Activo' }; }
            async update(id: string, data: any) { return { id, ...data }; }
            async delete(id: string) { return; }
        }
    };
});

describe('Member API Integration Tests', () => {
    let app: FastifyInstance;

    beforeAll(async () => {
        app = buildApp();
        await app.ready(); // Esperamos a que todos los plugins (como CORS) carguen
    });

    afterAll(async () => {
        await app.close();
    });

    describe('GET /api/v1/socios', () => {
        it('debe retornar código 200 y el listado de socios', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/v1/socios'
            });

            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.payload);
            expect(body.data).toBeInstanceOf(Array);
            expect(body.data[0].id).toBe('1');
            expect(body.data[0].name).toBe('Socio Existente');
        });
    });

    describe('POST /api/v1/socios', () => {
        it('debe retornar 201 y crear al socio', async () => {
            const payload: CreateMemberRequest = {
                name: 'Nuevo Integracion',
                dni: '88888888',
                email: 'nuevo@test.com',
                birthdate: '1995-01-01',
                category: 'Pleno'
            };

            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/socios',
                payload
            });

            expect(response.statusCode).toBe(201);
            const body = JSON.parse(response.payload);
            expect(body.data.name).toBe('Nuevo Integracion');
            expect(body.data.id).toBeDefined();
        });

        it('debe atravesar la capa de validación y retornar 409 si el DNI existe', async () => {
            const payload: CreateMemberRequest = {
                name: 'Copia',
                dni: '12345678', // Este DNI lo mockeamos arriba como existente
                email: 'copia@test.com',
                birthdate: '1995-01-01',
                category: 'Pleno'
            };

            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/socios',
                payload
            });

            expect(response.statusCode).toBe(409);
            const body = JSON.parse(response.payload);
            expect(body.error).toBe('Ya existe un miembro con ese DNI');
        });

        it('debe retornar 400 si el email no es válido', async () => {
            const payload: CreateMemberRequest = {
                name: 'Invalido',
                dni: '11111111',
                email: 'correo-sin-arroba',
                birthdate: '1995-01-01',
                category: 'Pleno'
            };

            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/socios',
                payload
            });

            expect(response.statusCode).toBe(400);
            const body = JSON.parse(response.payload);
            expect(body.error).toBe('Formato de correo electrónico inválido');
        });
    });

    describe('DELETE /api/v1/socios/:id', () => {
        it('debe retornar 204 si se elimina correctamente', async () => {
            const response = await app.inject({
                method: 'DELETE',
                url: '/api/v1/socios/1' // Sabemos que el ID 1 existe en nuestro mock
            });

            expect(response.statusCode).toBe(204);
            expect(response.payload).toBe('');
        });

        it('debe retornar 400 si el socio a eliminar no existe', async () => {
            const response = await app.inject({
                method: 'DELETE',
                url: '/api/v1/socios/999' // No existe
            });

            expect(response.statusCode).toBe(400);
            const body = JSON.parse(response.payload);
            expect(body.error).toBe('El miembro no existe');
        });
    });
});
