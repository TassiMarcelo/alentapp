import { LockerDTO, CreateLockerRequest, GetLockersFilters } from '@alentapp/shared';
// Esta interfaz es el "Puerto de Salida". El dominio dice: 
// "No me importa si usás Postgres o Mongo, dame un objeto que cumpla esto".


export interface LockerRepository {
  findByNumero(numero: number): Promise<LockerDTO | null>;
  count(): Promise<number>;
  create(data: CreateLockerRequest): Promise<LockerDTO>;
  findAll(filters?: GetLockersFilters): Promise<LockerDTO[]>;
}

