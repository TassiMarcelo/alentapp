import { DisciplineDTO, UpdateDisciplineRequest } from '@alentapp/shared';
import { DisciplineRepository } from '../domain/DisciplineRepository.js';
import { DisciplineValidator } from '../domain/services/DisciplineValidator.js';

export class UpdateDisciplineUseCase {
  constructor(
    private readonly disciplineRepository: DisciplineRepository,
    private readonly disciplineValidator: DisciplineValidator,
  ) {}

  async execute(id: string, data: UpdateDisciplineRequest): Promise<DisciplineDTO> {
    const hasAnyField =
      data.reason !== undefined ||
      data.start_date !== undefined ||
      data.end_date !== undefined ||
      data.is_total_suspension !== undefined;

    if (!hasAnyField) {
      throw new Error('Debe enviarse al menos un campo a actualizar');
    }

    if (data.is_total_suspension !== undefined && typeof data.is_total_suspension !== 'boolean') {
      throw new Error('El campo is_total_suspension debe ser booleano');
    }

    const existing = await this.disciplineRepository.findById(id);
    if (!existing) {
      throw new Error('La sanción indicada no existe');
    }

    if (data.start_date !== undefined || data.end_date !== undefined) {
      const start = new Date(data.start_date ?? existing.start_date);
      const end = new Date(data.end_date ?? existing.end_date);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        throw new Error('Fechas inválidas');
      }

      this.disciplineValidator.validateDates(start, end);
    }

    return this.disciplineRepository.update(id, data);
  }
}
