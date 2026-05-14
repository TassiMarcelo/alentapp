import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { CreateDisciplineRequest } from '@alentapp/shared';
import { CreateDisciplineUseCase } from '../application/CreateDisciplineUseCase.js';
import { ListDisciplinesUseCase } from '../application/ListDisciplinesUseCase.js';

const listQuerySchema = z.object({
  member_id: z
    .string()
    .uuid({ message: 'Formato de `member_id` inválido' })
    .optional(),
  status: z
    .enum(['active', 'expired', 'upcoming'], {
      message: 'Filtro `status` inválido',
    })
    .optional(),
  sort_desc: z
    .preprocess((val) => {
      if (val === undefined) return undefined;
      if (typeof val === 'boolean') return val;
      if (val === 'true') return true;
      if (val === 'false') return false;
      return val;
    }, z.boolean({ message: 'Filtro `sort_desc` debe ser booleano' }))
    .optional(),
});

export class DisciplineController {
  constructor(
    private readonly createDisciplineUseCase: CreateDisciplineUseCase,
    private readonly listDisciplinesUseCase: ListDisciplinesUseCase,
  ) {}

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

  async list(request: FastifyRequest, reply: FastifyReply) {
    const parsed = listQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? 'Query params inválidos';
      return reply.status(400).send({ error: message });
    }

    try {
      const disciplines = await this.listDisciplinesUseCase.execute(parsed.data);
      return reply.status(200).send(disciplines);
    } catch {
      return reply.status(500).send({ error: 'Error interno, reintente más tarde' });
    }
  }
}
