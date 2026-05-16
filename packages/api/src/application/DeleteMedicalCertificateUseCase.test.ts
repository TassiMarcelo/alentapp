import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DeleteMedicalCertificateUseCase } from './DeleteMedicalCertificateUseCase.js';
import { MedicalCertificateRepository } from '../domain/MedicalCertificateRepository.js';
import { MedicalCertificateDTO } from '@alentapp/shared';
import { NotFoundError, GoneError } from '../domain/errors.js';

describe('DeleteMedicalCertificateUseCase', () => {
  const mockRepo = {
    findById: vi.fn(),
    delete: vi.fn(),
  } as unknown as MedicalCertificateRepository;

  const useCase = new DeleteMedicalCertificateUseCase(mockRepo);

  const mockCert: MedicalCertificateDTO = {
    id: 'cert-1',
    member_id: 'member-1',
    issue_date: '2026-01-01',
    expiry_date: '2026-12-31',
    doctor_license: 'MP12345',
    is_validated: true,
    created_at: '2026-01-01T00:00:00.000Z',
    deleted_at: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(mockRepo.findById).mockResolvedValue(mockCert);
    vi.mocked(mockRepo.delete).mockResolvedValue(undefined);
  });

  it('lanza NotFoundError si el certificado no existe y no intenta eliminar', async () => {
    vi.mocked(mockRepo.findById).mockResolvedValue(null);

    await expect(useCase.execute('cert-no')).rejects.toThrow(NotFoundError);
    await expect(useCase.execute('cert-no')).rejects.toThrow(
      'El certificado médico no existe',
    );
    expect(mockRepo.delete).not.toHaveBeenCalled();
  });

  it('lanza GoneError si el certificado ya fue eliminado previamente', async () => {
    vi.mocked(mockRepo.findById).mockResolvedValue({
      ...mockCert,
      deleted_at: '2026-05-01T10:00:00.000Z',
    });

    await expect(useCase.execute('cert-1')).rejects.toThrow(GoneError);
    await expect(useCase.execute('cert-1')).rejects.toThrow(
      'El recurso ya ha sido eliminado previamente',
    );
    expect(mockRepo.delete).not.toHaveBeenCalled();
  });

  it('realiza el borrado lógico cuando el certificado existe y está vigente', async () => {
    await useCase.execute('cert-1');

    expect(mockRepo.findById).toHaveBeenCalledWith('cert-1');
    expect(mockRepo.delete).toHaveBeenCalledWith('cert-1');
  });
});
