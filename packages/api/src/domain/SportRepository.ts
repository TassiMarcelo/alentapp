import { SportDTO, CreateSportRequest } from '@alentapp/shared';

export interface SportRepository {
  create(sport: CreateSportRequest): Promise<SportDTO>;
  findByName(nombre: string): Promise<SportDTO | null>;
}
