import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { FastifyInstance } from 'fastify';

vi.hoisted(() => {
  const { config } = require('dotenv');
  config({ path: '.env.test' });
  process.env.DATABASE_URL ??= 'postgresql://placeholder:placeholder@localhost:5432/placeholder';
});

const { buildApp } = await import('../app.js');

const existingDiscipline = {
  id: 'discipline-uuid-1',
  reason: 'Falta grave',
  start_date: '2026-06-01T00:00:00Z',
  end_date: '2026-06-30T00:00:00Z',
  is_total_suspension: true,
  member_id: 'member-uuid-1',
};

vi.mock('../infrastructure/PostgresMemberRepository.js', () => ({
  PostgresMemberRepository: class {
    async findAll() { return []; }
    async findById() { return null; }
    async findByDni() { return null; }
    async create() { return {}; }
    async update() { return {}; }
    async delete() { return; }
  },
}));

vi.mock('../infrastructure/PostgresDisciplineRepository.js', () => ({
  PostgresDisciplineRepository: class {
    async create() { return {}; }
    async findAll() { return []; }
    async findById(id: string) {
      return id === existingDiscipline.id ? existingDiscipline : null;
    }
    async update() { return existingDiscipline; }
    async softDelete() { return; }
  },
}));

describe('Discipline API Integration Tests — Delete', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('DELETE /api/v1/disciplines/:id con una sanción existente → 204 sin contenido', async () => {
    const response = await app.inject({
      method: 'DELETE',
      url: `/api/v1/disciplines/${existingDiscipline.id}`,
    });

    expect(response.statusCode).toBe(204);
    expect(response.payload).toBe('');
  });

  it('DELETE /api/v1/disciplines/:id con una sanción inexistente → 404 con `La sanción indicada no existe`', async () => {
    const response = await app.inject({
      method: 'DELETE',
      url: '/api/v1/disciplines/discipline-inexistente',
    });

    expect(response.statusCode).toBe(404);
    const body = JSON.parse(response.payload);
    expect(body.error).toBe('La sanción indicada no existe');
  });
});
