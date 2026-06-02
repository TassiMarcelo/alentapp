import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UpdatePaymentUseCase } from './UpdatePaymentUseCase.js';

describe('UpdatePaymentUseCase', () => {

    let paymentRepository: any;
    let memberRepository: any;
    let useCase: UpdatePaymentUseCase;

    beforeEach(() => {

        paymentRepository = {
            findById: vi.fn(),
            update: vi.fn(),
        };

        memberRepository = {
            findById: vi.fn(),
        };

        useCase = new UpdatePaymentUseCase(
            paymentRepository,
            memberRepository
        );
    });

    it('debe actualizar un pago correctamente', async () => {

        paymentRepository.findById.mockResolvedValue({
            id: 'payment-1',
            memberId: 'member-1',
            estado: 'Pendiente'
        });

        memberRepository.findById.mockResolvedValue({
            id: 'member-1'
        });

        paymentRepository.update.mockResolvedValue({
            id: 'payment-1',
            memberId: 'member-1',
            monto: 2000,
            estado: 'Pendiente'
        });

        const result = await useCase.execute(
            'payment-1',
            {
                monto: 2000
            }
        );

        expect(result.monto).toBe(2000);
        expect(paymentRepository.update).toHaveBeenCalled();
    });

    it('debe lanzar error si el pago no existe', async () => {

        paymentRepository.findById.mockResolvedValue(null);

        await expect(
            useCase.execute(
                'fake-id',
                {
                    monto: 2000
                }
            )
        ).rejects.toThrow('404: El pago no existe');
    });

    it('debe lanzar error si el monto es menor o igual a 0', async () => {

        paymentRepository.findById.mockResolvedValue({
            id: 'payment-1',
            memberId: 'member-1',
            estado: 'Pendiente'
        });

        memberRepository.findById.mockResolvedValue({
            id: 'member-1'
        });

        await expect(
            useCase.execute(
                'payment-1',
                {
                    monto: 0
                }
            )
        ).rejects.toThrow('400: El monto debe ser mayor a 0');
    });

    it('debe lanzar error si el pago no está en estado Pendiente', async () => {

        paymentRepository.findById.mockResolvedValue({
            id: 'payment-1',
            memberId: 'member-1',
            estado: 'Pagado'
        });

        memberRepository.findById.mockResolvedValue({
            id: 'member-1'
        });

        await expect(
            useCase.execute(
                'payment-1',
                {
                    monto: 2000
                }
            )
        ).rejects.toThrow('400: Solo se pueden modificar pagos en estado Pendiente');
    });

});