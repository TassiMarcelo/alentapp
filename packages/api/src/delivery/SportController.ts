import { FastifyRequest, FastifyReply } from 'fastify';
import { CreateSportUseCase } from '../application/CreateSportUseCase.js';
import { UpdateSportUseCase } from '../application/UpdateSportUseCase.js';
import { CreateSportRequest, UpdateSportRequest } from '@alentapp/shared';

export class SportController {
    constructor(
        private readonly createSportUseCase: CreateSportUseCase,
        private readonly updateSportUseCase: UpdateSportUseCase
    ) {}

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

    async update(
        request: FastifyRequest<{ Params: { id: string }, Body: UpdateSportRequest }>,
        reply: FastifyReply,
    ) {
        try {
            const { id } = request.params;
            const sport = await this.updateSportUseCase.execute(id, request.body);
            return reply.status(200).send(sport);
        } catch (error: any) {
            console.error('Update Sport Error:', error);
            if (error.message === 'El deporte solicitado no existe') {
                return reply.status(404).send({ error: error.message });
            }
            if (error.message === 'El nombre del deporte no es modificable' || 
                error.message === 'El cupo debe ser mayor a cero' ||
                error.message.includes('No se puede reducir el cupo por debajo')) {
                return reply.status(400).send({ error: error.message });
            }
            return reply.status(500).send({ error: 'Error interno, reintente más tarde' });
        }
    }
}
