import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/client/client.js';
import { LockerRepository } from '../domain/LockerRepository.js';
import { LockerDTO, CreateLockerRequest, GetLockersFilters, UpdateLockerEstadoRequest, UpdateLockerRequest } from '@alentapp/shared';
import { applyPagination } from '../application/shared/paginate.js';

if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
}

const prisma = new PrismaClient({
    adapter: new PrismaPg(process.env.DATABASE_URL),
});

const memberInclude = { member: { select: { name: true, dni: true } } };

export class PostgresLockerRepository implements LockerRepository {
    async findByNumero(numero: number): Promise<LockerDTO | null> {
        const locker = await prisma.locker.findUnique({
            where: { numero },
            include: memberInclude,
        });
        return locker ? this.mapToDTO(locker) : null;
    }

    async findById(id: string): Promise<LockerDTO | null> {
        const locker = await prisma.locker.findUnique({
            where: { id },
            include: memberInclude,
        });
        return locker ? this.mapToDTO(locker) : null;
    }
    async update(id: string, data: UpdateLockerRequest): Promise<LockerDTO> {
        const locker = await prisma.locker.update({
            where: { id },
            data: {
                ...(data.numero !== undefined && { numero: data.numero }),
                ...(data.ubicacion !== undefined && { ubicacion: data.ubicacion }),
            },
            include: memberInclude,
        });
        return this.mapToDTO(locker);
    }

    async findAll(filters?: GetLockersFilters): Promise<{ data: LockerDTO[]; total: number }> {
        const where: any = {};
        if (filters?.estado) where.estado = filters.estado;
        if (filters?.ubicacion) where.ubicacion = filters.ubicacion;

        const { skip, take } = applyPagination(filters);
        const [lockers, total] = await prisma.$transaction([
            prisma.locker.findMany({
                where,
                orderBy: [{ numero: 'asc' }, { id: 'asc' }],
                include: memberInclude,
                skip,
                take,
            }),
            prisma.locker.count({ where }),
        ]);

        return { data: lockers.map((l) => this.mapToDTO(l)), total };
    }

    async count(): Promise<number> {
        return prisma.locker.count();
    }

    async create(data: CreateLockerRequest): Promise<LockerDTO> {
        const locker = await prisma.locker.create({
            data: {
                numero: data.numero,
                ubicacion: data.ubicacion,
            },
            include: memberInclude,
        });
        return this.mapToDTO(locker);
    }
    
    async delete(id: string): Promise<void> {
        await prisma.locker.delete({ where: { id } });
    }

    async updateEstado(id: string, data: UpdateLockerEstadoRequest): Promise<LockerDTO> {
        if (data.estado === 'OCUPADO') {
            const locker = await prisma.$transaction(async (tx) => {
                const current = await tx.locker.findUnique({ where: { id } });
                if (!current || current.estado !== 'DISPONIBLE') {
                    throw new Error('El locker no está disponible');
                }
                return tx.locker.update({
                    where: { id },
                    data: {
                        estado: 'OCUPADO',
                        member_id: data.memberId,
                        fechaFinContrato: new Date(data.fechaFinContrato!),
                    },
                    include: memberInclude,
                });
            });
            return this.mapToDTO(locker);
        }

        const locker = await prisma.locker.update({
            where: { id },
            data: {
                estado: data.estado,
                member_id: data.estado === 'DISPONIBLE' ? null : undefined,
                fechaFinContrato: data.estado === 'DISPONIBLE' ? null : undefined,
            },
            include: memberInclude,
        });

        return this.mapToDTO(locker);
    }

    private mapToDTO(locker: any): LockerDTO {
        return {
            id: locker.id,
            numero: locker.numero,
            ubicacion: locker.ubicacion,
            estado: locker.estado,
            fechaFinContrato: locker.fechaFinContrato
                ? locker.fechaFinContrato.toISOString().split('T')[0]
                : null,
            socio: locker.member
                ? { nombre: locker.member.name, dni: locker.member.dni }
                : null,
        };
    }
}