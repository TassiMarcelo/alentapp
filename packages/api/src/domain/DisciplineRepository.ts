import { DisciplineDTO, CreateDisciplineRequest } from '@alentapp/shared';

export interface DisciplineRepository {
  create(data: CreateDisciplineRequest): Promise<DisciplineDTO>;
}
