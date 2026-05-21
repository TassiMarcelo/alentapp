import { DisciplineDTO, ListDisciplinesFilters, Paginated } from '@alentapp/shared';
import { DisciplineRepository } from '../domain/DisciplineRepository.js';
import { applyPagination, buildPaginated } from './shared/paginate.js';

export class ListDisciplinesUseCase {
  constructor(private readonly disciplineRepository: DisciplineRepository) {}

  async execute(filters: ListDisciplinesFilters): Promise<Paginated<DisciplineDTO>> {
    const { page, page_size } = applyPagination(filters);
    const { data, total } = await this.disciplineRepository.findAll({
      member_id: filters.member_id,
      status: filters.status,
      sort_desc: filters.sort_desc ?? true,
      at: filters.status ? new Date() : undefined,
      page,
      page_size,
    });
    return buildPaginated({ page, page_size, total, data });
  }
}
