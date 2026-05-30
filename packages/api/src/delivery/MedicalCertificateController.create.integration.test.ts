import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { FastifyInstance } from 'fastify';
import { CreateMedicalCertificateRequest, MedicalCertificateDTO } from '@alentapp/shared';

vi.hoisted(() => {
  const { config } = require('dotenv');
  config({ path: '.env.test' });
  process.env.DATABASE_URL ??= 'postgresql://placeholder:placeholder@localhost:5432/placeholder';
});

const { buildApp } = await import('../app.js');

// El repo de Members responde "existe" solo para 'existing-member-uuid'.
vi.mock('../infrastructure/PostgresMemberRepository.js', () => ({
  PostgresMemberRepository: class {
    async findAll() { return []; }
    async findById(id: string) {
      return id === 'existing-member-uuid'
        ? { id, name: 'Socio Existente', dni: '11111111', birthdate: '1990-01-01' }
        : null;
    }
    async findByDni() { return null; }
    async create() { return {}; }
    async update() { return {}; }
    async delete() { return; }
  },
}));

// El repo de MedicalCertificate ejecuta la "transacción" pasando un tx opaco al callback
// — alcanza para verificar que se invaliden los previos y se persista el nuevo.
vi.mock('../infrastructure/PostgresMedicalCertificateRepository.js', () => ({
  PostgresMedicalCertificateRepository: class {
    async runInTransaction(work: (tx: unknown) => Promise<unknown>) {
      return work('tx-fake');
    }
    async invalidateAllByMemberId() { return; }
    async save(data: any): Promise<MedicalCertificateDTO> {
      return {
        id: 'created-cert-uuid',
        member_id: data.member_id,
        issue_date: data.issue_date,
        expiry_date: data.expiry_date,
        doctor_license: data.doctor_license,
        is_validated: data.is_validated,
        created_at: '2026-05-30T00:00:00.000Z',
      };
    }
    async findByMemberId() { return []; }
    async findAll() { return []; }
    async findById() { return null; }
    async update() { return {} as MedicalCertificateDTO; }
    async delete() { return; }
  },
}));

describe('MedicalCertificate API Integration Tests — Create', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /api/v1/medical-certificates → 201 cuando el payload es válido y el socio existe', async () => {
    const payload: CreateMedicalCertificateRequest = {
      memberId: 'existing-member-uuid',
      issueDate: '2026-06-01',
      expiryDate: '2027-06-01',
      doctorLicense: 'MP12345',
    };

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/medical-certificates',
      payload,
    });

    expect(response.statusCode).toBe(201);
    const body = JSON.parse(response.payload);
    expect(body.id).toBe('created-cert-uuid');
    expect(body.member_id).toBe('existing-member-uuid');
    expect(body.doctor_license).toBe('MP12345');
    // El más reciente debe quedar marcado como vigente (TDD-0018 §Observaciones).
    expect(body.is_validated).toBe(true);
  });

  it('POST /api/v1/medical-certificates → 400 cuando falta un campo obligatorio (TDD-0018 §Casos de Borde)', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/medical-certificates',
      payload: {
        memberId: 'existing-member-uuid',
        issueDate: '2026-06-01',
        expiryDate: '2027-06-01',
        // doctorLicense ausente
      },
    });

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.payload);
    expect(body.message).toBe(
      'Los campos issueDate, expiryDate, doctorLicense y memberId son obligatorios',
    );
  });

  it('POST /api/v1/medical-certificates → 404 cuando el socio referenciado no existe', async () => {
    const payload: CreateMedicalCertificateRequest = {
      memberId: 'member-inexistente',
      issueDate: '2026-06-01',
      expiryDate: '2027-06-01',
      doctorLicense: 'MP99999',
    };

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/medical-certificates',
      payload,
    });

    expect(response.statusCode).toBe(404);
    const body = JSON.parse(response.payload);
    expect(body.message).toBe('Socio no encontrado');
  });
});
