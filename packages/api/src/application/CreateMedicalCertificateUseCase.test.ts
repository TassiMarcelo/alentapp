import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreateMedicalCertificateUseCase } from './CreateMedicalCertificateUseCase.js';
import { MedicalCertificateRepository } from '../domain/MedicalCertificateRepository.js';
import { MemberRepository } from '../domain/MemberRepository.js';
import { CreateMedicalCertificateRequest, MedicalCertificateDTO } from '@alentapp/shared';
import { ValidationError, NotFoundError } from '../domain/errors.js';

describe('CreateMedicalCertificateUseCase', () => {
  const mockCertRepo = {
    invalidateAllByMemberId: vi.fn(),
    save: vi.fn(),
    runInTransaction: vi.fn(),
    findByMemberId: vi.fn(),
    findAll: vi.fn(),
    findById: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  } as unknown as MedicalCertificateRepository;

  const mockMemberRepo = {
    findById: vi.fn(),
  } as unknown as MemberRepository;

  const useCase = new CreateMedicalCertificateUseCase(mockCertRepo, mockMemberRepo);

  // Fecha futura para que validateNotExpired no rechace el certificado.
  const baseRequest: CreateMedicalCertificateRequest = {
    memberId: 'member-uuid-1',
    issueDate: '2026-06-01',
    expiryDate: '2027-06-01',
    doctorLicense: 'MP12345',
  };

  const savedCert: MedicalCertificateDTO = {
    id: 'cert-uuid-1',
    member_id: 'member-uuid-1',
    issue_date: '2026-06-01',
    expiry_date: '2027-06-01',
    doctor_license: 'MP12345',
    is_validated: true,
    created_at: '2026-05-30T00:00:00.000Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Ejecuta el callback transaccional con un tx opaco, como hace Prisma.$transaction.
    vi.mocked(mockCertRepo.runInTransaction).mockImplementation((work: any) => work('tx-client'));
    vi.mocked(mockCertRepo.invalidateAllByMemberId).mockResolvedValue(undefined);
    vi.mocked(mockCertRepo.save).mockResolvedValue(savedCert);
  });

  it('debe registrar el certificado invalidando los previos dentro de una transacción (TDD-0018 §Observaciones)', async () => {
    vi.mocked(mockMemberRepo.findById).mockResolvedValueOnce({ id: 'member-uuid-1' } as any);

    const result = await useCase.execute(baseRequest);

    expect(mockMemberRepo.findById).toHaveBeenCalledWith('member-uuid-1');
    expect(mockCertRepo.runInTransaction).toHaveBeenCalledTimes(1);
    expect(mockCertRepo.invalidateAllByMemberId).toHaveBeenCalledWith('member-uuid-1', 'tx-client');
    expect(mockCertRepo.save).toHaveBeenCalledWith(
      {
        member_id: 'member-uuid-1',
        issue_date: '2026-06-01',
        expiry_date: '2027-06-01',
        doctor_license: 'MP12345',
        is_validated: true,
      },
      'tx-client',
    );
    expect(result).toEqual(savedCert);
  });

  it('debe lanzar ValidationError 400 cuando falta algún campo obligatorio (TDD-0018 §Casos de Borde)', async () => {
    const invalid = { ...baseRequest, doctorLicense: '' };

    await expect(useCase.execute(invalid)).rejects.toThrow(ValidationError);
    await expect(useCase.execute(invalid)).rejects.toThrow(
      'Los campos issueDate, expiryDate, doctorLicense y memberId son obligatorios',
    );
    expect(mockMemberRepo.findById).not.toHaveBeenCalled();
    expect(mockCertRepo.runInTransaction).not.toHaveBeenCalled();
  });

  it('debe lanzar ValidationError cuando expiryDate no es estrictamente posterior a issueDate', async () => {
    const invalid: CreateMedicalCertificateRequest = {
      ...baseRequest,
      issueDate: '2027-06-01',
      expiryDate: '2027-06-01',
    };

    await expect(useCase.execute(invalid)).rejects.toThrow(
      'La expiryDate debe ser estrictamente posterior a issueDate',
    );
    expect(mockMemberRepo.findById).not.toHaveBeenCalled();
    expect(mockCertRepo.save).not.toHaveBeenCalled();
  });

  it('debe lanzar NotFoundError 404 cuando el socio no existe (TDD-0018 §Casos de Borde)', async () => {
    vi.mocked(mockMemberRepo.findById).mockResolvedValueOnce(null);

    await expect(useCase.execute(baseRequest)).rejects.toThrow(NotFoundError);
    await expect(useCase.execute(baseRequest)).rejects.toThrow('Socio no encontrado');
    expect(mockCertRepo.runInTransaction).not.toHaveBeenCalled();
    expect(mockCertRepo.save).not.toHaveBeenCalled();
  });
});
