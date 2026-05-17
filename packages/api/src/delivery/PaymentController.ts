import { FastifyRequest, FastifyReply } from 'fastify';
import { NewPaymentUseCase } from '../application/NewPaymentUseCase.js';
import { GetPaymentsUseCase } from '../application/GetPaymentsUseCase.js';
import { UpdatePaymentUseCase } from '../application/UpdatePaymentUseCase.js';
import { CancelPaymentUseCase } from '../application/CancelPaymentUseCase.js';
import { PayPaymentUseCase } from '../application/PayPaymentUseCase.js';

import {
    CreatePaymentRequest,
    UpdatePaymentRequest,
    PayPaymentRequest
} from '@alentapp/shared';

export class PaymentController {
    constructor(
        private readonly newPaymentUseCase: NewPaymentUseCase,
        private readonly getPaymentsUseCase: GetPaymentsUseCase,
        private readonly updatePaymentUseCase: UpdatePaymentUseCase,
        private readonly cancelPaymentUseCase: CancelPaymentUseCase,
        private readonly payPaymentUseCase: PayPaymentUseCase,
    ) {}

    async getAll(_request: FastifyRequest, reply: FastifyReply) {
        try {

            const payments = await this.getPaymentsUseCase.execute();

            return reply.status(200).send({
                data: payments
            });

        } catch (error: any) {

            return reply.status(500).send({
                error: '500: Error de base de datos'
            });
        }
    }

    async create(
        request: FastifyRequest<{ Body: CreatePaymentRequest }>,
        reply: FastifyReply,
    ) {
        try {

            const payment = await this.newPaymentUseCase.execute(request.body);

            return reply.status(201).send({
                data: payment
            });

        } catch (error: any) {

            if (error.message.startsWith('400')) {
                return reply.status(400).send({ error: error.message });
            }

            if (error.message.startsWith('404')) {
                return reply.status(404).send({ error: error.message });
            }

            if (error.message.startsWith('409')) {
                return reply.status(409).send({ error: error.message });
            }

            return reply.status(500).send({
                error: '500: Error interno, reintente más tarde'
            });
        }
    }

    async update(
        request: FastifyRequest<{
            Params: { id: string };
            Body: UpdatePaymentRequest;
        }>,
        reply: FastifyReply,
    ) {
        try {

            const { id } = request.params;

            const payment = await this.updatePaymentUseCase.execute(
                id,
                request.body
            );

            return reply.status(200).send({
                data: payment
            });

        } catch (error: any) {

            if (error.message.startsWith('400')) {
                return reply.status(400).send({ error: error.message });
            }

            if (error.message.startsWith('404')) {
                return reply.status(404).send({ error: error.message });
            }

            return reply.status(500).send({
                error: '500: Error interno, reintente más tarde'
            });
        }
    }

    async cancel(
        request: FastifyRequest<{
            Params: { id: string };
        }>,
        reply: FastifyReply,
    ) {
        try {

            const { id } = request.params;

            const payment = await this.cancelPaymentUseCase.execute(id);

            return reply.status(200).send({
                data: payment
            });

        } catch (error: any) {

            if (error.message.startsWith('400')) {
                return reply.status(400).send({ error: error.message });
            }

            if (error.message.startsWith('404')) {
                return reply.status(404).send({ error: error.message });
            }

            return reply.status(500).send({
                error: '500: Error interno, reintente más tarde'
            });
        }
    }

    async pay(
        request: FastifyRequest<{
            Params: { id: string };
            Body: PayPaymentRequest;
        }>,
        reply: FastifyReply,
    ) {
        try {

            const { id } = request.params;

            const payment = await this.payPaymentUseCase.execute(
                id,
                request.body
            );

            return reply.status(200).send({
                data: payment
            });

        } catch (error: any) {

            if (error.message.startsWith('400')) {
                return reply.status(400).send({ error: error.message });
            }

            if (error.message.startsWith('404')) {
                return reply.status(404).send({ error: error.message });
            }

            return reply.status(500).send({
                error: '500: Error interno, reintente más tarde'
            });
        }
    }
}