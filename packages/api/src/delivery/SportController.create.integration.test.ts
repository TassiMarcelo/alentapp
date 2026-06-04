import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { FastifyInstance } from 'fastify';
import { CreateSportRequest } from '@alentapp/shared';

vi.hoisted(() => {
  const { config } = require('dotenv');
  config({ path: '.env.test' });
  process.env.DATABASE_URL ??= 'postgresql://placeholder:placeholder@localhost:5432/placeholder';
});

const { buildApp } = await import('../app.js');

vi.mock('../infrastructure/PostgresSportRepository.js', () => ({
  PostgresSportRepository: class {
    async create(data: CreateSportRequest) {
      return { id: 'created-sport-uuid', ...data };
    }
    async findByName(nombre: string) {
      return nombre === 'Basquet' ? { id: 'existing-sport-uuid', nombre, descripcion: 'Deporte de equipo con pelota y canasta', cupoMaximo: 20, precioAdicional: 500, esFederado: false, requires_medical_certificate: true } : null;
    }
    async getAll() { return []; }
    async findById() { return null; }
    async update() { return {}; }
    async delete() { return; }
    async countEnrolledMembers() { return 0; }
  },
}));

describe('Sport API Integration Tests — Create', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /api/v1/sports → 201 con el deporte creado', async () => {
    const payload: CreateSportRequest = {
      nombre: 'Tenis',
      descripcion: 'Deporte de raqueta individual o por parejas',
      cupoMaximo: 15,
      precioAdicional: 300,
      esFederado: true,
      requires_medical_certificate: false,
    };

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/sports',
      payload,
    });

    expect(response.statusCode).toBe(201);
    const body = JSON.parse(response.payload);
    expect(body.id).toBe('created-sport-uuid');
    expect(body.nombre).toBe('Tenis');
  });

  it('POST /api/v1/sports → 409 si el nombre ya existe', async () => {
    const payload: CreateSportRequest = {
      nombre: 'Basquet',
      descripcion: 'Deporte de equipo con pelota y canasta',
      cupoMaximo: 20,
      precioAdicional: 500,
      esFederado: false,
      requires_medical_certificate: true,
    };

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/sports',
      payload,
    });

    expect(response.statusCode).toBe(409);
    const body = JSON.parse(response.payload);
    expect(body.error).toBe('Ya existe un deporte con ese nombre');
  });
});