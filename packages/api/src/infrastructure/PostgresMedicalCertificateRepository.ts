import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/client/client.js';
import {
    MedicalCertificateRepository,
    NewMedicalCertificate,
    TxClient,
} from '../domain/MedicalCertificateRepository.js';
import { MedicalCertificateDTO, UpdateMedicalCertificateRequest, GetMedicalCertificatesFilters } from '@alentapp/shared';
import { applyPagination } from '../application/shared/paginate.js';

if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
}

const prisma = new PrismaClient({
    adapter: new PrismaPg(process.env.DATABASE_URL),
});

// Si hay transacción activa se usa ese client; si no, el client global.
type PrismaLike = typeof prisma;
const db = (tx?: TxClient): PrismaLike => (tx as PrismaLike) ?? prisma;

export class PostgresMedicalCertificateRepository implements MedicalCertificateRepository {

    // TDD-0018 §Observaciones: invalidación + alta dentro de una única transacción Prisma
    async runInTransaction<T>(work: (tx: TxClient) => Promise<T>): Promise<T> {
        return prisma.$transaction(async (tx) => work(tx as TxClient));
    }

    async invalidateAllByMemberId(memberId: string, tx?: TxClient): Promise<void> {
        await db(tx).medicalCertificate.updateMany({
            where: { member_id: memberId, is_validated: true, deleted_at: null },
            data: { is_validated: false },
        });
    }

    async save(data: NewMedicalCertificate, tx?: TxClient): Promise<MedicalCertificateDTO> {
        const cert = await db(tx).medicalCertificate.create({
            data: {
                member_id: data.member_id,
                issue_date: new Date(data.issue_date),
                expiry_date: new Date(data.expiry_date),
                doctor_license: data.doctor_license,
                is_validated: data.is_validated,
            },
        });
        return this.mapToDTO(cert);
    }

    async findByMemberId(memberId: string): Promise<MedicalCertificateDTO[]> {
        const certs = await prisma.medicalCertificate.findMany({
            where: { member_id: memberId, deleted_at: null },
            orderBy: { created_at: 'desc' },
        });
        return certs.map(cert => this.mapToDTO(cert));
    }

    async findAll(filters?: GetMedicalCertificatesFilters): Promise<{ data: MedicalCertificateDTO[]; total: number }> {
        const where = { deleted_at: null };
        const { skip, take } = applyPagination(filters);
        const [certs, total] = await prisma.$transaction([
            prisma.medicalCertificate.findMany({
                where,
                orderBy: [{ created_at: 'desc' }, { id: 'asc' }],
                skip,
                take,
            }),
            prisma.medicalCertificate.count({ where }),
        ]);
        return { data: certs.map(cert => this.mapToDTO(cert)), total };
    }

    async update(
        id: string,
        data: UpdateMedicalCertificateRequest,
        tx?: TxClient,
    ): Promise<MedicalCertificateDTO> {
        const cert = await db(tx).medicalCertificate.update({
            where: { id },
            data: {
                ...(data.issueDate && { issue_date: new Date(data.issueDate) }),
                ...(data.expiryDate && { expiry_date: new Date(data.expiryDate) }),
                ...(data.doctorLicense && { doctor_license: data.doctorLicense }),
                ...(data.isValidated !== undefined && { is_validated: data.isValidated }),
            },
        });
        return this.mapToDTO(cert);
    }

    async delete(id: string): Promise<void> {
        await prisma.medicalCertificate.update({
            where: { id },
            data: { deleted_at: new Date() },
        });
    }

    async findById(id: string): Promise<MedicalCertificateDTO | null> {
        const cert = await prisma.medicalCertificate.findUnique({
            where: { id },
        });
        return cert ? this.mapToDTO(cert) : null;
    }

    private mapToDTO(cert: any): MedicalCertificateDTO {
        return {
            id: cert.id,
            member_id: cert.member_id,
            issue_date: cert.issue_date.toISOString().split('T')[0],
            expiry_date: cert.expiry_date.toISOString().split('T')[0],
            doctor_license: cert.doctor_license,
            is_validated: cert.is_validated,
            created_at: cert.created_at.toISOString(),
            deleted_at: cert.deleted_at ? cert.deleted_at.toISOString() : null,
        };
    }
}
