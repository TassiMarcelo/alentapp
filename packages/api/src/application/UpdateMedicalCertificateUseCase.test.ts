import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UpdateMedicalCertificateUseCase } from './UpdateMedicalCertificateUseCase.js';
import { MedicalCertificateRepository } from '../domain/MedicalCertificateRepository.js';
import { MedicalCertificateDTO } from '@alentapp/shared';
import { ValidationError, NotFoundError } from '../domain/errors.js';

describe('UpdateMedicalCertificateUseCase', () => {
  const mockRepo = {
    findById: vi.fn(),
    update: vi.fn(),
    invalidateAllByMemberId: vi.fn(),
    runInTransaction: vi.fn(),
  } as unknown as MedicalCertificateRepository;

  const useCase = new UpdateMedicalCertificateUseCase(mockRepo);

  const mockExisting: MedicalCertificateDTO = {
    id: 'cert-1',
    member_id: 'member-1',
    issue_date: '2026-01-01',
    expiry_date: '2026-12-31',
    doctor_license: 'MP12345',
    is_validated: false,
    created_at: '2026-01-01T00:00:00.000Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(mockRepo.findById).mockResolvedValue(mockExisting);
    vi.mocked(mockRepo.update).mockImplementation(
      async (_id, data) => ({ ...mockExisting, ...data }) as unknown as MedicalCertificateDTO,
    );
    // Ejecuta el callback transaccional pasándole un tx opaco.
    vi.mocked(mockRepo.runInTransaction).mockImplementation((work: any) => work('tx-client'));
  });

  it('rechaza un cuerpo de petición vacío con 400 (ValidationError)', async () => {
    await expect(useCase.execute('cert-1', {})).rejects.toThrow(ValidationError);
    await expect(useCase.execute('cert-1', {})).rejects.toThrow(
      'Debe proporcionar al menos un campo para actualizar',
    );
  });

  it('lanza NotFoundError si el certificado no existe', async () => {
    vi.mocked(mockRepo.findById).mockResolvedValueOnce(null);
    await expect(
      useCase.execute('cert-no', { doctorLicense: 'MP999' }),
    ).rejects.toThrow(NotFoundError);
  });

  it('re-valida fechas combinando el valor enviado con el original (merge)', async () => {
    // Solo se envía expiryDate anterior al issue_date original -> debe fallar.
    await expect(
      useCase.execute('cert-1', { expiryDate: '2025-06-01' }),
    ).rejects.toThrow('La expiryDate debe ser estrictamente posterior a issueDate');
  });

  it('no valida fechas si solo se actualiza la matrícula', async () => {
    await useCase.execute('cert-1', { doctorLicense: 'MP-NEW' });
    expect(mockRepo.update).toHaveBeenCalledWith('cert-1', { doctorLicense: 'MP-NEW' });
    expect(mockRepo.runInTransaction).not.toHaveBeenCalled();
  });

  it('invalida los certificados previos del socio cuando isValidated pasa a true', async () => {
    await useCase.execute('cert-1', { isValidated: true });

    expect(mockRepo.runInTransaction).toHaveBeenCalledTimes(1);
    expect(mockRepo.invalidateAllByMemberId).toHaveBeenCalledWith('member-1', 'tx-client');
    expect(mockRepo.update).toHaveBeenCalledWith('cert-1', { isValidated: true }, 'tx-client');
  });

  it('al marcar isValidated=false NO activa ni invalida otros certificados', async () => {
    await useCase.execute('cert-1', { isValidated: false });

    expect(mockRepo.invalidateAllByMemberId).not.toHaveBeenCalled();
    expect(mockRepo.runInTransaction).not.toHaveBeenCalled();
    expect(mockRepo.update).toHaveBeenCalledWith('cert-1', { isValidated: false });
  });
});
