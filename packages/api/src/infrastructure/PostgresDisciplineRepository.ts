import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/client/client.js';
import { DisciplineRepository, FindAllDisciplinesFilters } from '../domain/DisciplineRepository.js';
import { DisciplineDTO, CreateDisciplineRequest, UpdateDisciplineRequest } from '@alentapp/shared';
import { applyPagination } from '../application/shared/paginate.js';

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

  async findAll(filters: FindAllDisciplinesFilters): Promise<{ data: DisciplineDTO[]; total: number }> {
    const where: any = { deleted_at: null };

    if (filters.member_id) {
      where.member_id = filters.member_id;
    }

    if (filters.status && filters.at) {
      if (filters.status === 'active') {
        where.start_date = { lte: filters.at };
        where.end_date = { gte: filters.at };
      } else if (filters.status === 'expired') {
        where.end_date = { lt: filters.at };
      } else if (filters.status === 'upcoming') {
        where.start_date = { gt: filters.at };
      }
    }

    const { skip, take } = applyPagination(filters);
    const orderDir = filters.sort_desc === false ? 'asc' : 'desc';
    const [disciplines, total] = await prisma.$transaction([
      prisma.discipline.findMany({
        where,
        orderBy: [{ start_date: orderDir }, { id: 'asc' }],
        skip,
        take,
      }),
      prisma.discipline.count({ where }),
    ]);

    return { data: disciplines.map((d) => this.mapToDTO(d)), total };
  }

  async findById(id: string): Promise<DisciplineDTO | null> {
    const discipline = await prisma.discipline.findFirst({
      where: { id, deleted_at: null },
    });
    return discipline ? this.mapToDTO(discipline) : null;
  }

  async update(id: string, data: UpdateDisciplineRequest): Promise<DisciplineDTO> {
    const updateData: any = {};
    if (data.reason !== undefined) updateData.reason = data.reason;
    if (data.start_date !== undefined) updateData.start_date = new Date(data.start_date);
    if (data.end_date !== undefined) updateData.end_date = new Date(data.end_date);
    if (data.is_total_suspension !== undefined) updateData.is_total_suspension = data.is_total_suspension;

    const discipline = await prisma.discipline.update({
      where: { id },
      data: updateData,
    });
    return this.mapToDTO(discipline);
  }

  async softDelete(id: string): Promise<void> {
    await prisma.discipline.update({
      where: { id },
      data: { deleted_at: new Date() },
    });
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
