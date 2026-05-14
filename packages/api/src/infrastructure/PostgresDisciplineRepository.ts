import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/client/client.js';
import { DisciplineRepository } from '../domain/DisciplineRepository.js';
import { DisciplineDTO, CreateDisciplineRequest } from '@alentapp/shared';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg(process.env.DATABASE_URL),
});

export class PostgresDisciplineRepository implements DisciplineRepository {
  async create(data: CreateDisciplineRequest): Promise<DisciplineDTO> {
    const discipline = await prisma.discipline.create({
      data: {
        reason: data.reason,
        start_date: new Date(data.start_date),
        end_date: new Date(data.end_date),
        is_total_suspension: data.is_total_suspension,
        member_id: data.member_id,
      },
    });
    return this.mapToDTO(discipline);
  }

  private mapToDTO(discipline: any): DisciplineDTO {
    return {
      id: discipline.id,
      reason: discipline.reason,
      start_date: discipline.start_date.toISOString(),
      end_date: discipline.end_date.toISOString(),
      is_total_suspension: discipline.is_total_suspension,
      member_id: discipline.member_id,
    };
  }
}
