import { DisciplineDTO, CreateDisciplineRequest, DisciplineStatus } from '@alentapp/shared';

export interface FindAllDisciplinesFilters {
  member_id?: string;
  status?: DisciplineStatus;
  sort_desc?: boolean;
  at?: Date;
}

export interface DisciplineRepository {
  create(data: CreateDisciplineRequest): Promise<DisciplineDTO>;
  findAll(filters: FindAllDisciplinesFilters): Promise<DisciplineDTO[]>;
}
