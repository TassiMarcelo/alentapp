import { MedicalCertificateRepository } from '../domain/MedicalCertificateRepository.js';
import { MedicalCertificateDTO } from '@alentapp/shared';

export class GetMedicalCertificatesUseCase {
    constructor(private readonly medicalCertificateRepo: MedicalCertificateRepository) {}

    async execute(): Promise<MedicalCertificateDTO[]> {
        return this.medicalCertificateRepo.findAll();
    }
}
