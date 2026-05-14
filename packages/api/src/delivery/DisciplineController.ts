import { FastifyRequest, FastifyReply } from 'fastify';
import { CreateDisciplineRequest } from '@alentapp/shared';
import { CreateDisciplineUseCase } from '../application/CreateDisciplineUseCase.js';

export class DisciplineController {
  constructor(private readonly createDisciplineUseCase: CreateDisciplineUseCase) {}

  async create(
    request: FastifyRequest<{ Body: CreateDisciplineRequest }>,
    reply: FastifyReply,
  ) {
    try {
      const discipline = await this.createDisciplineUseCase.execute(request.body);
      return reply.status(201).send(discipline);
    } catch (error: any) {
      if (
        error.message === 'Faltan campos requeridos' ||
        error.message === 'El campo is_total_suspension debe ser booleano' ||
        error.message === 'Fechas inválidas' ||
        error.message === 'La fecha de fin debe ser posterior a la de inicio'
      ) {
        return reply.status(400).send({ error: error.message });
      }
      if (error.message === 'El socio indicado no existe') {
        return reply.status(404).send({ error: error.message });
      }
      return reply.status(500).send({ error: 'Error interno, reintente más tarde' });
    }
  }
}
