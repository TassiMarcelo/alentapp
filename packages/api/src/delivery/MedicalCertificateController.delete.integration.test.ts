import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { FastifyInstance } from 'fastify';
import { MedicalCertificateDTO } from '@alentapp/shared';

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

// El repo simula tres estados del certificado según el id recibido:
//  - 'existing-cert-uuid'      → vigente (borrable)        → 204
//  - 'already-deleted-cert-uuid' → con deleted_at seteado  → 410
//  - cualquier otro id          → no existe                → 404
vi.mock('../infrastructure/PostgresMedicalCertificateRepository.js', () => ({
  PostgresMedicalCertificateRepository: class {
    async runInTransaction(work: (tx: unknown) => Promise<unknown>) {
      return work('tx-fake');
    }
    async invalidateAllByMemberId() { return; }
    async save() { return {} as MedicalCertificateDTO; }
    async findByMemberId() { return []; }
    async findAll() { return []; }
    async findById(id: string): Promise<MedicalCertificateDTO | null> {
      if (id === 'existing-cert-uuid') {
        return {
          id,
          member_id: 'member-uuid-1',
          issue_date: '2026-01-01',
          expiry_date: '2026-12-31',
          doctor_license: 'MP12345',
          is_validated: true,
          created_at: '2026-01-01T00:00:00.000Z',
          deleted_at: null,
        };
      }
      if (id === 'already-deleted-cert-uuid') {
        return {
          id,
          member_id: 'member-uuid-1',
          issue_date: '2026-01-01',
          expiry_date: '2026-12-31',
          doctor_license: 'MP54321',
          is_validated: false,
          created_at: '2026-01-01T00:00:00.000Z',
          deleted_at: '2026-05-01T10:00:00.000Z',
        };
      }
      return null;
    }
    async update() { return {} as MedicalCertificateDTO; }
    async delete() { return; }
  },
}));

describe('MedicalCertificate API Integration Tests — Delete', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('DELETE /api/v1/medical-certificates/:id → 204 cuando el certificado existe y está vigente', async () => {
    const response = await app.inject({
      method: 'DELETE',
      url: '/api/v1/medical-certificates/existing-cert-uuid',
    });

    expect(response.statusCode).toBe(204);
    // 204 No Content → cuerpo vacío (TDD-0020 §Contrato de API)
    expect(response.payload).toBe('');
  });

  it('DELETE /api/v1/medical-certificates/:id → 404 cuando el certificado no existe (TDD-0020 §Casos de Borde)', async () => {
    const response = await app.inject({
      method: 'DELETE',
      url: '/api/v1/medical-certificates/cert-inexistente',
    });

    expect(response.statusCode).toBe(404);
    const body = JSON.parse(response.payload);
    expect(body.message).toBe('El certificado médico no existe');
  });

  it('DELETE /api/v1/medical-certificates/:id → 410 cuando el certificado ya había sido eliminado (TDD-0020 §Casos de Borde)', async () => {
    const response = await app.inject({
      method: 'DELETE',
      url: '/api/v1/medical-certificates/already-deleted-cert-uuid',
    });

    expect(response.statusCode).toBe(410);
    const body = JSON.parse(response.payload);
    expect(body.message).toBe('El recurso ya ha sido eliminado previamente');
  });
});
