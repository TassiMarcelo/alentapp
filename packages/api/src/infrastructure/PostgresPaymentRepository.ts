import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/client/client.js';
import { PaymentRepository } from '../domain/PaymentRepository.js';
import {
    PaymentDTO,
    CreatePaymentRequest,
    UpdatePaymentRequest
} from '@alentapp/shared';

if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL no esta definida');
}

const prisma = new PrismaClient({
    adapter: new PrismaPg(process.env.DATABASE_URL),
});

type DBPayment = {
    id: string;
    memberId: string;
    monto: number;
    mesReferencia: number;
    anioReferencia: number;
    fechaVencimiento: Date;
    estado: string;
    fechaPago: Date | null;
    created_at: Date;
};

export class PostgresPaymentRepository implements PaymentRepository {

    async create(data: CreatePaymentRequest & { estado: string; created_at: string }): Promise<PaymentDTO> {
        const payment = await prisma.payment.create({
            data: {
                memberId: data.memberId,
                monto: data.monto,
                mesReferencia: data.mesReferencia,
                anioReferencia: data.anioReferencia,
                fechaVencimiento: new Date(data.fechaVencimiento),
                estado: data.estado,
                created_at: new Date(data.created_at),
            },
        });

        return this.mapToDTO(payment);
    }

    async findById(id: string): Promise<PaymentDTO | null> {
        const payment = await prisma.payment.findUnique({
            where: { id },
        });

        return payment ? this.mapToDTO(payment) : null;
    }

    async findByMemberAndPeriod(
        memberId: string,
        mesReferencia: number,
        anioReferencia: number
    ): Promise<PaymentDTO | null> {
        const payment = await prisma.payment.findFirst({
            where: {
                memberId,
                mesReferencia,
                anioReferencia,
            },
        });

        return payment ? this.mapToDTO(payment) : null;
    }

    async findAll(): Promise<PaymentDTO[]> {
        const payments = await prisma.payment.findMany({
            orderBy: { created_at: 'desc' },
        });

        return payments.map(this.mapToDTO);
    }

    async update(id: string, data: Partial<PaymentDTO>): Promise<PaymentDTO> {
        const payment = await prisma.payment.update({
            where: { id },
            data: {
                ...(data.monto !== undefined && { monto: data.monto }),
                ...(data.fechaVencimiento && { fechaVencimiento: new Date(data.fechaVencimiento) }),
                ...(data.estado && { estado: data.estado }),
                ...(data.fechaPago && { fechaPago: new Date(data.fechaPago) }),
            },
        });

        return this.mapToDTO(payment);
    }

    private mapToDTO(payment: DBPayment): PaymentDTO {
        return {
            id: payment.id,
            memberId: payment.memberId,
            monto: payment.monto,
            mesReferencia: payment.mesReferencia,
            anioReferencia: payment.anioReferencia,
            fechaVencimiento: payment.fechaVencimiento.toISOString(),
            estado: payment.estado as 'Pendiente' | 'Pagado' | 'Cancelado',
            fechaPago: payment.fechaPago ? payment.fechaPago.toISOString() : undefined,
            created_at: payment.created_at.toISOString(),
        };
    }
}