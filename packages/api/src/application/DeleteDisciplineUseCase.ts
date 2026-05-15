import { DisciplineRepository } from '../domain/DisciplineRepository.js';

export class DeleteDisciplineUseCase {
  constructor(private readonly disciplineRepository: DisciplineRepository) {}

  async execute(id: string): Promise<void> {
    const existing = await this.disciplineRepository.findById(id);
    if (!existing) {
      throw new Error('La sanción indicada no existe');
    }

    await this.disciplineRepository.softDelete(id);
  }
}
