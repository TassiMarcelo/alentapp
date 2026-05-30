import { describe, it, expect, beforeEach, vi } from 'vitest';

import { CancelPaymentUseCase } from './CancelPaymentUseCase.js';

describe('CancelPaymentUseCase', () => {

    let paymentRepo: any;
    let memberRepo: any;

    let useCase: CancelPaymentUseCase;

    beforeEach(() => {

        paymentRepo = {
            findById: vi.fn(),
            update: vi.fn()
        };

        memberRepo = {
            findById: vi.fn()
        };

        useCase = new CancelPaymentUseCase(
            paymentRepo,
            memberRepo
        );
    });

    it('debe cancelar un pago correctamente', async () => {

        paymentRepo.findById.mockResolvedValue({
            id: 'payment-1',
            memberId: 'member-1',
            estado: 'Pendiente'
        });

        memberRepo.findById.mockResolvedValue({
            id: 'member-1'
        });

        paymentRepo.update.mockResolvedValue({
            id: 'payment-1',
            memberId: 'member-1',
            estado: 'Cancelado'
        });

        const result = await useCase.execute('payment-1');

        expect(result.estado).toBe('Cancelado');

        expect(paymentRepo.update).toHaveBeenCalledWith(
            'payment-1',
            {
                estado: 'Cancelado'
            }
        );
    });

    it('debe lanzar error si el pago no existe', async () => {

        paymentRepo.findById.mockResolvedValue(null);

        await expect(
            useCase.execute('fake-id')
        ).rejects.toThrow('404: El pago no existe');
    });

    it('debe lanzar error si el pago ya está pagado', async () => {

        paymentRepo.findById.mockResolvedValue({
            id: 'payment-1',
            memberId: 'member-1',
            estado: 'Pagado'
        });

        memberRepo.findById.mockResolvedValue({
            id: 'member-1'
        });

        await expect(
            useCase.execute('payment-1')
        ).rejects.toThrow(
            '400: No se puede cancelar un pago ya realizado'
        );
    });

    it('debe lanzar error si el pago ya está cancelado', async () => {

        paymentRepo.findById.mockResolvedValue({
            id: 'payment-1',
            memberId: 'member-1',
            estado: 'Cancelado'
        });

        memberRepo.findById.mockResolvedValue({
            id: 'member-1'
        });

        await expect(
            useCase.execute('payment-1')
        ).rejects.toThrow(
            '400: El pago ya está cancelado'
        );
    });

});