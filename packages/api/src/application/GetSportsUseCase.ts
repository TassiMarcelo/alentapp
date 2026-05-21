import { SportRepository } from '../domain/SportRepository.js';
import { SportDTO, Paginated, GetSportsFilters } from '@alentapp/shared';
import { applyPagination, buildPaginated } from './shared/paginate.js';

export class GetSportsUseCase {
    constructor(private readonly sportRepo: SportRepository) {}

    async execute(filters?: GetSportsFilters): Promise<Paginated<SportDTO>> {
        const { page, page_size } = applyPagination(filters);
        const { data, total } = await this.sportRepo.getAll({ page, page_size });
        return buildPaginated({ page, page_size, total, data });
    }
}
