import { FastifyRequest, FastifyReply } from 'fastify';
import { CreateSportUseCase } from '../application/CreateSportUseCase.js';
import { CreateSportRequest } from '@alentapp/shared';

export class SportController {
    constructor(private readonly createSportUseCase: CreateSportUseCase) {}

    async create(
        request: FastifyRequest<{ Body: CreateSportRequest }>,
        reply: FastifyReply,
    ) {
        try {
            const sport = await this.createSportUseCase.execute(request.body);
            return reply.status(201).send(sport);
        } catch (error: any) {
            if (error.message === 'El nombre y la capacidad máxima son requeridos' ||
                error.message === 'El cupo máximo debe ser mayor a cero') {
                return reply.status(400).send({ error: error.message });
            }
            if (error.message === 'Ya existe un deporte con ese nombre') {
                return reply.status(409).send({ error: error.message });
            }
            return reply.status(500).send({ error: 'Error interno, reintente más tarde' });
        }
    }
}
