import { MemberRepository } from '../domain/MemberRepository.js';
import { MemberDTO, Paginated, GetMembersFilters } from '@alentapp/shared';
import { applyPagination, buildPaginated } from './shared/paginate.js';

export class GetMembersUseCase {
    constructor(private readonly memberRepo: MemberRepository) {}

    async execute(filters?: GetMembersFilters): Promise<Paginated<MemberDTO>> {
        const { page, page_size } = applyPagination(filters);
        const { data, total } = await this.memberRepo.findAll({ page, page_size });
        return buildPaginated({ page, page_size, total, data });
    }
}
