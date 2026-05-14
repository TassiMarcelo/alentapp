import { DisciplineDTO, ListDisciplinesFilters } from '@alentapp/shared';
import { DisciplineRepository } from '../domain/DisciplineRepository.js';

export class ListDisciplinesUseCase {
  constructor(private readonly disciplineRepository: DisciplineRepository) {}

  async execute(filters: ListDisciplinesFilters): Promise<DisciplineDTO[]> {
    return this.disciplineRepository.findAll({
      member_id: filters.member_id,
      status: filters.status,
      sort_desc: filters.sort_desc ?? true,
      at: filters.status ? new Date() : undefined,
    });
  }
}
