import { PaymentRepository } from '../domain/PaymentRepository.js';
import { PaymentDTO } from '@alentapp/shared';

export class GetPaymentsUseCase {
    constructor(private readonly paymentRepo: PaymentRepository) {}

    async execute(): Promise<PaymentDTO[]> {
        return this.paymentRepo.findAll();
    }
}