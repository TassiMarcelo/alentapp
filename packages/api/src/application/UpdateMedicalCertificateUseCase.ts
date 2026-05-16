import { MedicalCertificateDTO, UpdateMedicalCertificateRequest } from '@alentapp/shared';
import { MedicalCertificateRepository } from '../domain/MedicalCertificateRepository.js';
import { MedicalCertificateValidator } from '../domain/services/MedicalCertificateValidator.js';
import { ValidationError, NotFoundError } from '../domain/errors.js';

export class UpdateMedicalCertificateUseCase {
  private validator: MedicalCertificateValidator;

  constructor(
    private readonly medicalCertificateRepository: MedicalCertificateRepository,
  ) {
    this.validator = new MedicalCertificateValidator();
  }

  async execute(
    id: string,
    data: UpdateMedicalCertificateRequest,
  ): Promise<MedicalCertificateDTO> {
    // Cuerpo de petición vacío -> 400 (TDD-0019 §Casos de Borde)
    const hasAnyField =
      data.issueDate !== undefined ||
      data.expiryDate !== undefined ||
      data.doctorLicense !== undefined ||
      data.isValidated !== undefined;

    if (!hasAnyField) {
      throw new ValidationError('Debe proporcionar al menos un campo para actualizar');
    }

    // Certificado inexistente -> 404 (TDD-0019 §Casos de Borde)
    const existing = await this.medicalCertificateRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('El certificado médico indicado no existe');
    }

    // Re-validación de fechas combinadas: si solo llega una, se compara contra
    // el valor original (TDD-0019 §Observaciones — Merge de Datos).
    if (data.issueDate !== undefined || data.expiryDate !== undefined) {
      const finalIssue = data.issueDate ?? existing.issue_date;
      const finalExpiry = data.expiryDate ?? existing.expiry_date;
      this.validator.validateDates(finalIssue, finalExpiry);
    }

    // Si isValidated pasa a true, este certificado debe quedar como el único
    // vigente del socio: se invalidan los previos de forma atómica para que
    // nunca queden dos certificados válidos (TDD-0019 §Application).
    // El member_id es inmutable, por lo que se toma del registro existente.
    if (data.isValidated === true) {
      return this.medicalCertificateRepository.runInTransaction(async (tx) => {
        await this.medicalCertificateRepository.invalidateAllByMemberId(
          existing.member_id,
          tx,
        );
        return this.medicalCertificateRepository.update(id, data, tx);
      });
    }

    // Marcar como no válido (o cambios sin tocar la vigencia) no debe activar
    // automáticamente otros certificados históricos (TDD-0019 §Criterios).
    return this.medicalCertificateRepository.update(id, data);
  }
}
