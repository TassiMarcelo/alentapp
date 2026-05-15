import { DisciplineDTO, CreateDisciplineRequest } from '@alentapp/shared';
import { DisciplineRepository } from '../domain/DisciplineRepository.js';
import { DisciplineValidator } from '../domain/services/DisciplineValidator.js';
import { MemberRepository } from '../domain/MemberRepository.js';

export class CreateDisciplineUseCase {
  constructor(
    private readonly disciplineRepository: DisciplineRepository,
    private readonly memberRepository: MemberRepository,
    private readonly disciplineValidator: DisciplineValidator,
  ) {}

  async execute(data: CreateDisciplineRequest): Promise<DisciplineDTO> {
    if (!data.reason || !data.start_date || !data.end_date || data.is_total_suspension === undefined || !data.member_id) {
      throw new Error('Faltan campos requeridos');
    }

    if (typeof data.is_total_suspension !== 'boolean') {
      throw new Error('El campo is_total_suspension debe ser booleano');
    }

    const start = new Date(data.start_date);
    const end = new Date(data.end_date);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new Error('Fechas inválidas');
    }

    this.disciplineValidator.validateDates(start, end);

    const member = await this.memberRepository.findById(data.member_id);
    if (!member) {
      throw new Error('El socio indicado no existe');
    }

    return this.disciplineRepository.create(data);
  }
}
