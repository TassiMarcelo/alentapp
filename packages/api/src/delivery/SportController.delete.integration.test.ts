import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { FastifyInstance } from 'fastify';

vi.hoisted(() => {
  const { config } = require('dotenv');
  config({ path: '.env.test' });
  process.env.DATABASE_URL ??= 'postgresql://placeholder:placeholder@localhost:5432/placeholder';
});

const { buildApp } = await import('../app.js');

vi.mock('../infrastructure/PostgresSportRepository.js', () => ({
  PostgresSportRepository: class {
    async findById(id: string) {
      return id === 'sport-uuid-6'
        ? { id, nombre: 'Basquet', descripcion: 'Deporte de equipo con pelota y canasta', cupoMaximo: 20, precioAdicional: 1000, esFederado: false, requires_medical_certificate: true }
        : null;
    }
    async delete() { return; }
    async getAll() { return []; }
    async findByName() { return null; }
    async create() { return {}; }
    async update() { return {}; }
    async countEnrolledMembers() { return 0; }
  },
}));

describe('Sport API Integration Tests — Delete', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('DELETE /api/v1/sports/:id → 204 eliminación exitosa', async () => {
    const response = await app.inject({
      method: 'DELETE',
      url: '/api/v1/sports/sport-uuid-6',
    });

    expect(response.statusCode).toBe(204);
    expect(response.payload).toBe('');
  });

  it('DELETE /api/v1/sports/:id → 404 si el deporte no existe', async () => {
    const response = await app.inject({
      method: 'DELETE',
      url: '/api/v1/sports/sport-uuid-inexistentee',
    });

    expect(response.statusCode).toBe(404);
    const body = JSON.parse(response.payload);
    expect(body.error).toBe('El deporte ya ha sido eliminado o no existe');
  });
});