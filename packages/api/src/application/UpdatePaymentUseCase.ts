import { PaymentRepository } from '../domain/PaymentRepository.js';
import { MemberRepository } from '../domain/MemberRepository.js';
import { PaymentDTO, UpdatePaymentRequest } from '@alentapp/shared';

export class UpdatePaymentUseCase {
    constructor(
        private readonly paymentRepo: PaymentRepository,
        private readonly memberRepo: MemberRepository
    ) {}

    async execute(id: string, data: UpdatePaymentRequest): Promise<PaymentDTO> {

        try {

            // 1. Validar existencia del pago
            const existingPayment = await this.paymentRepo.findById(id);

            if (!existingPayment) {
                throw new Error('404: El pago no existe');
            }

            // 2. Validar existencia del socio asociado
            if (!existingPayment.memberId) {
                throw new Error('404: El socio no existe');
            }

            const member = await this.memberRepo.findById(existingPayment.memberId);

            if (!member) {
                throw new Error('404: El socio no existe');
            }

            // 3. Validar estado del pago
            if (existingPayment.estado !== 'Pendiente') {
                throw new Error('400: Solo se pueden modificar pagos en estado Pendiente');
            }

            // 4. Validar monto si se envía
            if (data.monto !== undefined && data.monto <= 0) {
                throw new Error('400: El monto debe ser mayor a 0');
            }

            // 5. Validar fecha de vencimiento si se envía
            if (data.fechaVencimiento) {
                const fecha = new Date(data.fechaVencimiento);

                if (isNaN(fecha.getTime())) {
                    throw new Error('400: Fecha de vencimiento inválida');
                }
            }

            // 6. Armar objeto actualizado
            const updatedData = {
                ...data
            };

            // 7. Persistir cambios
            return await this.paymentRepo.update(id, updatedData);

        } catch (error: any) {

            // Errores controlados
            if (
                error.message.startsWith('400') ||
                error.message.startsWith('404')
            ) {
                throw error;
            }

            // Error inesperado / DB
            throw new Error('500: Error de base de datos');
        }
    }
}