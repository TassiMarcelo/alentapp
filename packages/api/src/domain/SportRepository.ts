import { SportDTO, CreateSportRequest } from '@alentapp/shared';

export interface SportRepository {
  create(sport: CreateSportRequest): Promise<SportDTO>;
  findByName(nombre: string): Promise<SportDTO | null>;
  findById(id: string): Promise<SportDTO | null>;
  getAll(): Promise<SportDTO[]>;
  update(id: string, data: Partial<SportDTO>): Promise<SportDTO>;
  countEnrolledMembers(id: string): Promise<number>;
  delete(id: string): Promise<void>;
}
