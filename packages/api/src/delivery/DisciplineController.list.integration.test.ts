import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { FastifyInstance } from 'fastify';

vi.hoisted(() => {
  const { config } = require('dotenv');
  config({ path: '.env.test' });
  process.env.DATABASE_URL ??= 'postgresql://placeholder:placeholder@localhost:5432/placeholder';
});

const { buildApp } = await import('../app.js');

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
    async findById() { return null; }
    async update() { return {}; }
    async softDelete() { return; }
  },
}));

describe('Discipline API Integration Tests — List', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('debe retornar 400 cuando el filtro status no es uno de los valores permitidos', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/disciplines?status=loquesea',
    });

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.payload);
    expect(body.error).toBe('Filtro `status` inválido');
  });
});
