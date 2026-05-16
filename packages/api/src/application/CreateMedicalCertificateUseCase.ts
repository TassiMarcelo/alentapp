import { MedicalCertificateDTO, CreateMedicalCertificateRequest } from '@alentapp/shared';
import { MedicalCertificateRepository } from '../domain/MedicalCertificateRepository.js';
import { MemberRepository } from '../domain/MemberRepository.js';
import { MedicalCertificateValidator } from '../domain/services/MedicalCertificateValidator.js';
import { ValidationError, NotFoundError } from '../domain/errors.js';

export class CreateMedicalCertificateUseCase {
  private validator: MedicalCertificateValidator;

  constructor(
    private readonly medicalCertificateRepository: MedicalCertificateRepository,
    private readonly memberRepository: MemberRepository,
  ) {
    this.validator = new MedicalCertificateValidator();
  }

  async execute(data: CreateMedicalCertificateRequest): Promise<MedicalCertificateDTO> {
    const { memberId, issueDate, expiryDate, doctorLicense } = data;

    // Datos faltantes -> 400 (TDD-0018 §Casos de Borde)
    if (!memberId || !issueDate || !expiryDate || !doctorLicense) {
      throw new ValidationError(
        'Los campos issueDate, expiryDate, doctorLicense y memberId son obligatorios',
      );
    }

    // Vencimiento inválido / certificado caduco -> 400
    this.validator.validateDates(issueDate, expiryDate);
    this.validator.validateNotExpired(expiryDate);

    // Socio inexistente -> 404
    const member = await this.memberRepository.findById(memberId);
    if (!member) {
      throw new NotFoundError('Socio no encontrado');
    }

    // Invalidación de previos + alta del nuevo, de forma atómica ($transaction)
    // para que el socio nunca quede con dos certificados válidos (TDD-0018 §Observaciones).
    return this.medicalCertificateRepository.runInTransaction(async (tx) => {
      await this.medicalCertificateRepository.invalidateAllByMemberId(memberId, tx);
      return this.medicalCertificateRepository.save(
        {
          member_id: memberId,
          issue_date: issueDate,
          expiry_date: expiryDate,
          doctor_license: doctorLicense,
          is_validated: true, // el más reciente queda como vigente
        },
        tx,
      );
    });
  }
}
