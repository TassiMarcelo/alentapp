import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { FastifyInstance } from 'fastify';
import { SportDTO } from '@alentapp/shared';

vi.hoisted(() => {
  const { config } = require('dotenv');
  config({ path: '.env.test' });
  process.env.DATABASE_URL ??= 'postgresql://placeholder:placeholder@localhost:5432/placeholder';
});

const { buildApp } = await import('../app.js');

const existingSport: SportDTO = {
  id: 'sport-uuid-1',
  nombre: 'Basquet',
  descripcion: 'Deporte de equipo con pelota y canasta',
  cupoMaximo: 20,
  precioAdicional: 1000,
  esFederado: false,
  requires_medical_certificate: true,
};

vi.mock('../infrastructure/PostgresSportRepository.js', () => ({
  PostgresSportRepository: class {
    async getAll() { return [existingSport]; }
    async findById(id: string) { return id === 'sport-uuid-1' ? existingSport : null; }
    async findByName() { return null; }
    async create() { return existingSport; }
    async update(_id: string, data: Partial<SportDTO>) {
      return { ...existingSport, ...data };
    }
    async delete() { return; }
    async countEnrolledMembers() { return 0; }
  },
}));

describe('Sport API Integration Tests — Get & Update', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/v1/sports → 200 con array de deportes', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/sports',
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload);
    expect(Array.isArray(body)).toBe(true);
    expect(body).toHaveLength(1);
    expect(body[0].nombre).toBe('Basquet');
  });

  it('PUT /api/v1/sports/:id → 200 con los datos actualizados', async () => {
    const response = await app.inject({
      method: 'PUT',
      url: '/api/v1/sports/sport-uuid-1',
      payload: {
        descripcion: 'cualquier cosa actualizada',
        cupoMaximo: 30,
      },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload);
    expect(body.descripcion).toBe('cualquier cosa actualizada');
    expect(body.cupoMaximo).toBe(30);
  });
});