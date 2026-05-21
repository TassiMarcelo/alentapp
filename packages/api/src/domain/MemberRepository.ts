import { MemberDTO, UpdateMemberRequest, GetMembersFilters } from '@alentapp/shared';

// Esta interfaz es el "Puerto de Salida". El dominio dice:
// "No me importa si usás Postgres o Mongo, dame un objeto que cumpla esto".

export interface MemberRepository {
  create(member: Omit<MemberDTO, 'id'>): Promise<MemberDTO>;
  findById(id: string): Promise<MemberDTO | null>;
  findByDni(dni: string): Promise<MemberDTO | null>;
  findAll(filters?: GetMembersFilters): Promise<{ data: MemberDTO[]; total: number }>;
  update(id: string, data: UpdateMemberRequest): Promise<MemberDTO>;
  delete(id: string): Promise<void>;
}
