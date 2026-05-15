import { SportRepository } from '../domain/SportRepository.js';

export class DeleteSportUseCase {
    constructor(private readonly sportRepo: SportRepository) {}

    async execute(id: string): Promise<void> {
        const existing = await this.sportRepo.findById(id);
        if (!existing) {
            throw new Error('El deporte ya ha sido eliminado o no existe');
        }

        await this.sportRepo.delete(id);
    }
}
