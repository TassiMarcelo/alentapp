import { FastifyRequest, FastifyReply } from 'fastify';
import { CreateMedicalCertificateUseCase } from '../application/CreateMedicalCertificateUseCase.js';
import { GetMedicalCertificatesUseCase } from '../application/GetMedicalCertificatesUseCase.js';
import { UpdateMedicalCertificateUseCase } from '../application/UpdateMedicalCertificateUseCase.js';
import { DeleteMedicalCertificateUseCase } from '../application/DeleteMedicalCertificateUseCase.js';
import { CreateMedicalCertificateRequest, UpdateMedicalCertificateRequest } from '@alentapp/shared';
import { ValidationError, NotFoundError, GoneError } from '../domain/errors.js';
import { paginationQuerySchema } from './shared/paginationSchema.js';

export class MedicalCertificateController {
    constructor(
        private createUseCase: CreateMedicalCertificateUseCase,
        private getUseCase: GetMedicalCertificatesUseCase,
        private updateUseCase: UpdateMedicalCertificateUseCase,
        private deleteUseCase: DeleteMedicalCertificateUseCase,
    ) {}

    // Mapea excepciones a códigos HTTP (TDD-0018 §Casos de Borde, TDD-0020 §Casos de Borde)
    private handleError(error: any, reply: FastifyReply) {
        if (error instanceof ValidationError) {
            return reply.status(400).send({ message: error.message });
        }
        if (error instanceof NotFoundError) {
            return reply.status(404).send({ message: error.message });
        }
        if (error instanceof GoneError) {
            return reply.status(410).send({ message: error.message });
        }
        return reply.status(500).send({ message: 'Error interno, reintente más tarde' });
    }

    async create(request: FastifyRequest, reply: FastifyReply) {
        try {
            const data = request.body as CreateMedicalCertificateRequest;
            const result = await this.createUseCase.execute(data);
            return reply.status(201).send(result);
        } catch (error: any) {
            return this.handleError(error, reply);
        }
    }

    // TDD-0019: PATCH /api/v1/medical-certificates/:id — edición parcial
    async update(
        request: FastifyRequest<{ Params: { id: string }; Body: unknown }>,
        reply: FastifyReply,
    ) {
        try {
            const { id } = request.params;
            const body = (request.body ?? {}) as Record<string, unknown>;

            // member_id es inmutable tras la creación (TDD-0019 §Casos de Borde)
            if (
                Object.prototype.hasOwnProperty.call(body, 'memberId') ||
                Object.prototype.hasOwnProperty.call(body, 'member_id')
            ) {
                throw new ValidationError('El campo member_id no puede modificarse');
            }

            const result = await this.updateUseCase.execute(
                id,
                body as UpdateMedicalCertificateRequest,
            );
            return reply.status(200).send(result);
        } catch (error: any) {
            return this.handleError(error, reply);
        }
    }

    // TDD-0020: DELETE /api/v1/medical-certificates/:id — borrado lógico
    async delete(
        request: FastifyRequest<{ Params: { id: string } }>,
        reply: FastifyReply,
    ) {
        try {
            const { id } = request.params;
            await this.deleteUseCase.execute(id);
            return reply.status(204).send();
        } catch (error: any) {
            return this.handleError(error, reply);
        }
    }

    async getAll(request: FastifyRequest, reply: FastifyReply) {
        const parsed = paginationQuerySchema.safeParse(request.query);
        if (!parsed.success) {
            const message = parsed.error.issues[0]?.message ?? 'Parámetro de paginación inválido';
            return reply.status(400).send({ message });
        }
        try {
            const result = await this.getUseCase.execute(parsed.data);
            return reply.status(200).send(result);
        } catch (error: any) {
            return this.handleError(error, reply);
        }
    }
}
