import { PaymentRepository } from '../domain/PaymentRepository.js';
import { MemberRepository } from '../domain/MemberRepository.js';
import { PaymentDTO } from '@alentapp/shared';

export class CancelPaymentUseCase {
    constructor(
        private readonly paymentRepo: PaymentRepository,
        private readonly memberRepo: MemberRepository
    ) {}

    async execute(id: string): Promise<PaymentDTO> {

        try {

            // 1. Validar ID de entrada
            if (!id || id.trim() === '') {
                throw new Error('400: El ID del pago es obligatorio');
            }

            // 2. Validar existencia del pago
            const existingPayment = await this.paymentRepo.findById(id);

            if (!existingPayment) {
                throw new Error('404: El pago no existe');
            }

            // 3. Validar existencia del socio asociado
            if (!existingPayment.memberId) {
                throw new Error('404: El socio no existe');
            }

            const member = await this.memberRepo.findById(existingPayment.memberId);

            if (!member) {
                throw new Error('404: El socio no existe');
            }

            // 4. Validar que no esté pagado
            if (existingPayment.estado === 'Pagado') {
                throw new Error('400: No se puede cancelar un pago ya realizado');
            }

            // 5. Validar que no esté cancelado
            if (existingPayment.estado === 'Cancelado') {
                throw new Error('400: El pago ya está cancelado');
            }

            // 6. Armar objeto actualizado
            const updatedData = {
                estado: 'Cancelado' as const
            };

            // 7. Persistir cambio
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
