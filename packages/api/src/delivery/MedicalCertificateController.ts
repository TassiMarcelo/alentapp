import { FastifyRequest, FastifyReply } from 'fastify';
import { CreateMedicalCertificateUseCase } from '../application/CreateMedicalCertificateUseCase.js';
import { GetMedicalCertificatesUseCase } from '../application/GetMedicalCertificatesUseCase.js';
import { CreateMedicalCertificateRequest } from '@alentapp/shared';
import { ValidationError, NotFoundError } from '../domain/errors.js';

export class MedicalCertificateController {
    constructor(
        private createUseCase: CreateMedicalCertificateUseCase,
        private getUseCase: GetMedicalCertificatesUseCase,
    ) {}

    // Mapea excepciones a códigos HTTP (TDD-0018 §Casos de Borde)
    private handleError(error: any, reply: FastifyReply) {
        if (error instanceof ValidationError) {
            return reply.status(400).send({ message: error.message });
        }
        if (error instanceof NotFoundError) {
            return reply.status(404).send({ message: error.message });
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

    async getAll(_request: FastifyRequest, reply: FastifyReply) {
        try {
            const result = await this.getUseCase.execute();
            return reply.status(200).send(result);
        } catch (error: any) {
            return this.handleError(error, reply);
        }
    }
}
