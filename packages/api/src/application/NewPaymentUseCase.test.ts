import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NewPaymentUseCase } from './NewPaymentUseCase.js';

describe('NewPaymentUseCase', () => {

    let paymentRepository: any;
    let memberRepository: any;
    let useCase: NewPaymentUseCase;

    beforeEach(() => {

        paymentRepository = {
            findByMemberAndPeriod: vi.fn(),
            create: vi.fn(),
        };

        memberRepository = {
            findById: vi.fn(),
        };

        useCase = new NewPaymentUseCase(
            paymentRepository,
            memberRepository
        );
    });

    it('debe crear un pago correctamente', async () => {

        memberRepository.findById.mockResolvedValue({
            id: 'member-1'
        });

        paymentRepository.findByMemberAndPeriod.mockResolvedValue(null);

        paymentRepository.create.mockResolvedValue({
            id: 'payment-1',
            memberId: 'member-1',
            monto: 1000,
            mesReferencia: 5,
            anioReferencia: 2026,
            fechaVencimiento: '2030-05-10',
            estado: 'Pendiente',
            created_at: new Date().toISOString()
        });

        const result = await useCase.execute({
            memberId: 'member-1',
            monto: 1000,
            mesReferencia: 5,
            anioReferencia: 2026,
            fechaVencimiento: '2030-05-10'
        });

        expect(result.estado).toBe('Pendiente');
        expect(paymentRepository.create).toHaveBeenCalled();

    });

    it('debe lanzar error si el socio no existe', async () => {

        memberRepository.findById.mockResolvedValue(null);

        await expect(
            useCase.execute({
                memberId: 'fake-id',
                monto: 1000,
                mesReferencia: 5,
                anioReferencia: 2026,
                fechaVencimiento: '2030-05-10'
            })
        ).rejects.toThrow('404: El socio no existe');

    });

    it('debe lanzar error si el pago ya existe', async () => {

        memberRepository.findById.mockResolvedValue({
            id: 'member-1'
        });

        paymentRepository.findByMemberAndPeriod.mockResolvedValue({
            id: 'payment-1'
        });

        await expect(
            useCase.execute({
                memberId: 'member-1',
                monto: 1000,
                mesReferencia: 5,
                anioReferencia: 2026,
                fechaVencimiento: '2030-05-10'
            })
        ).rejects.toThrow('409: Ya existe un pago para ese período');

    });

    it('debe lanzar error si el monto es menor o igual a 0', async () => {

        memberRepository.findById.mockResolvedValue({
            id: 'member-1'
        });

        paymentRepository.findByMemberAndPeriod.mockResolvedValue(null);

        await expect(
            useCase.execute({
                memberId: 'member-1',
                monto: 0,
                mesReferencia: 5,
                anioReferencia: 2026,
                fechaVencimiento: '2030-05-10'
            })
        ).rejects.toThrow('400: El monto debe ser mayor a 0');

    });

});