import { PaymentRepository } from '../domain/PaymentRepository.js';
import { MemberRepository } from '../domain/MemberRepository.js';
import { CreatePaymentRequest, PaymentDTO } from '@alentapp/shared';

export class NewPaymentUseCase {
    constructor(
        private readonly paymentRepository: PaymentRepository,
        private readonly memberRepository: MemberRepository
    ) {}

    async execute(data: CreatePaymentRequest): Promise<PaymentDTO> {

        try {

            // 1. Validar existencia del socio
            if (!data.memberId) {
                throw new Error('404: El socio no existe');
            }

            const member = await this.memberRepository.findById(data.memberId);

            if (!member) {
                throw new Error('404: El socio no existe');
            }

            // 2. Validación de negocio: evitar pagos duplicados
            const existingPayment = await this.paymentRepository.findByMemberAndPeriod(
                data.memberId,
                data.mesReferencia,
                data.anioReferencia
            );

            if (existingPayment) {
                throw new Error('409: Ya existe un pago para ese período');
            }

            // 3. Validar fecha de vencimiento
            const hoy = new Date();
            const fechaVencimiento = new Date(data.fechaVencimiento);

            // Comparar solo fecha, no hora
            hoy.setHours(0, 0, 0, 0);
            fechaVencimiento.setHours(0, 0, 0, 0);

            if (fechaVencimiento < hoy) {
                throw new Error('400: La fecha de vencimiento no puede ser anterior a hoy');
            }

            // 4. Validar mes de referencia
            if (
                !Number.isInteger(data.mesReferencia) ||
                data.mesReferencia < 1 ||
                data.mesReferencia > 12
            ) {
                throw new Error('400: Mes de referencia inválido');
            }

            // 5. Validar año de referencia
            if (
                !Number.isInteger(data.anioReferencia) ||
                data.anioReferencia < 2026 ||
                data.anioReferencia > 2036
            ) {
                throw new Error('400: Año de referencia inválido');
            }

            // 6. Validar monto
            if (data.monto <= 0) {
                throw new Error('400: El monto debe ser mayor a 0');
            }

            // 7. Persistencia
            const newPayment = await this.paymentRepository.create({
                ...data,
                estado: 'Pendiente',
                created_at: new Date().toISOString()
            });

            return newPayment;

        } catch (error: any) {

            // Errores de negocio controlados
            if (
                error.message.startsWith('400') ||
                error.message.startsWith('404') ||
                error.message.startsWith('409')
            ) {
                throw error;
            }

            // Error inesperado / DB
            throw new Error('500: Error de base de datos');
        }
    }
}