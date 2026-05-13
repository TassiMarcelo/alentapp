import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/client/client.js';
import { LockerRepository } from '../domain/LockerRepository.js';
import { LockerDTO, CreateLockerRequest, GetLockersFilters, UpdateLockerEstadoRequest } from '@alentapp/shared';

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

    async findAll(filters?: GetLockersFilters): Promise<LockerDTO[]> {
        const where: any = {};
        if (filters?.estado) where.estado = filters.estado;
        if (filters?.ubicacion) where.ubicacion = filters.ubicacion;

        const lockers = await prisma.locker.findMany({
            where,
            orderBy: { numero: 'asc' },
            include: memberInclude,
        });

        return lockers.map((l) => this.mapToDTO(l));
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