import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { FastifyInstance } from 'fastify';
import { UpdateMedicalCertificateRequest, MedicalCertificateDTO } from '@alentapp/shared';

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

// El repo de MedicalCertificate retorna el certificado solo si el id es 'existing-cert-uuid'
// y refleja en update el diff recibido — alcanza para verificar el mapeo del controller.
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
      return id === 'existing-cert-uuid'
        ? {
            id,
            member_id: 'member-uuid-1',
            issue_date: '2026-01-01',
            expiry_date: '2026-12-31',
            doctor_license: 'MP12345',
            is_validated: false,
            created_at: '2026-01-01T00:00:00.000Z',
          }
        : null;
    }
    async update(id: string, data: UpdateMedicalCertificateRequest): Promise<MedicalCertificateDTO> {
      return {
        id,
        member_id: 'member-uuid-1',
        issue_date: data.issueDate ?? '2026-01-01',
        expiry_date: data.expiryDate ?? '2026-12-31',
        doctor_license: data.doctorLicense ?? 'MP12345',
        is_validated: data.isValidated ?? false,
        created_at: '2026-01-01T00:00:00.000Z',
      };
    }
    async delete() { return; }
  },
}));

describe('MedicalCertificate API Integration Tests — Update', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('PATCH /api/v1/medical-certificates/:id → 200 cuando el payload es válido', async () => {
    const payload: UpdateMedicalCertificateRequest = {
      doctorLicense: 'MP-UPDATED',
    };

    const response = await app.inject({
      method: 'PATCH',
      url: '/api/v1/medical-certificates/existing-cert-uuid',
      payload,
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload);
    expect(body.id).toBe('existing-cert-uuid');
    expect(body.doctor_license).toBe('MP-UPDATED');
    // member_id no debe haber cambiado tras la edición (TDD-0019 §Criterios).
    expect(body.member_id).toBe('member-uuid-1');
  });

  it('PATCH /api/v1/medical-certificates/:id → 400 cuando se intenta modificar member_id (TDD-0019 §Casos de Borde)', async () => {
    const response = await app.inject({
      method: 'PATCH',
      url: '/api/v1/medical-certificates/existing-cert-uuid',
      payload: { memberId: 'otro-socio-uuid', doctorLicense: 'MP-OTHER' },
    });

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.payload);
    expect(body.message).toBe('El campo member_id no puede modificarse');
  });

  it('PATCH /api/v1/medical-certificates/:id → 404 cuando el certificado indicado no existe (TDD-0019 §Casos de Borde)', async () => {
    const response = await app.inject({
      method: 'PATCH',
      url: '/api/v1/medical-certificates/cert-inexistente',
      payload: { doctorLicense: 'MP-NEW' } as UpdateMedicalCertificateRequest,
    });

    expect(response.statusCode).toBe(404);
    const body = JSON.parse(response.payload);
    expect(body.message).toBe('El certificado médico indicado no existe');
  });
});
