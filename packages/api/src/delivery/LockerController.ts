import { FastifyRequest, FastifyReply } from 'fastify';
import { CreateLockerUseCase } from '../application/CreateLockerUseCase.js';
import { CreateLockerRequest } from '@alentapp/shared';
import { GetLockersUseCase } from '../application/GetLockersUseCase.js';
import { GetLockersFilters } from '@alentapp/shared';
import { UpdateLockerEstadoUseCase } from '../application/UpdateLockerEstadoUseCase.js';
import { UpdateLockerEstadoRequest } from '@alentapp/shared';
import { UpdateLockerUseCase } from '../application/UpdateLockerUseCase.js';
import { UpdateLockerRequest } from '@alentapp/shared';
import { DeleteLockerUseCase } from '../application/DeleteLockerUseCase.js';
import { paginationQuerySchema } from './shared/paginationSchema.js';

export class LockerController {
    constructor(
        private readonly getLockersUseCase: GetLockersUseCase,
        private readonly createLockerUseCase: CreateLockerUseCase,
        private readonly updateLockerEstadoUseCase: UpdateLockerEstadoUseCase,
        private readonly updateLockerUseCase: UpdateLockerUseCase,
        private readonly deleteLockerUseCase: DeleteLockerUseCase,

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

    async getAll(
        request: FastifyRequest<{ Querystring: GetLockersFilters }>,
        reply: FastifyReply,
    ) {
        const parsedPag = paginationQuerySchema.safeParse(request.query);
        if (!parsedPag.success) {
            const message = parsedPag.error.issues[0]?.message ?? 'Parámetro de paginación inválido';
            return reply.status(400).send({ error: message });
        }
        try {
            const { estado, ubicacion } = request.query;
            const result = await this.getLockersUseCase.execute({
                estado,
                ubicacion,
                page: parsedPag.data.page,
                page_size: parsedPag.data.page_size,
            });
            return reply.status(200).send(result);
        } catch (error: any) {
            if (error.message === 'Filtro inválido') {
                return reply.status(400).send({ error: error.message });
            }
            return reply.status(500).send({ error: 'Error interno, reintente más tarde' });
        }
    }

    async updateEstado(
        request: FastifyRequest<{ Params: { id: string }; Body: UpdateLockerEstadoRequest }>,
        reply: FastifyReply,
    ) {
        try {
            const { id } = request.params;
            const locker = await this.updateLockerEstadoUseCase.execute(id, request.body);
            return reply.status(200).send(locker);
        } catch (error: any) {
            if (
                error.message === 'El locker no existe' ||
                error.message === 'El socio no existe'
            ) {
                return reply.status(404).send({ error: error.message });
            }
            if (
                error.message === 'El locker ya se encuentra en ese estado' ||
                error.message.includes('No se puede')
            ) {
                return reply.status(409).send({ error: error.message });
            }
            if (
                error.message === 'El id ingresado no es válido' ||
                error.message === 'Estado inválido' ||
                error.message === 'Para asignar un locker se requiere memberId y fechaFinContrato' ||
                error.message === 'La fecha de fin debe ser futura'
            ) {
                return reply.status(400).send({ error: error.message });
            }
            return reply.status(500).send({ error: 'Error interno, reintente más tarde' });
        }
    }

    async update(
        request: FastifyRequest<{ Params: { id: string }; Body: UpdateLockerRequest }>,
        reply: FastifyReply,
    ) {
        try {
            const { id } = request.params;
            const locker = await this.updateLockerUseCase.execute(id, request.body);
            return reply.status(200).send(locker);
        } catch (error: any) {
            if (error.message === 'El locker no existe') {
                return reply.status(404).send({ error: error.message });
            }
            if (
                error.message === 'Ya existe un locker con ese número' ||
                error.message === 'No se puede modificar un locker que está ocupado'
            ) {
                return reply.status(409).send({ error: error.message });
            }
            if (
                error.message === 'Debe enviar al menos un campo a modificar' ||
                error.message === 'Ubicación inválida'
            ) {
                return reply.status(400).send({ error: error.message });
            }
            return reply.status(500).send({ error: 'Error interno, reintente más tarde' });
        }
    }

    async delete(
        request: FastifyRequest<{ Params: { id: string } }>,
        reply: FastifyReply,
    ) {
        try {
            const { id } = request.params;
            await this.deleteLockerUseCase.execute(id);
            return reply.status(204).send();
        } catch (error: any) {
            if (error.message === 'El locker no existe') {
                return reply.status(404).send({ error: error.message });
            }
            if (error.message === 'No se puede eliminar un locker que está ocupado') {
                return reply.status(409).send({ error: error.message });
            }
            if (error.message === 'El id ingresado no es válido') {
                return reply.status(400).send({ error: error.message });
            }
            return reply.status(500).send({ error: 'Error interno, reintente más tarde' });
        }
    }
}