import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UpdateMedicalCertificateUseCase } from './UpdateMedicalCertificateUseCase.js';
import { MedicalCertificateRepository } from '../domain/MedicalCertificateRepository.js';
import { MedicalCertificateDTO } from '@alentapp/shared';
import { ValidationError, NotFoundError } from '../domain/errors.js';

describe('UpdateMedicalCertificateUseCase', () => {
  const mockRepo = {
    invalidateAllByMemberId: vi.fn(),
    save: vi.fn(),
    runInTransaction: vi.fn(),
    findByMemberId: vi.fn(),
    findAll: vi.fn(),
    findById: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  } as unknown as MedicalCertificateRepository;

  const useCase = new UpdateMedicalCertificateUseCase(mockRepo);

  const existingCert: MedicalCertificateDTO = {
    id: 'cert-uuid-1',
    member_id: 'member-uuid-1',
    issue_date: '2026-01-01',
    expiry_date: '2026-12-31',
    doctor_license: 'MP12345',
    is_validated: false,
    created_at: '2026-01-01T00:00:00.000Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(mockRepo.findById).mockResolvedValue(existingCert);
    // Mapea los campos camelCase de la petición a las claves snake_case del DTO,
    // como haría el repositorio real (un spread directo dejaría is_validated sin tocar).
    vi.mocked(mockRepo.update).mockImplementation(
      async (_id, data) =>
        ({
          ...existingCert,
          issue_date: data.issueDate ?? existingCert.issue_date,
          expiry_date: data.expiryDate ?? existingCert.expiry_date,
          doctor_license: data.doctorLicense ?? existingCert.doctor_license,
          is_validated: data.isValidated ?? existingCert.is_validated,
        }) as unknown as MedicalCertificateDTO,
    );
    // Ejecuta el callback transaccional con un tx opaco, como hace Prisma.$transaction.
    vi.mocked(mockRepo.runInTransaction).mockImplementation((work: any) => work('tx-client'));
    vi.mocked(mockRepo.invalidateAllByMemberId).mockResolvedValue(undefined);
  });

  it('debe lanzar ValidationError 400 cuando el cuerpo de la petición está vacío (TDD-0019 §Casos de Borde)', async () => {
    await expect(useCase.execute('cert-uuid-1', {})).rejects.toThrow(ValidationError);
    await expect(useCase.execute('cert-uuid-1', {})).rejects.toThrow(
      'Debe proporcionar al menos un campo para actualizar',
    );
    expect(mockRepo.findById).not.toHaveBeenCalled();
    expect(mockRepo.update).not.toHaveBeenCalled();
  });

  it('debe lanzar NotFoundError 404 cuando el certificado indicado no existe (TDD-0019 §Casos de Borde)', async () => {
    // El test ejecuta execute() dos veces (tipo y mensaje), así que el mock
    // debe devolver null en ambas llamadas, no solo en la primera.
    vi.mocked(mockRepo.findById).mockResolvedValue(null);

    await expect(
      useCase.execute('cert-inexistente', { doctorLicense: 'MP-NEW' }),
    ).rejects.toThrow(NotFoundError);
    await expect(
      useCase.execute('cert-inexistente', { doctorLicense: 'MP-NEW' }),
    ).rejects.toThrow('El certificado médico indicado no existe');
    expect(mockRepo.update).not.toHaveBeenCalled();
  });

  it('debe re-validar combinando el valor enviado con el original cuando solo se actualiza una fecha (TDD-0019 §Observaciones — Merge de Datos)', async () => {
    // Solo llega expiryDate anterior al issue_date original (2026-01-01) → debe fallar.
    await expect(
      useCase.execute('cert-uuid-1', { expiryDate: '2025-06-01' }),
    ).rejects.toThrow(ValidationError);
    await expect(
      useCase.execute('cert-uuid-1', { expiryDate: '2025-06-01' }),
    ).rejects.toThrow('La expiryDate debe ser estrictamente posterior a issueDate');
    expect(mockRepo.update).not.toHaveBeenCalled();
  });

  it('debe invalidar los certificados previos del socio dentro de una transacción cuando isValidated pasa a true (TDD-0019 §Application)', async () => {
    const result = await useCase.execute('cert-uuid-1', { isValidated: true });

    expect(mockRepo.findById).toHaveBeenCalledWith('cert-uuid-1');
    expect(mockRepo.runInTransaction).toHaveBeenCalledTimes(1);
    expect(mockRepo.invalidateAllByMemberId).toHaveBeenCalledWith('member-uuid-1', 'tx-client');
    expect(mockRepo.update).toHaveBeenCalledWith('cert-uuid-1', { isValidated: true }, 'tx-client');
    expect(result.is_validated).toBe(true);
  });
});
