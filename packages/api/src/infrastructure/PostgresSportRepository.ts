import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/client/client.js';
import { SportRepository } from '../domain/SportRepository.js';
import { SportDTO, CreateSportRequest } from '@alentapp/shared';

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

    async getAll(): Promise<SportDTO[]> {
        const sports = await prisma.sport.findMany({
            orderBy: { nombre: 'asc' },
        });
        return sports.map(this.mapToDTO.bind(this));
    }

    async findByName(nombre: string): Promise<SportDTO | null> {
        const sport = await prisma.sport.findUnique({
            where: { nombre },
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
