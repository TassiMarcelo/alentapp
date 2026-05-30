import { describe, it, expect, beforeEach } from 'vitest';

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/client/client.js';

import { NewPaymentUseCase } from './NewPaymentUseCase.js';

import { PostgresPaymentRepository } from '../infrastructure/PostgresPaymentRepository.js';
import { PostgresMemberRepository } from '../infrastructure/PostgresMemberRepository.js';

const prisma = new PrismaClient({
    adapter: new PrismaPg(process.env.DATABASE_URL!)
});

describe('NewPaymentUseCase Integration', () => {

    beforeEach(async () => {

        // Limpiar datos antes de cada test
        await prisma.payment.deleteMany();
        await prisma.member.deleteMany();

    });

    it('debe crear un pago correctamente', async () => {

        const paymentRepository = new PostgresPaymentRepository();
        const memberRepository = new PostgresMemberRepository();

        const useCase = new NewPaymentUseCase(
            paymentRepository,
            memberRepository
        );

        // Crear socio real
        const member = await prisma.member.create({
            data: {
                dni: '12345678',
                name: 'Abel',
                email: 'abel@test.com',
                birthdate: new Date('2000-01-01'),
                category: 'Pleno',
            }
        });

        // Ejecutar caso de uso
        const payment = await useCase.execute({
            memberId: member.id,
            monto: 1000,
            mesReferencia: 5,
            anioReferencia: 2030,
            fechaVencimiento: '2030-05-10'
        });

        // Validaciones
        expect(payment.id).toBeDefined();
        expect(payment.estado).toBe('Pendiente');
        expect(payment.memberId).toBe(member.id);

    });

    it('debe lanzar error si el pago ya existe', async () => {

        const paymentRepository = new PostgresPaymentRepository();
        const memberRepository = new PostgresMemberRepository();

        const useCase = new NewPaymentUseCase(
            paymentRepository,
            memberRepository
        );

        // Crear socio real
        const member = await prisma.member.create({
            data: {
                dni: '87654321',
                name: 'Juan',
                email: 'juan@test.com',
                birthdate: new Date('2000-01-01'),
                category: 'Pleno',
            }
        });

        // Crear pago existente
        await prisma.payment.create({
            data: {
                memberId: member.id,
                monto: 1000,
                mesReferencia: 5,
                anioReferencia: 2030,
                fechaVencimiento: new Date('2030-05-10'),
                estado: 'Pendiente',
            }
        });

        // Intentar crear duplicado
        await expect(
            useCase.execute({
                memberId: member.id,
                monto: 1000,
                mesReferencia: 5,
                anioReferencia: 2030,
                fechaVencimiento: '2030-05-10'
            })
        ).rejects.toThrow('409: Ya existe un pago para ese período');

    });

});