import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { FastifyInstance } from 'fastify';
import { CreateDisciplineRequest } from '@alentapp/shared';

vi.hoisted(() => {
  const { config } = require('dotenv');
  config({ path: '.env.test' });
  process.env.DATABASE_URL ??= 'postgresql://placeholder:placeholder@localhost:5432/placeholder';
});

const { buildApp } = await import('../app.js');

vi.mock('../infrastructure/PostgresMemberRepository.js', () => ({
  PostgresMemberRepository: class {
    async findAll() { return []; }
    async findById(id: string) {
      return id === 'existing-member-uuid' ? { id, name: 'Socio Existente', birthdate: '1990-01-01' } : null;
    }
    async findByDni() { return null; }
    async create() { return {}; }
    async update() { return {}; }
    async delete() { return; }
  },
}));

vi.mock('../infrastructure/PostgresDisciplineRepository.js', () => ({
  PostgresDisciplineRepository: class {
    async create(data: CreateDisciplineRequest) {
      return { id: 'created-discipline-uuid', ...data };
    }
    async findAll() { return []; }
    async findById() { return null; }
    async update() { return {}; }
    async softDelete() { return; }
  },
}));

describe('Discipline API Integration Tests — Create', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('debe retornar 201 cuando el payload es válido y el socio existe', async () => {
    const payload: CreateDisciplineRequest = {
      reason: 'Conducta antideportiva',
      start_date: '2026-05-01T00:00:00Z',
      end_date: '2026-05-15T00:00:00Z',
      is_total_suspension: true,
      member_id: 'existing-member-uuid',
    };

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/disciplines',
      payload,
    });

    expect(response.statusCode).toBe(201);
    const body = JSON.parse(response.payload);
    expect(body.id).toBe('created-discipline-uuid');
    expect(body.reason).toBe('Conducta antideportiva');
    expect(body.member_id).toBe('existing-member-uuid');
  });

  it('debe retornar 400 cuando end_date es igual o anterior a start_date', async () => {
    const payload: CreateDisciplineRequest = {
      reason: 'Falta menor',
      start_date: '2026-05-15T00:00:00Z',
      end_date: '2026-05-15T00:00:00Z',
      is_total_suspension: false,
      member_id: 'existing-member-uuid',
    };

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/disciplines',
      payload,
    });

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.payload);
    expect(body.error).toBe('La fecha de fin debe ser posterior a la de inicio');
  });
});
