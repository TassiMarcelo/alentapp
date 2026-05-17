import { PaymentRepository } from '../domain/PaymentRepository.js';
import { MemberRepository } from '../domain/MemberRepository.js';
import { PaymentDTO, PayPaymentRequest } from '@alentapp/shared';

export class PayPaymentUseCase {
    constructor(
        private readonly paymentRepo: PaymentRepository,
        private readonly memberRepo: MemberRepository
    ) {}

    async execute(id: string, data: PayPaymentRequest): Promise<PaymentDTO> {

        try {

            // 1. Validar ID de entrada
            if (!id || id.trim() === '') {
                throw new Error('400: El ID del pago es obligatorio');
            }

            // 2. Validar fecha obligatoria
            if (!data.fechaPago) {
                throw new Error('400: La fecha de pago es obligatoria');
            }

            // 3. Validar formato de fecha
            const fechaPago = new Date(data.fechaPago);

            if (isNaN(fechaPago.getTime())) {
                throw new Error('400: Fecha inválida');
            }

            // 4. Buscar el pago
            const existingPayment = await this.paymentRepo.findById(id);

            if (!existingPayment) {
                throw new Error('404: El pago no existe');
            }

            // 5. Validar existencia del socio asociado
            if (!existingPayment.memberId) {
                throw new Error('404: El socio no existe');
            }

            const member = await this.memberRepo.findById(existingPayment.memberId);

            if (!member) {
                throw new Error('404: El socio no existe');
            }

            // 6. Validar vencimiento (No persistido)
            const hoy = new Date();
            const fechaVencimiento = new Date(existingPayment.fechaVencimiento);

            // comparar solo fecha, no hora
            hoy.setHours(0, 0, 0, 0);
            fechaVencimiento.setHours(0, 0, 0, 0);

            if (hoy > fechaVencimiento) {
                throw new Error('400: El pago está vencido');
            }

            // 7. Validar estado del pago
            if (existingPayment.estado === 'Pagado') {
                throw new Error('400: El pago ya fue realizado');
            }

            if (existingPayment.estado === 'Cancelado') {
                throw new Error('400: El pago está cancelado');
            }

            if (existingPayment.estado !== 'Pendiente') {
                throw new Error('400: El pago no está en estado válido para ser procesado');
            }

            // 8. Armar objeto actualizado
            const updatedData = {
                estado: 'Pagado' as const,
                fechaPago: fechaPago.toISOString()
            };

            // 9. Persistir cambio
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
