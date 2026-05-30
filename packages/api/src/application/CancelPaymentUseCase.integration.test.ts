import { describe, it, expect, beforeEach } from 'vitest';

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/client/client.js';

import { CancelPaymentUseCase } from './CancelPaymentUseCase.js';

import { PostgresPaymentRepository } from '../infrastructure/PostgresPaymentRepository.js';
import { PostgresMemberRepository } from '../infrastructure/PostgresMemberRepository.js';

const prisma = new PrismaClient({
    adapter: new PrismaPg(process.env.DATABASE_URL!)
});

describe('CancelPaymentUseCase Integration', () => {

    beforeEach(async () => {

        // Limpiar datos
        await prisma.payment.deleteMany();
        await prisma.member.deleteMany();

    });

    it('debe cancelar un pago correctamente', async () => {

        const paymentRepository = new PostgresPaymentRepository();
        const memberRepository = new PostgresMemberRepository();

        const useCase = new CancelPaymentUseCase(
            paymentRepository,
            memberRepository
        );

        // Crear socio
        const member = await prisma.member.create({
            data: {
                dni: '12345678',
                name: 'Abel',
                email: 'abel@test.com',
                birthdate: new Date('2000-01-01'),
                category: 'Pleno',
            }
        });

        // Crear pago
        const payment = await prisma.payment.create({
            data: {
                memberId: member.id,
                monto: 1000,
                mesReferencia: 5,
                anioReferencia: 2030,
                fechaVencimiento: new Date('2030-05-10'),
                estado: 'Pendiente',
            }
        });

        // Ejecutar cancelación
        const result = await useCase.execute(payment.id);

        // Validaciones
        expect(result.estado).toBe('Cancelado');

    });

    it('debe lanzar error si el pago no existe', async () => {

        const paymentRepository = new PostgresPaymentRepository();
        const memberRepository = new PostgresMemberRepository();

        const useCase = new CancelPaymentUseCase(
            paymentRepository,
            memberRepository
        );

        await expect(
            useCase.execute('fake-id')
        ).rejects.toThrow('404: El pago no existe');

    });

});