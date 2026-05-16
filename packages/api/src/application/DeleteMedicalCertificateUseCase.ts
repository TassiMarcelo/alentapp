import { MedicalCertificateRepository } from '../domain/MedicalCertificateRepository.js';
import { NotFoundError, GoneError } from '../domain/errors.js';

export class DeleteMedicalCertificateUseCase {
  constructor(
    private readonly medicalCertificateRepository: MedicalCertificateRepository,
  ) {}

  // TDD-0020 §Application: coordina la búsqueda del certificado y ejecuta el
  // borrado lógico a través del repositorio.
  async execute(id: string): Promise<void> {
    const existing = await this.medicalCertificateRepository.findById(id);

    // Certificado no encontrado -> 404 (TDD-0020 §Casos de Borde)
    if (!existing) {
      throw new NotFoundError('El certificado médico no existe');
    }

    // Certificado ya eliminado -> 410 (TDD-0020 §Casos de Borde)
    if (existing.deleted_at) {
      throw new GoneError('El recurso ya ha sido eliminado previamente');
    }

    // Borrado lógico (soft delete): setea deleted_at en el repositorio.
    await this.medicalCertificateRepository.delete(id);
  }
}
