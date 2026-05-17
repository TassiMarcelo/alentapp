import { PaymentRepository } from '../domain/PaymentRepository.js';
import { PaymentDTO } from '@alentapp/shared';

export class CancelPaymentUseCase {
    constructor(
        private readonly paymentRepo: PaymentRepository
    ) {}

    async execute(id: string): Promise<PaymentDTO> {

        try {

            // 1. Validar existencia del pago
            const existingPayment = await this.paymentRepo.findById(id);

            if (!existingPayment) {
                throw new Error('404: El pago no existe');
            }

            // 2. Validar existencia del socio
            if (!existingPayment.memberId) {
                throw new Error('404: El socio no existe');
            }

            // 3. Validar que no esté cancelado
            if (existingPayment.estado === 'Cancelado') {
                throw new Error('400: El pago ya está cancelado');
            }

            // 4. Validar que no esté pagado
            if (existingPayment.estado === 'Pagado') {
                throw new Error('400: No se puede cancelar un pago ya realizado');
            }

            // 5. Armar objeto actualizado
            const updatedData = {
                estado: 'Cancelado' as const
            };

            // 6. Persistir cambio
            return await this.paymentRepo.update(id, updatedData);

        } catch (error: any) {

            // Error de negocio controlado
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