import { DisciplineDTO, CreateDisciplineRequest, UpdateDisciplineRequest, DisciplineStatus } from '@alentapp/shared';

export interface FindAllDisciplinesFilters {
  member_id?: string;
  status?: DisciplineStatus;
  sort_desc?: boolean;
  at?: Date;
  page?: number;
  page_size?: number;
}

export interface DisciplineRepository {
  create(data: CreateDisciplineRequest): Promise<DisciplineDTO>;
  findAll(filters: FindAllDisciplinesFilters): Promise<{ data: DisciplineDTO[]; total: number }>;
  findById(id: string): Promise<DisciplineDTO | null>;
  update(id: string, data: UpdateDisciplineRequest): Promise<DisciplineDTO>;
  softDelete(id: string): Promise<void>;
}
