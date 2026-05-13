import { FastifyRequest, FastifyReply } from 'fastify';
import { CreateLockerUseCase } from '../application/CreateLockerUseCase.js';
import { CreateLockerRequest } from '@alentapp/shared';

export class LockerController {
    constructor(
        private readonly createLockerUseCase: CreateLockerUseCase,
    ) {}

    async create(
        request: FastifyRequest<{ Body: CreateLockerRequest }>,
        reply: FastifyReply,
    ) {
        try {
            const locker = await this.createLockerUseCase.execute(request.body);
            return reply.status(201).send(locker);
        } catch (error: any) {
            if (error.message === 'Faltan campos requeridos' || 
                error.message === 'Ubicación inválida') {
                return reply.status(400).send({ error: error.message });
            }
            if (
                error.message === 'Ya existe un locker con ese número' ||
                error.message === 'Se alcanzó el límite máximo de lockers'
            ) {
                return reply.status(409).send({ error: error.message });
            }
            return reply.status(500).send({ error: 'Error interno, reintente más tarde' });
        }
    }
}