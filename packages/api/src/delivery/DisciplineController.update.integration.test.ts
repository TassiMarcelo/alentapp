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
  reason: 'Falta original',
  start_date: '2026-06-01T00:00:00Z',
  end_date: '2026-06-30T00:00:00Z',
  is_total_suspension: false,
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
    async update(id: string, data: Record<string, unknown>) {
      return { ...existingDiscipline, ...data, id };
    }
    async softDelete() { return; }
  },
}));

describe('Discipline API Integration Tests — Update', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('PATCH /api/v1/disciplines/:id con body válido → 200 con los campos actualizados', async () => {
    const response = await app.inject({
      method: 'PATCH',
      url: `/api/v1/disciplines/${existingDiscipline.id}`,
      payload: { reason: 'Motivo actualizado' },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload);
    expect(body.id).toBe(existingDiscipline.id);
    expect(body.reason).toBe('Motivo actualizado');
  });

  it('PATCH /api/v1/disciplines/:id con member_id en el body → 400 con `El campo `member_id` no puede modificarse`', async () => {
    const response = await app.inject({
      method: 'PATCH',
      url: `/api/v1/disciplines/${existingDiscipline.id}`,
      payload: { member_id: 'otro-member-uuid' },
    });

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.payload);
    expect(body.error).toBe('El campo `member_id` no puede modificarse');
  });
});
