import { MedicalCertificateRepository } from '../domain/MedicalCertificateRepository.js';
import { MedicalCertificateDTO, Paginated, GetMedicalCertificatesFilters } from '@alentapp/shared';
import { applyPagination, buildPaginated } from './shared/paginate.js';

export class GetMedicalCertificatesUseCase {
    constructor(private readonly medicalCertificateRepo: MedicalCertificateRepository) {}

    async execute(filters?: GetMedicalCertificatesFilters): Promise<Paginated<MedicalCertificateDTO>> {
        const { page, page_size } = applyPagination(filters);
        const { data, total } = await this.medicalCertificateRepo.findAll({ page, page_size });
        return buildPaginated({ page, page_size, total, data });
    }
}
