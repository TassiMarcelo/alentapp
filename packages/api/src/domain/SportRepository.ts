import { SportDTO, CreateSportRequest, GetSportsFilters } from '@alentapp/shared';

export interface SportRepository {
  create(sport: CreateSportRequest): Promise<SportDTO>;
  findByName(nombre: string): Promise<SportDTO | null>;
  findById(id: string): Promise<SportDTO | null>;
  getAll(filters?: GetSportsFilters): Promise<{ data: SportDTO[]; total: number }>;
  update(id: string, data: Partial<SportDTO>): Promise<SportDTO>;
  countEnrolledMembers(id: string): Promise<number>;
  delete(id: string): Promise<void>;
}
