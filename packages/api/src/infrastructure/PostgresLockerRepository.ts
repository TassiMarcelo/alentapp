import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/client/client.js';
import { LockerRepository } from '../domain/LockerRepository.js';
import { LockerDTO, CreateLockerRequest } from '@alentapp/shared';

if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
}

const prisma = new PrismaClient({
    adapter: new PrismaPg(process.env.DATABASE_URL),
});

export class PostgresLockerRepository implements LockerRepository {
    async findByNumero(numero: number): Promise<LockerDTO | null> {
        const locker = await prisma.locker.findUnique({
            where: { numero },
            include: { member: { select: { name: true, dni: true } } },
        });
        return locker ? this.mapToDTO(locker) : null;
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
            include: { member: { select: { name: true, dni: true } } },
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