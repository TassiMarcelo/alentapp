import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/client/client.js';
import { SportRepository } from '../domain/SportRepository.js';
import { SportDTO, CreateSportRequest, GetSportsFilters } from '@alentapp/shared';
import { applyPagination } from '../application/shared/paginate.js';

if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
}

const prisma = new PrismaClient({
    adapter: new PrismaPg(process.env.DATABASE_URL),
});

type DBSport = {
    id: string;
    nombre: string;
    descripcion: string;
    cupoMaximo: number;
    precioAdicional: number;
    esFederado: boolean;
    requires_medical_certificate: boolean;
};

export class PostgresSportRepository implements SportRepository {
    async create(data: CreateSportRequest): Promise<SportDTO> {
        const sport = await prisma.sport.create({
            data: {
                nombre: data.nombre,
                descripcion: data.descripcion,
                cupoMaximo: data.cupoMaximo,
                precioAdicional: data.precioAdicional,
                esFederado: data.esFederado,
                requires_medical_certificate: data.requires_medical_certificate,
            },
        });

        return this.mapToDTO(sport);
    }

    async getAll(filters?: GetSportsFilters): Promise<{ data: SportDTO[]; total: number }> {
        const { skip, take } = applyPagination(filters);
        const [sports, total] = await prisma.$transaction([
            prisma.sport.findMany({
                orderBy: [{ nombre: 'asc' }, { id: 'asc' }],
                skip,
                take,
            }),
            prisma.sport.count(),
        ]);
        return { data: sports.map(this.mapToDTO.bind(this)), total };
    }

    async findByName(nombre: string): Promise<SportDTO | null> {
        const sport = await prisma.sport.findFirst({
            where: {
                nombre: {
                    equals: nombre,
                    mode: 'insensitive',
                },
            },
        });

        return sport ? this.mapToDTO(sport) : null;
    }

    async findById(id: string): Promise<SportDTO | null> {
        const sport = await prisma.sport.findUnique({
            where: { id },
        });

        return sport ? this.mapToDTO(sport) : null;
    }

    async update(id: string, data: Partial<SportDTO>): Promise<SportDTO> {
        const sport = await prisma.sport.update({
            where: { id },
            data: {
                descripcion: data.descripcion,
                cupoMaximo: data.cupoMaximo,
                precioAdicional: data.precioAdicional,
                esFederado: data.esFederado,
                requires_medical_certificate: data.requires_medical_certificate,
            },
        });

        return this.mapToDTO(sport);
    }

    async delete(id: string): Promise<void> {
        await prisma.$transaction([
            prisma.sport.update({
                where: { id },
                data: { members: { set: [] } },
            }),
            prisma.sport.delete({ where: { id } }),
        ]);
    }

    async countEnrolledMembers(id: string): Promise<number> {
        const count = await prisma.member.count({
            where: {
                sports: {
                    some: {
                        id: id
                    }
                }
            }
        });
        return count;
    }

    private mapToDTO(sport: DBSport): SportDTO {
        return {
            id: sport.id,
            nombre: sport.nombre,
            descripcion: sport.descripcion,
            cupoMaximo: sport.cupoMaximo,
            precioAdicional: sport.precioAdicional,
            esFederado: sport.esFederado,
            requires_medical_certificate: sport.requires_medical_certificate,
        };
    }
}
