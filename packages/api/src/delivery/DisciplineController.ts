import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { CreateDisciplineRequest, UpdateDisciplineRequest } from '@alentapp/shared';
import { CreateDisciplineUseCase } from '../application/CreateDisciplineUseCase.js';
import { ListDisciplinesUseCase } from '../application/ListDisciplinesUseCase.js';
import { UpdateDisciplineUseCase } from '../application/UpdateDisciplineUseCase.js';
import { DeleteDisciplineUseCase } from '../application/DeleteDisciplineUseCase.js';

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

const updateBodySchema = z
  .object({
    reason: z.string().min(1, { message: 'El motivo no puede estar vacío' }).optional(),
    start_date: z.string().optional(),
    end_date: z.string().optional(),
    is_total_suspension: z.boolean({ message: 'El campo is_total_suspension debe ser booleano' }).optional(),
  })
  .strict();

export class DisciplineController {
  constructor(
    private readonly createDisciplineUseCase: CreateDisciplineUseCase,
    private readonly listDisciplinesUseCase: ListDisciplinesUseCase,
    private readonly updateDisciplineUseCase: UpdateDisciplineUseCase,
    private readonly deleteDisciplineUseCase: DeleteDisciplineUseCase,
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

  async update(
    request: FastifyRequest<{ Params: { id: string }; Body: unknown }>,
    reply: FastifyReply,
  ) {
    const body = (request.body ?? {}) as Record<string, unknown>;

    if (Object.prototype.hasOwnProperty.call(body, 'member_id')) {
      return reply.status(400).send({ error: 'El campo `member_id` no puede modificarse' });
    }

    const parsed = updateBodySchema.safeParse(body);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      const message = issue?.message ?? 'Cuerpo de petición inválido';
      return reply.status(400).send({ error: message });
    }

    try {
      const discipline = await this.updateDisciplineUseCase.execute(
        request.params.id,
        parsed.data as UpdateDisciplineRequest,
      );
      return reply.status(200).send(discipline);
    } catch (error: any) {
      if (
        error.message === 'Debe enviarse al menos un campo a actualizar' ||
        error.message === 'El campo is_total_suspension debe ser booleano' ||
        error.message === 'Fechas inválidas' ||
        error.message === 'La fecha de fin debe ser posterior a la de inicio'
      ) {
        return reply.status(400).send({ error: error.message });
      }
      if (error.message === 'La sanción indicada no existe') {
        return reply.status(404).send({ error: error.message });
      }
      return reply.status(500).send({ error: 'Error interno, reintente más tarde' });
    }
  }

  async delete(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) {
    try {
      await this.deleteDisciplineUseCase.execute(request.params.id);
      return reply.status(204).send();
    } catch (error: any) {
      if (error.message === 'La sanción indicada no existe') {
        return reply.status(404).send({ error: error.message });
      }
      return reply.status(500).send({ error: 'Error interno, reintente más tarde' });
    }
  }
}
