import { describe, it, expect, beforeEach } from 'vitest';

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/client/client.js';

import { UpdatePaymentUseCase } from './UpdatePaymentUseCase.js';

import { PostgresPaymentRepository } from '../infrastructure/PostgresPaymentRepository.js';
import { PostgresMemberRepository } from '../infrastructure/PostgresMemberRepository.js';

const prisma = new PrismaClient({
    adapter: new PrismaPg(process.env.DATABASE_URL!)
});

describe('UpdatePaymentUseCase Integration', () => {

    beforeEach(async () => {

        // Limpiar datos
        await prisma.payment.deleteMany();
        await prisma.member.deleteMany();

    });

    it('debe actualizar un pago correctamente', async () => {

        const paymentRepository = new PostgresPaymentRepository();
        const memberRepository = new PostgresMemberRepository();

        const useCase = new UpdatePaymentUseCase(
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

        // Ejecutar update
        const updated = await useCase.execute(
            payment.id,
            {
                monto: 2000
            }
        );

        expect(updated.monto).toBe(2000);

    });

    it('debe lanzar error si el pago no existe', async () => {

        const paymentRepository = new PostgresPaymentRepository();
        const memberRepository = new PostgresMemberRepository();

        const useCase = new UpdatePaymentUseCase(
            paymentRepository,
            memberRepository
        );

        await expect(
            useCase.execute(
                'fake-id',
                {
                    monto: 2000
                }
            )
        ).rejects.toThrow('404: El pago no existe');

    });

});