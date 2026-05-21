import { PaymentRepository } from '../domain/PaymentRepository.js';
import { PaymentDTO, Paginated, GetPaymentsFilters } from '@alentapp/shared';
import { applyPagination, buildPaginated } from './shared/paginate.js';

export class GetPaymentsUseCase {
    constructor(private readonly paymentRepo: PaymentRepository) {}

    async execute(filters?: GetPaymentsFilters): Promise<Paginated<PaymentDTO>> {
        const { page, page_size } = applyPagination(filters);
        const { data, total } = await this.paymentRepo.findAll({ page, page_size });
        return buildPaginated({ page, page_size, total, data });
    }
}
